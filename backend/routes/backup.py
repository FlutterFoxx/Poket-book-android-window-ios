from dotenv import load_dotenv
load_dotenv()
import os, io, logging, secrets, string, base64
from fastapi import APIRouter, Request, HTTPException, Depends, Response
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import uuid as uuid_lib
from core import (db, get_current_user, _fmt_dt, GOOGLE_SCOPES, NEXT_BACKUP_DELTA, BackupSettings)

router = APIRouter(prefix="/api")

# ─── Google Sheets OAuth ───────────────────────────────────────────────────────

def _build_redirect_uri(request: Request) -> str:
    """Always use the configured GOOGLE_REDIRECT_URI env var — exact match required by Google."""
    return os.environ.get("GOOGLE_REDIRECT_URI", "")

@router.get("/oauth/sheets/connect")
async def sheets_connect_url(request: Request, current_user: dict = Depends(get_current_user)):
    """Returns Google OAuth URL for Sheets access"""
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "PLACEHOLDER")
    redirect_uri = _build_redirect_uri(request)
    if client_secret == "PLACEHOLDER":
        return {"error": "Google Sheets integration not configured.", "configured": False}
    try:
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {"web": {"client_id": client_id, "client_secret": client_secret,
                     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                     "token_uri": "https://oauth2.googleapis.com/token"}},
            scopes=GOOGLE_SCOPES,
            redirect_uri=redirect_uri
        )
        url, state = flow.authorization_url(access_type="offline", prompt="consent")
        await db.oauth_states.insert_one({
            "state": state, "user_id": current_user["_id"],
            "redirect_uri": redirect_uri,
            "expires_at": datetime.now(timezone.utc) + timedelta(minutes=10)
        })
        return {"url": url, "configured": True}
    except Exception as e:
        logging.error(f"Sheets OAuth error: {e}")
        return {"error": str(e), "configured": False}

@router.get("/oauth/sheets/callback")
async def sheets_oauth_callback(request: Request, code: str = None, state: str = None, error: str = None):
    """Handle OAuth callback from Google — store tokens and redirect to app"""
    from fastapi.responses import RedirectResponse
    if error or not code:
        return RedirectResponse(url="/?sheets=error")
    try:
        state_doc = await db.oauth_states.find_one({"state": state})
        if not state_doc:
            return RedirectResponse(url="/?sheets=error&reason=invalid_state")
        user_id = state_doc["user_id"]
        # Use the redirect_uri stored at connect time (must match Google exactly)
        redirect_uri = state_doc.get("redirect_uri") or _build_redirect_uri(request)
        await db.oauth_states.delete_one({"state": state})
        client_id = os.environ.get("GOOGLE_CLIENT_ID")
        client_secret = os.environ.get("GOOGLE_CLIENT_SECRET")
        from google_auth_oauthlib.flow import Flow
        flow = Flow.from_client_config(
            {"web": {"client_id": client_id, "client_secret": client_secret,
                     "auth_uri": "https://accounts.google.com/o/oauth2/auth",
                     "token_uri": "https://oauth2.googleapis.com/token"}},
            scopes=GOOGLE_SCOPES,
            redirect_uri=redirect_uri
        )
        flow.fetch_token(code=code)
        creds = flow.credentials
        await db.users.update_one({"_id": ObjectId(user_id) if not isinstance(user_id, ObjectId) else user_id}, {"$set": {
            "google_access_token": creds.token,
            "google_refresh_token": creds.refresh_token,
            "google_token_expiry": creds.expiry.isoformat() if creds.expiry else None,
            "google_sheets_connected": True,
        }})
        # Use request origin so callback works across all environments (preview, prod, custom domain)
        origin = (
            request.headers.get("origin")
            or request.headers.get("referer", "").rstrip("/").rsplit("/export", 1)[0]
            or os.environ.get("FRONTEND_URL", "http://localhost:3000")
        )
        return RedirectResponse(url=f"{origin}/export?sheets=connected")
    except Exception as e:
        logging.error(f"OAuth callback error: {e}")
        origin = os.environ.get("FRONTEND_URL", "http://localhost:3000")
        return RedirectResponse(url=f"{origin}/?sheets=error")

