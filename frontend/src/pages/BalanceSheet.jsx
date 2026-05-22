import { useEffect, useState, useCallback, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { api } from "@/contexts/AuthContext";
import { formatBalance, toTitleCase } from "@/utils/helpers";
import { toast } from "sonner";
import { RefreshCw, Printer, FileSpreadsheet, Camera } from "lucide-react";

const BalanceSheet = () => {
  const navigate = useNavigate();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const contentRef = useRef(null);

  const handleScreenshot = async () => {
    const el = contentRef.current;
    if (!el) return;
    const toastId = toast.loading("Capturing...");
    try {
      const html2canvas = (await import("html2canvas")).default;
      const canvas = await html2canvas(el, { useCORS: true, backgroundColor: "#fff", scale: 2 });
      const link = document.createElement("a");
      link.download = `balance-sheet_${new Date().toISOString().split("T")[0]}.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
      toast.dismiss(toastId);
      toast.success("Screenshot saved!", { duration: 1500 });
    } catch {
      toast.dismiss(toastId);
      toast.error("Screenshot failed", { duration: 2000 });
    }
  };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const res = await api.get("/api/balance-sheet");
      setData(res.data);
    } catch (err) {
      if (process.env.NODE_ENV === "development") { console.error("Balance sheet load failed:", err.message); }
    }
    setLoading(false);
  }, []);

  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => { fetchData(); }, []);

  const fmt = (n) => new Intl.NumberFormat("en-IN", { minimumFractionDigits: 2 }).format(Math.abs(n || 0));

  // Print function using Blob URL (no XSS)
  const handlePrint = () => {
    if (!data) return;
    const denaRows = (data.dena_hai || []).map((p, i) =>
      `<tr style="background:${i%2===0?"#fff":"#f9fafb"}">
        <td style="padding:8px 12px;font-size:14px;font-weight:600;color:#1D4ED8">${toTitleCase(p.name)}</td>
        <td style="padding:8px 12px;text-align:right;font-size:14px;font-weight:700;font-family:monospace;color:#1D4ED8">${fmt(p.amount)}</td>
      </tr>`).join("");
    const lenaRows = (data.lena_hai || []).map((p, i) =>
      `<tr style="background:${i%2===0?"#fff":"#f9fafb"}">
        <td style="padding:8px 12px;font-size:14px;font-weight:600;color:#B91C1C">${toTitleCase(p.name)}</td>
        <td style="padding:8px 12px;text-align:right;font-size:14px;font-weight:700;font-family:monospace;color:#B91C1C">${fmt(p.amount)}</td>
      </tr>`).join("");
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
<title>Balance Sheet — poketbook</title>
<style>
  body{font-family:Arial,sans-serif;margin:0;padding:16px;font-size:14px}
  h1{font-size:18px;font-weight:700;margin-bottom:4px}
  .date{font-size:12px;color:#666;margin-bottom:16px}
  .grid{display:grid;grid-template-columns:1fr 1fr;gap:16px}
  table{width:100%;border-collapse:collapse}
  th{padding:8px 12px;font-size:12px;font-weight:700;text-transform:uppercase;letter-spacing:0.5px;text-align:left}
  .col-header{color:#fff;padding:10px 12px;font-size:13px;font-weight:700}
  .total-row td{font-weight:700;border-top:2px solid #e5e7eb;padding:10px 12px}
  .summary{margin-top:16px;padding:12px;background:#f3f4f6;border-radius:8px}
  @page{margin:1.5cm}@media print{button{display:none}}
</style></head><body>
<h1>Balance Sheet</h1>
<div class="date">Generated: ${new Date().toLocaleDateString("en-IN",{day:"2-digit",month:"long",year:"numeric"})}</div>
<div class="grid">
  <div>
    <div class="col-header" style="background:#1E40AF">DENA HAI / देना है (Payable)</div>
    <table><thead><tr style="background:#EFF6FF"><th style="color:#1E40AF">Party Name</th><th style="color:#1E40AF;text-align:right">Amount (₹)</th></tr></thead>
    <tbody>${denaRows || '<tr><td colspan="2" style="padding:16px;text-align:center;color:#999">No entries</td></tr>'}</tbody>
    <tfoot><tr class="total-row"><td style="color:#1D4ED8">Total Dena Hai</td><td style="text-align:right;color:#1D4ED8;font-family:monospace">₹${fmt(data.total_payable)}</td></tr></tfoot>
    </table>
  </div>
  <div>
    <div class="col-header" style="background:#991B1B">LENA HAI / लेना है (Receivable)</div>
    <table><thead><tr style="background:#FEF2F2"><th style="color:#991B1B">Party Name</th><th style="color:#991B1B;text-align:right">Amount (₹)</th></tr></thead>
    <tbody>${lenaRows || '<tr><td colspan="2" style="padding:16px;text-align:center;color:#999">No entries</td></tr>'}</tbody>
    <tfoot><tr class="total-row"><td style="color:#B91C1C">Total Lena Hai</td><td style="text-align:right;color:#B91C1C;font-family:monospace">₹${fmt(data.total_receivable)}</td></tr></tfoot>
    </table>
  </div>
</div>
<div class="summary">
  <b>Summary:</b>&nbsp;
  Total Dena: ₹${fmt(data.total_payable)} &nbsp;|&nbsp;
  Total Lena: ₹${fmt(data.total_receivable)} &nbsp;|&nbsp;
  Net Balance: ${formatBalance(data.net_balance).text}
</div>
</body></html>`;
    const blob = new Blob([html], { type: "text/html; charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const w = window.open(url, "_blank", "width=900,height=600");
    if (w) { w.addEventListener("load", () => { setTimeout(() => { w.print(); URL.revokeObjectURL(url); }, 500); }); }
  };

  const netBal = formatBalance(data?.net_balance || 0);
  const lena = data?.lena_hai || [];
  const dena = data?.dena_hai || [];

  // Authenticated Excel download (direct <a href> won't include auth token)
  const handleExcelDownload = async () => {
    try {
      const res = await api.get("/api/export/balance-sheet/excel", { responseType: "blob" });
      const url = URL.createObjectURL(res.data);
      const a = document.createElement("a");
      a.href = url; a.download = `PoketBook_BalanceSheet_${new Date().toISOString().split("T")[0]}.xlsx`;
      document.body.appendChild(a); a.click();
      document.body.removeChild(a); URL.revokeObjectURL(url);
    } catch { import("sonner").then(m => m.toast.error("Excel download failed", { duration: 1500 })); }
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", background: "var(--bg-page)", fontFamily: "var(--font-body)" }}>

      {/* ── Header ─────────────────────────────────────────────── */}
      <div style={{ background: "var(--primary-gradient)", color: "#fff", padding: "12px 16px", flexShrink: 0 }}>

        {/* Desktop header row: title + all buttons inline */}
        <div className="hidden md:flex" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 }}>Balance Sheet</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex" }} data-testid="bs-refresh-btn">
              <RefreshCw size={15} />
            </button>
            <button onClick={handlePrint} style={{ background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-pdf-btn">
              <Printer size={14} /> Print / PDF
            </button>
            <button onClick={handleExcelDownload} style={{ background: "#16A34A", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-export-excel-btn">
              <FileSpreadsheet size={14} /> Excel
            </button>
            <button onClick={handleScreenshot} style={{ background: "#0891B2", border: "none", borderRadius: "8px", padding: "7px 13px", cursor: "pointer", color: "#fff", fontSize: "13px", fontWeight: 600, display: "flex", alignItems: "center", gap: "5px" }} data-testid="bs-screenshot-btn" title="Screenshot PNG">
              <Camera size={14} /> Screenshot
            </button>
          </div>
        </div>

        {/* Mobile header: title + refresh in one row */}
        <div className="flex md:hidden" style={{ alignItems: "center", justifyContent: "space-between", gap: "8px" }}>
          <div>
            <h1 style={{ fontSize: "18px", fontWeight: 700, fontFamily: "var(--font-heading)", margin: 0 }}>Balance Sheet</h1>
            <p style={{ fontSize: "12px", color: "rgba(255,255,255,0.7)", margin: "2px 0 0" }}>
              {new Date().toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" })}
            </p>
          </div>
          <button onClick={fetchData} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-refresh-btn">
            <RefreshCw size={15} />
          </button>
          <button onClick={handleScreenshot} style={{ background: "rgba(255,255,255,0.15)", border: "none", borderRadius: "8px", padding: "8px", cursor: "pointer", color: "#fff", display: "flex", flexShrink: 0 }} data-testid="bs-screenshot-btn-mobile" title="Screenshot">
            <Camera size={15} />
          </button>
        </div>

        {/* Mobile-only: Print + Excel full-width */}
        <div className="flex md:hidden" style={{ gap: "8px", marginTop: "10px" }}>
          <button onClick={handlePrint} style={{ flex: 1, background: "rgba(255,255,255,0.2)", border: "1px solid rgba(255,255,255,0.3)", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-pdf-btn-m">
            <Printer size={16} /> Print / PDF
          </button>
          <button onClick={handleExcelDownload} style={{ flex: 1, background: "#16A34A", border: "none", borderRadius: "8px", padding: "10px 8px", cursor: "pointer", color: "#fff", fontSize: "14px", fontWeight: 700, display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }} data-testid="bs-export-excel-btn-m">
            <FileSpreadsheet size={16} /> Excel
          </button>
        </div>

      </div>

      {/* ── Two independently scrollable columns ────────────────── */}
      {loading ? (
        <div style={{ flex: 1, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <div className="w-8 h-8 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: "var(--primary)", borderTopColor: "transparent" }} />
        </div>
      ) : (
        <div ref={contentRef} style={{ flex: 1, display: "flex", gap: 0, overflow: "hidden", minHeight: 0 }}>

          {/* ── LEFT: DENA HAI (Blue) — independently scrollable ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", borderRight: "2px solid var(--border)", minWidth: 0, overflow: "hidden" }}>
            {/* Column header */}
            <div style={{ background: "#1E40AF", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>DENA HAI / देना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Payable (Blue)</div>
            </div>
            {/* Column sub-header */}
            <div style={{ display: "flex", background: "#EFF6FF", borderBottom: "0.5px solid #BFDBFE", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "#1E40AF", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {dena.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>Koi Dena party nahi</div>
              ) : dena.map((p, i) => (
                <div key={p.id} onClick={() => navigate(`/ledger/${p.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: i % 2 === 0 ? "#fff" : "#F8FAFF", borderBottom: "0.5px solid #DBEAFE", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#EFF6FF"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#F8FAFF"}
                  data-testid={`dena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#1D4ED8" }}>{toTitleCase(p.name)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid={`dena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            {/* Column total footer */}
            <div style={{ borderTop: "2px solid #BFDBFE", background: "#DBEAFE", padding: "10px 16px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#1E40AF" }}>Total Dena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#1D4ED8" }} data-testid="dena-total">₹{fmt(data.total_payable)}</span>
            </div>
          </div>

          {/* ── RIGHT: LENA HAI (Red) — independently scrollable ── */}
          <div style={{ flex: 1, display: "flex", flexDirection: "column", minWidth: 0, overflow: "hidden" }}>
            {/* Column header */}
            <div style={{ background: "#991B1B", color: "#fff", padding: "10px 16px", flexShrink: 0 }}>
              <div style={{ fontSize: "13px", fontWeight: 700, letterSpacing: "0.5px" }}>LENA HAI / लेना है</div>
              <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)", marginTop: "1px" }}>Receivable (Red)</div>
            </div>
            {/* Column sub-header */}
            <div style={{ display: "flex", background: "#FEF2F2", borderBottom: "0.5px solid #FECACA", flexShrink: 0 }}>
              <div style={{ flex: 1, padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px" }}>Party Name</div>
              <div style={{ padding: "8px 16px", fontSize: "12px", fontWeight: 700, color: "#991B1B", textTransform: "uppercase", letterSpacing: "0.5px", textAlign: "right" }}>Amount (₹)</div>
            </div>
            {/* Scrollable list */}
            <div style={{ flex: 1, overflowY: "auto", overflowX: "hidden" }}>
              {lena.length === 0 ? (
                <div style={{ padding: "32px 16px", textAlign: "center", color: "var(--text-tertiary)", fontSize: "14px" }}>Koi Lena party nahi</div>
              ) : lena.map((p, i) => (
                <div key={p.id} onClick={() => navigate(`/ledger/${p.id}`)}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between", padding: "11px 16px", background: i % 2 === 0 ? "#fff" : "#FFF8F8", borderBottom: "0.5px solid #FECACA", cursor: "pointer", transition: "background 0.15s" }}
                  onMouseEnter={e => e.currentTarget.style.background = "#FEF2F2"}
                  onMouseLeave={e => e.currentTarget.style.background = i % 2 === 0 ? "#fff" : "#FFF8F8"}
                  data-testid={`lena-name-${p.id}`}>
                  <span style={{ fontSize: "14px", fontWeight: 600, color: "#B91C1C" }}>{toTitleCase(p.name)}</span>
                  <span style={{ fontSize: "14px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B91C1C" }} data-testid={`lena-amount-${p.id}`}>{fmt(p.amount)}</span>
                </div>
              ))}
            </div>
            {/* Column total footer */}
            <div style={{ borderTop: "2px solid #FECACA", background: "#FEE2E2", padding: "10px 16px", display: "flex", justifyContent: "space-between", flexShrink: 0 }}>
              <span style={{ fontSize: "13px", fontWeight: 700, color: "#991B1B" }}>Total Lena Hai</span>
              <span style={{ fontSize: "15px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "#B91C1C" }} data-testid="lena-total">₹{fmt(data.total_receivable)}</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default BalanceSheet;
