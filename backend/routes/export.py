from dotenv import load_dotenv
load_dotenv()
import os, io, logging, secrets, string, base64
from fastapi import APIRouter, Request, HTTPException, Depends, Response
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import uuid as uuid_lib
from core import *

router = APIRouter(prefix="/api")

# ─── Export Helper Functions ──────────────────────────────────────────────────

def fmt_inr(amount: float) -> str:
    return f"Rs.{abs(float(amount)):,.2f}"

def _format_balance_text(bal: float) -> str:
    """Format a balance value as human-readable Lena/Dena text."""
    if bal > 0:
        return f"{fmt_inr(bal)} Lena Hai"
    if bal < 0:
        return f"{fmt_inr(bal)} Dena Hai"
    return "Settled"

def _build_date_query(start_date: Optional[str], end_date: Optional[str]) -> dict:
    """Build a MongoDB date range sub-query."""
    if not start_date and not end_date:
        return {}
    date_q: dict = {}
    if start_date:
        date_q["$gte"] = start_date
    if end_date:
        date_q["$lte"] = end_date
    return {"date": date_q}

async def _load_entries_with_cp_names(party_id: str, extra_query: dict) -> tuple[list, dict]:
    """Fetch ledger entries and return (entries, counterparty_name_map)."""
    query = {"party_id": party_id, "is_deleted": {"$ne": True}, **extra_query}
    entries = await db.ledger_entries.find(
        query, sort=[("date", 1), ("created_at", 1)]
    ).to_list(None)
    cp_ids = list({e["counterparty_id"] for e in entries if e.get("counterparty_id")})
    cp_map: dict = {}
    if cp_ids:
        cps = await db.parties.find({"_id": {"$in": [ObjectId(c) for c in cp_ids]}}).to_list(None)
        cp_map = {str(c["_id"]): c["name"] for c in cps}
    return entries, cp_map

def _build_ledger_pdf_table_data(entries: list, cp_map: dict) -> list:
    """Convert ledger entries to a list of rows for the PDF table."""
    headers = ["Date", "Party Name", "Credit (नाम)", "Debit (जमा)", "Narration", "Balance", "Status"]
    rows = [headers]
    for e in entries:
        rows.append([
            e.get("date", ""),
            cp_map.get(e.get("counterparty_id", ""), "—"),
            fmt_inr(e.get("naam", 0)) if e.get("naam", 0) > 0 else "-",
            fmt_inr(e.get("jama", 0)) if e.get("jama", 0) > 0 else "-",
            str(e.get("narration", "") or "")[:35],
            _format_balance_text(e.get("balance", 0)),
            "Locked" if e.get("is_locked") else "Open",
        ])
    return rows

def _build_ledger_pdf_table_style():
    """Return the TableStyle for the ledger PDF table."""
    from reportlab.platypus import TableStyle
    from reportlab.lib import colors
    return TableStyle([
        ("BACKGROUND", (0, 0), (-1, 0), colors.HexColor("#8B4513")),
        ("TEXTCOLOR", (0, 0), (-1, 0), colors.white),
        ("FONTNAME", (0, 0), (-1, 0), "Helvetica-Bold"),
        ("FONTSIZE", (0, 0), (-1, -1), 8),
        ("ROWBACKGROUNDS", (0, 1), (-1, -1), [colors.HexColor("#FFE8CC"), colors.HexColor("#FFDAB0")]),
        ("GRID", (0, 0), (-1, -1), 0.5, colors.HexColor("#D6D3D1")),
        ("ALIGN", (2, 1), (3, -1), "RIGHT"),
        ("ALIGN", (5, 1), (5, -1), "RIGHT"),
        ("TOPPADDING", (0, 0), (-1, -1), 4),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 4),
    ])