@router.post("/export/google-sheets-backup")
async def backup_to_google_sheets(current_user: dict = Depends(get_current_user)):
    """Write all user data to Google Sheets and return the sheet URL"""
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user or not user.get("google_sheets_connected"):
        raise HTTPException(400, "Google Sheets not connected. Please connect first.")
    access_token = user.get("google_access_token")
    refresh_token = user.get("google_refresh_token")
    if not access_token and not refresh_token:
        raise HTTPException(400, "Google credentials missing. Please reconnect.")
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        creds = Credentials(
            token=access_token,
            refresh_token=refresh_token,
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ.get("GOOGLE_CLIENT_ID"),
            client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        )
        sheets_svc = build("sheets", "v4", credentials=creds)
        existing_sheet_id = user.get("google_sheet_id")
        if existing_sheet_id:
            try:
                sheets_svc.spreadsheets().get(spreadsheetId=existing_sheet_id).execute()
                sheet_id = existing_sheet_id
            except Exception:
                existing_sheet_id = None
        if not existing_sheet_id:
            spreadsheet = {
                "properties": {"title": f"PoketBook Backup — {user.get('name','User')}"},
                "sheets": [
                    {"properties": {"title": "Parties", "index": 0}},
                    {"properties": {"title": "Ledger Entries", "index": 1}},
                ]
            }
            result = sheets_svc.spreadsheets().create(body=spreadsheet).execute()
            sheet_id = result["spreadsheetId"]
            await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {"google_sheet_id": sheet_id}})
        # Fetch all data
        uid = current_user["_id"]
        parties = await db.parties.find({"user_id": uid, "is_deleted": {"$ne": True}}).to_list(None)

        # Batch-fetch all party balances in one aggregation (avoids N+1 per party)
        party_ids = [str(p["_id"]) for p in parties]
        bal_pipeline = [
            {"$match": {"party_id": {"$in": party_ids}, "is_deleted": {"$ne": True}}},
            {"$sort": {"date": 1, "created_at": 1}},
            {"$group": {"_id": "$party_id", "balance": {"$last": "$balance"}}},
        ]
        bal_map = {r["_id"]: r["balance"] for r in await db.ledger_entries.aggregate(bal_pipeline).to_list(None)}

        # Parties sheet
        parties_rows = [["ID", "Name", "Mobile", "Address", "Current Balance", "Created At"]]
        for p in parties:
            pid = str(p["_id"])
            bal = bal_map.get(pid, 0)
            parties_rows.append([pid, p["name"], p.get("mobile",""), p.get("address",""), bal, str(p.get("created_at",""))])

        # Batch-fetch ALL entries for this user's parties (avoids N+1 per party)
        all_entries_raw = await db.ledger_entries.find(
            {"party_id": {"$in": party_ids}, "is_deleted": {"$ne": True}},
            sort=[("date", 1), ("created_at", 1)]
        ).to_list(None)

        # Batch-fetch all counterparty names
        cp_ids = list({e.get("counterparty_id","") for e in all_entries_raw if e.get("counterparty_id")})
        cp_docs = await db.parties.find({"_id": {"$in": [ObjectId(c) for c in cp_ids if c]}}).to_list(None)
        cp_cache = {str(c["_id"]): c["name"] for c in cp_docs}

        # Group entries by party_id
        from collections import defaultdict
        entries_by_party: dict = defaultdict(list)
        for e in all_entries_raw:
            entries_by_party[e["party_id"]].append(e)
        party_name_map = {str(p["_id"]): p["name"] for p in parties}

        # Ledger entries sheet
        entries_rows = [["Date", "Time", "Party", "Counterparty", "Credit (Naam)", "Debit (Jama)", "Narration", "Balance", "Balance Type", "Locked"]]
        for pid in party_ids:
            p_name = party_name_map.get(pid, "")
            for e in entries_by_party.get(pid, []):
                cp_id = e.get("counterparty_id","")
                bal = e.get("balance", 0)
                bal_type = "Dena Hai" if bal > 0 else ("Lena Hai" if bal < 0 else "Settled")
                created = str(e.get("created_at",""))
                time_str = ""
                try:
                    from datetime import datetime as dt2
                    d = dt2.fromisoformat(created.replace("+00:00",""))
                    time_str = (d + timedelta(hours=5, minutes=30)).strftime("%I:%M %p IST")
                except Exception:
                    pass
                entries_rows.append([e.get("date",""), time_str, p_name, cp_cache.get(cp_id,""),
                                     e.get("naam",0) or "", e.get("jama",0) or "",
                                     e.get("narration","") or "", abs(bal), bal_type,
                                     "Yes" if e.get("is_locked") else "No"])
        # Clear and write sheets
        sheets_svc.spreadsheets().values().clear(spreadsheetId=sheet_id, range="Parties!A1:Z10000").execute()
        sheets_svc.spreadsheets().values().update(spreadsheetId=sheet_id, range="Parties!A1",
            valueInputOption="RAW", body={"values": parties_rows}).execute()
        sheets_svc.spreadsheets().values().clear(spreadsheetId=sheet_id, range="Ledger Entries!A1:Z100000").execute()
        sheets_svc.spreadsheets().values().update(spreadsheetId=sheet_id, range="Ledger Entries!A1",
            valueInputOption="RAW", body={"values": entries_rows}).execute()
        # Save last backup time and update token
        if creds.token != access_token:
            await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {"google_access_token": creds.token}})
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {"google_last_backup": datetime.now(timezone.utc).isoformat()}})
        sheet_url = f"https://docs.google.com/spreadsheets/d/{sheet_id}"
        return {"success": True, "sheet_url": sheet_url, "sheet_id": sheet_id,
                "parties_count": len(parties), "entries_count": len(entries_rows) - 1}
    except Exception as e:
        logging.error(f"Google Sheets backup error: {e}")
        raise HTTPException(500, f"Backup failed: {str(e)}")

@router.get("/export/sheets-status")
async def sheets_status(current_user: dict = Depends(get_current_user)):
    """Check if Google Sheets is connected for this user"""
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    return {
        "connected": bool(user and user.get("google_sheets_connected")),
        "sheet_id": user.get("google_sheet_id") if user else None,
        "sheet_url": f"https://docs.google.com/spreadsheets/d/{user.get('google_sheet_id')}" if user and user.get("google_sheet_id") else None,
        "last_backup": user.get("google_last_backup") if user else None,
    }

# ─── Backup Settings + Gmail Send + APScheduler ───────────────────────────────

NEXT_BACKUP_DELTA = {"daily": timedelta(days=1), "weekly": timedelta(weeks=1), "monthly": timedelta(days=30)}

async def _get_google_creds(user: dict):
    from google.oauth2.credentials import Credentials
    return Credentials(
        token=user.get("google_access_token"),
        refresh_token=user.get("google_refresh_token"),
        token_uri="https://oauth2.googleapis.com/token",
        client_id=os.environ.get("GOOGLE_CLIENT_ID"),
        client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
    )

async def _generate_csv_bytes(uid: str) -> bytes:
    """Generate complete CSV backup bytes for a user"""
    import csv as csv_mod
    from collections import defaultdict
    buf = io.StringIO()
    writer = csv_mod.writer(buf)
    parties = await db.parties.find({"user_id": uid, "is_deleted": {"$ne": True}}).to_list(None)
    party_ids = [str(p["_id"]) for p in parties]

    # Batch-fetch all balances in one aggregation
    bal_pipeline = [
        {"$match": {"party_id": {"$in": party_ids}, "is_deleted": {"$ne": True}}},
        {"$sort": {"date": 1, "created_at": 1}},
        {"$group": {"_id": "$party_id", "balance": {"$last": "$balance"}}},
    ]
    bal_map = {r["_id"]: r["balance"] for r in await db.ledger_entries.aggregate(bal_pipeline).to_list(None)}

    writer.writerow(["=== PARTIES ==="])
    writer.writerow(["ID", "Name", "Mobile", "Address", "Balance"])
    for p in parties:
        pid = str(p["_id"])
        writer.writerow([pid, p["name"], p.get("mobile",""), p.get("address",""), bal_map.get(pid, 0)])

    # Batch-fetch all entries
    all_entries_raw = await db.ledger_entries.find(
        {"party_id": {"$in": party_ids}, "is_deleted": {"$ne": True}},
        sort=[("date", 1)]
    ).to_list(None)

    # Batch-fetch all counterparty names
    cp_ids = list({e.get("counterparty_id","") for e in all_entries_raw if e.get("counterparty_id")})
    cp_docs = await db.parties.find({"_id": {"$in": [ObjectId(c) for c in cp_ids if c]}}).to_list(None)
    cp_cache: dict = {str(c["_id"]): c["name"] for c in cp_docs}

    entries_by_party: dict = defaultdict(list)
    for e in all_entries_raw:
        entries_by_party[e["party_id"]].append(e)
    party_name_map = {str(p["_id"]): p["name"] for p in parties}

    writer.writerow([])
    writer.writerow(["=== LEDGER ENTRIES ==="])
    writer.writerow(["Date", "Party", "Counterparty", "Credit(Naam)", "Debit(Jama)", "Narration", "Balance", "Type", "Locked"])
    for pid in party_ids:
        p_name = party_name_map.get(pid, "")
        for e in entries_by_party.get(pid, []):
            cp_id = e.get("counterparty_id","")
            bal = e.get("balance", 0)
            bal_type = "Dena Hai" if bal > 0 else ("Lena Hai" if bal < 0 else "Settled")
            writer.writerow([e.get("date",""), p_name, cp_cache.get(cp_id,""),
                             e.get("naam",0) or "", e.get("jama",0) or "",
                             e.get("narration","") or "", abs(bal), bal_type,
                             "Yes" if e.get("is_locked") else "No"])
    return buf.getvalue().encode("utf-8-sig")