def _build_excel_ledger(party_name: str, date_range: str, entries: list, cp_map: dict):
    """Create and populate an openpyxl workbook for a ledger export."""
    import openpyxl
    from openpyxl.styles import Font, PatternFill
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = str(party_name)[:31]
    ws.append(["Statement", party_name])
    ws.append(["Period", date_range])
    ws.append(["Generated", datetime.now().strftime("%d-%m-%Y %H:%M")])
    ws.append([])
    headers = ["Date", "Party Name", "Credit/Naam", "Debit/Jama", "Narration", "Balance", "Balance Type", "Status"]
    ws.append(headers)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=5, column=col)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="8B4513")
    for e in entries:
        bal = e.get("balance", 0)
        bal_type = "Lena Hai" if bal > 0 else ("Dena Hai" if bal < 0 else "Settled")
        cp_name = cp_map.get(e.get("counterparty_id", ""), "")
        ws.append([
            e.get("date", ""), cp_name,
            e.get("naam", 0) or "", e.get("jama", 0) or "",
            e.get("narration", "") or "", abs(bal), bal_type,
            "Locked" if e.get("is_locked") else "Open",
        ])
    return wb

# ─── Export Routes (simplified using helpers above) ───────────────────────────

@router.get("/export/ledger/{party_id}/pdf")
async def export_ledger_pdf(
    party_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    from reportlab.lib.pagesizes import landscape, A4
    from reportlab.platypus import SimpleDocTemplate, Table, Paragraph, Spacer
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib.enums import TA_RIGHT

    p = await db.parties.find_one({"_id": ObjectId(party_id), "user_id": current_user["_id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Party not found")

    entries, cp_map = await _load_entries_with_cp_names(party_id, _build_date_query(start_date, end_date))
    date_range = f"{start_date or 'All'} to {end_date or 'Today'}"
    styles = getSampleStyleSheet()
    brand_style = ParagraphStyle("brand", fontSize=7, textColor=__import__("reportlab.lib.colors", fromlist=["colors"]).HexColor("#6B7280"), alignment=TA_RIGHT)

    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=landscape(A4), leftMargin=30, rightMargin=30, topMargin=30, bottomMargin=30)
    table_data = _build_ledger_pdf_table_data(entries, cp_map)
    t = Table(table_data, colWidths=[60, 80, 80, 80, 160, 110, 50])
    t.setStyle(_build_ledger_pdf_table_style())
    elements = [
        Paragraph(f"Statement: {p['name']}", styles["Title"]),
        Paragraph(f"Period: {date_range}   |   Generated: {datetime.now().strftime('%d-%m-%Y %H:%M')}", styles["Normal"]),
        Spacer(1, 12),
        t,
        Spacer(1, 8),
        Paragraph("PoketBook — Digital Udhar Khaata | Powered by Flutter Fox (flutterfox.in)", brand_style),
    ]
    doc.build(elements)
    buf.seek(0)
    return Response(content=buf.read(), media_type="application/pdf",
                    headers={"Content-Disposition": f"attachment; filename=Statement_{p['name']}.pdf"})

@router.get("/export/ledger/{party_id}/excel")
async def export_ledger_excel(
    party_id: str,
    start_date: Optional[str] = None,
    end_date: Optional[str] = None,
    current_user: dict = Depends(get_current_user)
):
    p = await db.parties.find_one({"_id": ObjectId(party_id), "user_id": current_user["_id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Party not found")

    entries, cp_map = await _load_entries_with_cp_names(party_id, _build_date_query(start_date, end_date))
    date_range = f"{start_date or 'All'} to {end_date or 'Today'}"
    wb = _build_excel_ledger(p["name"], date_range, entries, cp_map)

    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(content=buf.read(),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename=Statement_{p['name']}.xlsx"})
    import openpyxl
    from openpyxl.styles import Font, PatternFill
    p = await db.parties.find_one({"_id": ObjectId(party_id), "user_id": current_user["_id"]})
    if not p:
        raise HTTPException(status_code=404, detail="Party not found")
    query = {"party_id": party_id, "is_deleted": {"$ne": True}}
    if start_date or end_date:
        date_q = {}
        if start_date:
            date_q["$gte"] = start_date
        if end_date:
            date_q["$lte"] = end_date
        query["date"] = date_q
    entries = await db.ledger_entries.find(query, sort=[("date", 1), ("created_at", 1)]).to_list(None)
    # Batch-load counterparty names
    cp_ids = list({e["counterparty_id"] for e in entries if e.get("counterparty_id")})
    cp_map = {}
    if cp_ids:
        cps = await db.parties.find({"_id": {"$in": [ObjectId(cid) for cid in cp_ids]}}).to_list(None)
        cp_map = {str(c["_id"]): c["name"] for c in cps}
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = str(p["name"])[:31]
    ws.append(["Statement", p["name"]])
    ws.append(["Period", f"{start_date or 'All'} to {end_date or 'Today'}"])
    ws.append(["Generated", datetime.now().strftime("%d-%m-%Y %H:%M")])
    ws.append([])
    headers = ["Date", "Party Name", "Credit/Naam (लेना)", "Debit/Jama (देना)", "Narration", "Balance", "Balance Type", "Status"]
    ws.append(headers)
    for col in range(1, len(headers) + 1):
        cell = ws.cell(row=5, column=col)
        cell.font = Font(bold=True, color="FFFFFF")
        cell.fill = PatternFill("solid", fgColor="8B4513")
    for e in entries:
        bal = e.get("balance", 0)
        bal_type = "Lena Hai" if bal > 0 else ("Dena Hai" if bal < 0 else "Settled")
        cp_name = cp_map.get(e.get("counterparty_id", ""), "")
        ws.append([e.get("date", ""), cp_name,
                   e.get("naam", 0) or "", e.get("jama", 0) or "",
                   e.get("narration", "") or "", abs(bal), bal_type,
                   "Locked" if e.get("is_locked") else "Open"])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(content=buf.read(),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": f"attachment; filename=Statement_{p['name']}.xlsx"})

@router.get("/export/balance-sheet/pdf")
async def export_bs_pdf(current_user: dict = Depends(get_current_user)):
    from reportlab.lib.pagesizes import A4, landscape
    from reportlab.platypus import SimpleDocTemplate, Table, TableStyle, Paragraph, Spacer, HRFlowable
    from reportlab.lib.styles import getSampleStyleSheet, ParagraphStyle
    from reportlab.lib import colors
    from reportlab.lib.units import mm
    from reportlab.lib.enums import TA_CENTER, TA_RIGHT, TA_LEFT

    data = await get_balance_sheet(current_user)
    buf = io.BytesIO()
    doc = SimpleDocTemplate(buf, pagesize=A4, leftMargin=20*mm, rightMargin=20*mm, topMargin=15*mm, bottomMargin=15*mm)

    styles = getSampleStyleSheet()
    title_style = ParagraphStyle("title", fontSize=16, fontName="Helvetica-Bold", alignment=TA_CENTER, spaceAfter=4)
    sub_style   = ParagraphStyle("sub",   fontSize=9,  fontName="Helvetica",      alignment=TA_CENTER, textColor=colors.HexColor("#6B7280"), spaceAfter=12)

    BLUE   = colors.HexColor("#1E40AF")
    BLUE_L = colors.HexColor("#DBEAFE")
    BLUE_T = colors.HexColor("#1D4ED8")
    RED    = colors.HexColor("#991B1B")
    RED_L  = colors.HexColor("#FEE2E2")
    RED_T  = colors.HexColor("#B91C1C")
    GREY   = colors.HexColor("#F9FAFB")
    BORDER = colors.HexColor("#E5E7EB")

    dena = data["dena_hai"]   # Blue column — Left
    lena = data["lena_hai"]   # Red column  — Right
    max_rows = max(len(dena), len(lena), 1)

    # Column widths: [name, amount,  gap, name, amount]
    COL = [90*mm, 35*mm, 4*mm, 90*mm, 35*mm]

    # Header row
    hdr_name_style = ParagraphStyle("hdr", fontSize=9, fontName="Helvetica-Bold", textColor=colors.white, alignment=TA_LEFT)
    hdr_amt_style  = ParagraphStyle("hdr_r", fontSize=9, fontName="Helvetica-Bold", textColor=colors.white, alignment=TA_RIGHT)

    def _row(dena_p, dena_a, lena_p, lena_a, is_total=False):
        fn = "Helvetica-Bold" if is_total else "Helvetica"
        dc = BLUE_T if not is_total else BLUE
        rc = RED_T  if not is_total else RED
        return [
            Paragraph(f'<font name="{fn}" color="{dc.hexval()}">{dena_p}</font>', ParagraphStyle("c", fontSize=8, fontName=fn)),
            Paragraph(f'<font name="{fn}" color="{dc.hexval()}">{dena_a}</font>', ParagraphStyle("r", fontSize=8, fontName=fn, alignment=TA_RIGHT)),
            "",
            Paragraph(f'<font name="{fn}" color="{rc.hexval()}">{lena_p}</font>', ParagraphStyle("c2", fontSize=8, fontName=fn)),
            Paragraph(f'<font name="{fn}" color="{rc.hexval()}">{lena_a}</font>', ParagraphStyle("r2", fontSize=8, fontName=fn, alignment=TA_RIGHT)),
        ]

    table_data = [[
        Paragraph(f"DENA HAI / देना है  [{len(dena)} parties]", hdr_name_style),
        Paragraph("Amount (₹)", hdr_amt_style),
        "",
        Paragraph(f"LENA HAI / लेना है  [{len(lena)} parties]", hdr_name_style),
        Paragraph("Amount (₹)", hdr_amt_style),
    ]]

    for i in range(max_rows):
        dp = dena[i] if i < len(dena) else {}
        lp = lena[i] if i < len(lena) else {}
        table_data.append(_row(
            dp.get("name", ""), fmt_inr(dp["amount"]) if dp.get("name") else "",
            lp.get("name", ""), fmt_inr(lp["amount"]) if lp.get("name") else "",
        ))

    # Totals row
    table_data.append(_row(
        "TOTAL PAYABLE", fmt_inr(data["total_payable"]),
        "TOTAL RECEIVABLE", fmt_inr(data["total_receivable"]),
        is_total=True,
    ))

    t = Table(table_data, colWidths=COL, repeatRows=1)
    row_styles = []
    for i in range(1, max_rows + 1):
        bg = colors.white if i % 2 == 1 else GREY
        row_styles.append(("BACKGROUND", (0, i), (1, i), bg))
        row_styles.append(("BACKGROUND", (3, i), (4, i), bg))

    t.setStyle(TableStyle([
        # Header
        ("BACKGROUND",   (0, 0), (1, 0), BLUE),
        ("BACKGROUND",   (3, 0), (4, 0), RED),
        ("BACKGROUND",   (2, 0), (2, -1), colors.white),   # gap col
        ("ROWBACKGROUNDS", (2, 0), (2, -1), [colors.white]),
        # Borders
        ("BOX",          (0, 0), (1, -1), 0.5, BORDER),
        ("BOX",          (3, 0), (4, -1), 0.5, BORDER),
        ("INNERGRID",    (0, 0), (1, -1), 0.3, BORDER),
        ("INNERGRID",    (3, 0), (4, -1), 0.3, BORDER),
        ("LINEABOVE",    (0, -1), (1, -1), 1.5, BLUE),
        ("LINEABOVE",    (3, -1), (4, -1), 1.5, RED),
        # Total row backgrounds
        ("BACKGROUND",   (0, -1), (1, -1), BLUE_L),
        ("BACKGROUND",   (3, -1), (4, -1), RED_L),
        # Padding
        ("TOPPADDING",    (0, 0), (-1, -1), 5),
        ("BOTTOMPADDING", (0, 0), (-1, -1), 5),
        ("LEFTPADDING",   (0, 0), (-1, -1), 6),
        ("RIGHTPADDING",  (0, 0), (-1, -1), 6),
        ("VALIGN",        (0, 0), (-1, -1), "MIDDLE"),
        *row_styles,
    ]))

    # Net balance row
    net = data.get("net_balance", 0)
    net_label = "Net Payable (Dena > Lena)" if net > 0 else ("Net Receivable (Lena > Dena)" if net < 0 else "Balanced")
    net_color  = "#1E40AF" if net > 0 else ("#991B1B" if net < 0 else "#374151")
    net_style  = ParagraphStyle("net", fontSize=9, fontName="Helvetica-Bold",
                                textColor=colors.HexColor(net_color), alignment=TA_RIGHT)

    brand_style = ParagraphStyle("brand_bs", fontSize=7, fontName="Helvetica",
                                  textColor=colors.HexColor("#9CA3AF"), alignment=TA_RIGHT)
    elements = [
        Paragraph("Balance Sheet", title_style),
        Paragraph(f"Generated: {datetime.now(timezone.utc).strftime('%d %B %Y')}", sub_style),
        t,
        Spacer(1, 6),
        Paragraph(f"Net Balance: ₹{fmt_inr(abs(net))} — {net_label}", net_style),
        Spacer(1, 4),
        Paragraph("PoketBook — Digital Udhar Khaata | Powered by Flutter Fox (flutterfox.in)", brand_style),
    ]
    doc.build(elements)
    buf.seek(0)
    return Response(content=buf.read(), media_type="application/pdf",
                    headers={"Content-Disposition": "attachment; filename=PoketBook_BalanceSheet.pdf"})

@router.get("/export/balance-sheet/excel")
async def export_bs_excel(current_user: dict = Depends(get_current_user)):
    import openpyxl
    from openpyxl.styles import Font
    data = await get_balance_sheet(current_user)
    wb = openpyxl.Workbook()
    ws = wb.active
    ws.title = "Balance Sheet"
    ws.append(["Balance Sheet"])
    ws.append(["Generated", datetime.now().strftime("%d-%m-%Y %H:%M")])
    ws.append([])
    ws.append(["Lena Hai (Receivable)", "Amount", "", "Dena Hai (Payable)", "Amount"])
    for cell in ws[4]:
        cell.font = Font(bold=True)
    max_rows = max(len(data["lena_hai"]), len(data["dena_hai"]), 1)
    for i in range(max_rows):
        lena_row = data["lena_hai"][i] if i < len(data["lena_hai"]) else {}
        dena_row = data["dena_hai"][i] if i < len(data["dena_hai"]) else {}
        ws.append([lena_row.get("name", ""), lena_row.get("amount", "") or "", "", dena_row.get("name", ""), dena_row.get("amount", "") or ""])
    ws.append(["TOTAL RECEIVABLE", data["total_receivable"], "", "TOTAL PAYABLE", data["total_payable"]])
    ws.append(["NET BALANCE", data["net_balance"]])
    buf = io.BytesIO()
    wb.save(buf)
    buf.seek(0)
    return Response(content=buf.read(),
                    media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
                    headers={"Content-Disposition": "attachment; filename=balance_sheet.xlsx"})


# ─── CSV/Google Sheets Backup ─────────────────────────────────────────────────

@router.get("/export/csv-backup")
async def export_csv_backup(current_user: dict = Depends(get_current_user)):
    """Export all user data as CSV — ready to import into Google Sheets"""
    import csv
    parties = await db.parties.find({"user_id": current_user["_id"], "is_deleted": {"$ne": True}}).to_list(None)
    buf = io.StringIO()
    writer = csv.writer(buf)
    writer.writerow(["=== PARTIES ==="])
    writer.writerow(["ID", "Name", "Mobile", "Address", "Current Balance"])
    for p in parties:
        pid = str(p["_id"])
        bal = await get_party_balance(pid)
        writer.writerow([pid, p["name"], p.get("mobile",""), p.get("address",""), bal])
    writer.writerow([])
    writer.writerow(["=== LEDGER ENTRIES ==="])
    writer.writerow(["Date", "Party", "Counterparty", "Credit/Naam", "Debit/Jama", "Narration", "Balance", "Locked"])
    for p in parties:
        pid = str(p["_id"])
        entries = await db.ledger_entries.find({"party_id": pid, "is_deleted": {"$ne": True}}, sort=[("date",1)]).to_list(None)
        cp_ids = list({e["counterparty_id"] for e in entries if e.get("counterparty_id")})
        cp_map = {}
        if cp_ids:
            cps = await db.parties.find({"_id": {"$in": [ObjectId(c) for c in cp_ids]}}).to_list(None)
            cp_map = {str(c["_id"]): c["name"] for c in cps}
        for e in entries:
            writer.writerow([e.get("date",""), p["name"], cp_map.get(e.get("counterparty_id",""),""),
                             e.get("naam",0), e.get("jama",0), e.get("narration",""),
                             e.get("balance",0), "Yes" if e.get("is_locked") else "No"])
    csv_content = buf.getvalue().encode("utf-8-sig")  # UTF-8 BOM for Excel/Sheets compatibility
    return Response(content=csv_content, media_type="text/csv",
                    headers={"Content-Disposition": f"attachment; filename=poketbook_backup_{datetime.now().strftime('%Y%m%d')}.csv"})