async def _send_backup_via_gmail(user: dict) -> str:
    """Send backup CSV as email attachment via Gmail API. Returns recipient email."""
    from googleapiclient.discovery import build
    creds = await _get_google_creds(user)
    gmail_svc = build("gmail", "v1", credentials=creds)
    backup_email = user.get("backup_email") or user.get("email")
    if not backup_email:
        raise ValueError("No backup email configured")
    uid = str(user["_id"])
    csv_bytes = await _generate_csv_bytes(uid)
    today_str = datetime.now().strftime("%d %b %Y")
    msg = MIMEMultipart()
    msg["To"] = backup_email
    msg["From"] = "me"
    msg["Subject"] = f"PoketBook Backup — {today_str}"
    body_text = f"""Namaste!

Aapka PoketBook data backup attached hai — {today_str}

Is backup mein yeh data hai:
• Sab parties (naam, mobile, address, balance)
• Sab ledger entries (date, credit/debit, narration, balance)

Is CSV file ko Google Sheets ya Excel mein import kar sakte hain.

— Team PoketBook
poketbook.in"""
    msg.attach(MIMEText(body_text, "plain"))
    att = MIMEBase("application", "octet-stream")
    att.set_payload(csv_bytes)
    encoders.encode_base64(att)
    filename = f"poketbook_backup_{datetime.now().strftime('%Y%m%d')}.csv"
    att.add_header("Content-Disposition", f"attachment; filename={filename}")
    msg.attach(att)
    raw = base64.urlsafe_b64encode(msg.as_bytes()).decode()
    gmail_svc.users().messages().send(userId="me", body={"raw": raw}).execute()
    # Update tokens if refreshed
    if creds.token != user.get("google_access_token"):
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"google_access_token": creds.token}})
    return backup_email

@router.get("/backup/settings")
async def get_backup_settings(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    return {
        "backup_email": user.get("backup_email") or user.get("email") or "",
        "backup_frequency": user.get("backup_frequency", "off"),
        "last_backup": user.get("last_email_backup"),
        "next_backup": str(user.get("next_backup_at", "")) if user.get("next_backup_at") else None,
        "google_connected": bool(user and user.get("google_sheets_connected")),
    }

@router.post("/backup/settings")
async def save_backup_settings(data: BackupSettings, current_user: dict = Depends(get_current_user)):
    now = datetime.now(timezone.utc)
    next_at = now + NEXT_BACKUP_DELTA.get(data.backup_frequency, timedelta(days=999))
    await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {
        "backup_email": data.backup_email,
        "backup_frequency": data.backup_frequency,
        "next_backup_at": next_at if data.backup_frequency != "off" else None,
    }})
    return {"message": "Backup settings saved", "next_backup": str(next_at) if data.backup_frequency != "off" else None}

@router.post("/backup/send-now")
async def send_backup_now(current_user: dict = Depends(get_current_user)):
    user = await db.users.find_one({"_id": ObjectId(current_user["_id"])})
    if not user or not user.get("google_sheets_connected"):
        raise HTTPException(400, "Google account not connected. Please connect first in the Statement page.")
    try:
        sent_to = await _send_backup_via_gmail(user)
        freq = user.get("backup_frequency", "off")
        now = datetime.now(timezone.utc)
        next_at = now + NEXT_BACKUP_DELTA.get(freq, timedelta(days=999)) if freq != "off" else None
        await db.users.update_one({"_id": ObjectId(current_user["_id"])}, {"$set": {
            "last_email_backup": now.isoformat(),
            "next_backup_at": next_at,
        }})
        return {"success": True, "sent_to": sent_to, "message": f"Backup email sent to {sent_to}"}
    except Exception as e:
        logging.error(f"Backup send error: {e}")
        raise HTTPException(500, f"Backup failed: {str(e)}")

async def _scheduled_backup_task():
    """APScheduler task — runs every hour, sends backup to due users"""
    now = datetime.now(timezone.utc)
    due_users = await db.users.find({
        "backup_frequency": {"$in": ["daily", "weekly", "monthly"]},
        "backup_email": {"$exists": True, "$ne": ""},
        "next_backup_at": {"$lte": now},
        "google_sheets_connected": True,
    }).to_list(None)
    for user in due_users:
        try:
            await _send_backup_via_gmail(user)
            freq = user.get("backup_frequency", "weekly")
            next_at = now + NEXT_BACKUP_DELTA.get(freq, timedelta(weeks=1))
            await db.users.update_one({"_id": user["_id"]}, {"$set": {
                "last_email_backup": now.isoformat(),
                "next_backup_at": next_at,
            }})
            logging.info(f"Scheduled backup sent to {user.get('backup_email')}")
        except Exception as e:
            logging.error(f"Scheduled backup failed for {user.get('_id')}: {e}")


# ─── Google Drive CSV Backup (replaces Google Sheets UI) ─────────────────────

@router.get("/backup/drive-status")
async def get_drive_status(current_user: dict = Depends(get_current_user)):
    """Check if user has Google Drive connected + last backup time."""
    user = await db.users.find_one({"_id": current_user["_id"]}, {"_id": 0})
    connected = bool(user and user.get("google_access_token"))
    last_backup = user.get("last_drive_backup") if user else None
    return {
        "connected": connected,
        "last_backup": _fmt_dt(last_backup) if last_backup else None,
    }

@router.post("/backup/drive-sync")
async def sync_to_drive(current_user: dict = Depends(get_current_user)):
    """Upload full data as CSV to Google Drive. Creates/updates PoketBook_Backup.csv."""
    user = await db.users.find_one({"_id": current_user["_id"]})
    if not user or not user.get("google_access_token"):
        raise HTTPException(400, "Google Drive not connected — connect first")
    try:
        from google.oauth2.credentials import Credentials
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaInMemoryUpload
        import io, csv as csv_mod

        creds = Credentials(
            token=user.get("google_access_token"),
            refresh_token=user.get("google_refresh_token"),
            token_uri="https://oauth2.googleapis.com/token",
            client_id=os.environ.get("GOOGLE_CLIENT_ID"),
            client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
        )
        drive_svc = build("drive", "v3", credentials=creds, cache_discovery=False)

        # Build CSV content
        output = io.StringIO()
        writer = csv_mod.writer(output)
        writer.writerow(["Party", "Mobile", "Address", "Balance", "Date"])
        uid = current_user["_id"]
        parties = await db.parties.find({"user_id": uid, "is_deleted": {"$ne": True}}).to_list(None)
        for p in parties:
            pid = str(p["_id"])
            entries = await db.ledger_entries.find(
                {"party_id": pid, "is_deleted": {"$ne": True}},
                sort=[("date", 1)]
            ).to_list(None)
            for e in entries:
                writer.writerow([
                    p.get("name",""), p.get("mobile",""), p.get("address",""),
                    e.get("balance",0), e.get("date",""),
                ])
        csv_bytes = output.getvalue().encode("utf-8")
        media = MediaInMemoryUpload(csv_bytes, mimetype="text/csv", resumable=False)

        # Check if backup file already exists
        file_name = "PoketBook_Backup.csv"
        existing_id = user.get("google_drive_file_id")
        if existing_id:
            try:
                drive_svc.files().update(fileId=existing_id, media_body=media).execute()
            except Exception:
                existing_id = None  # File deleted — recreate

        if not existing_id:
            file_meta = {"name": file_name, "mimeType": "text/csv"}
            result = drive_svc.files().create(body=file_meta, media_body=media, fields="id").execute()
            existing_id = result["id"]
            await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"google_drive_file_id": existing_id}})

        now = datetime.now(timezone.utc)
        await db.users.update_one({"_id": current_user["_id"]}, {"$set": {"last_drive_backup": now}})
        return {"message": "Backup synced to Google Drive", "file_id": existing_id}

    except Exception as e:
        logging.error(f"Drive sync error: {e}")
        raise HTTPException(500, f"Sync failed: {str(e)[:100]}")

# ─── Scheduled daily Drive backup (called by APScheduler every 24h) ──────────

async def run_scheduled_backups():
    """Called by APScheduler every 24h — syncs Google Drive CSV for all connected users."""
    try:
        from googleapiclient.discovery import build
        from googleapiclient.http import MediaInMemoryUpload
        from google.oauth2.credentials import Credentials
        import io, csv as csv_mod

        users = await db.users.find({"google_access_token": {"$exists": True, "$ne": None}}).to_list(None)
        logging.info(f"Daily Drive sync: {len(users)} users")

        for user in users:
            try:
                uid = str(user["_id"])
                creds = Credentials(
                    token=user.get("google_access_token"),
                    refresh_token=user.get("google_refresh_token"),
                    token_uri="https://oauth2.googleapis.com/token",
                    client_id=os.environ.get("GOOGLE_CLIENT_ID"),
                    client_secret=os.environ.get("GOOGLE_CLIENT_SECRET"),
                )
                drive_svc = build("drive", "v3", credentials=creds, cache_discovery=False)
                output = io.StringIO()
                writer = csv_mod.writer(output)
                writer.writerow(["Party", "Mobile", "Address", "Balance", "Date"])
                parties = await db.parties.find({"user_id": uid, "is_deleted": {"$ne": True}}).to_list(None)
                for p in parties:
                    pid = str(p["_id"])
                    entries = await db.ledger_entries.find(
                        {"party_id": pid, "is_deleted": {"$ne": True}}, sort=[("date", 1)]
                    ).to_list(None)
                    for e in entries:
                        writer.writerow([p.get("name",""), p.get("mobile",""), p.get("address",""), e.get("balance",0), e.get("date","")])
                csv_bytes = output.getvalue().encode("utf-8")
                media = MediaInMemoryUpload(csv_bytes, mimetype="text/csv", resumable=False)
                existing_id = user.get("google_drive_file_id")
                if existing_id:
                    try:
                        drive_svc.files().update(fileId=existing_id, media_body=media).execute()
                    except Exception:
                        existing_id = None
                if not existing_id:
                    r = drive_svc.files().create(body={"name": "PoketBook_Backup.csv"}, media_body=media, fields="id").execute()
                    existing_id = r["id"]
                    await db.users.update_one({"_id": user["_id"]}, {"$set": {"google_drive_file_id": existing_id}})
                await db.users.update_one({"_id": user["_id"]}, {"$set": {"last_drive_backup": datetime.now(timezone.utc)}})
            except Exception as e:
                logging.error(f"Drive sync failed for user {uid}: {e}")
    except Exception as e:
        logging.error(f"Scheduled backup error: {e}")
