from dotenv import load_dotenv
load_dotenv()
import os, io, logging, secrets, string, base64
from fastapi import APIRouter, Request, HTTPException, Depends, Response
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import uuid as uuid_lib
from core import (db, get_current_user, SubscriptionUpdate, SUBSCRIPTION_DAYS)
from pydantic import BaseModel

router = APIRouter(prefix="/api")

# ─── Superadmin Panel ─────────────────────────────────────────────────────────

def _require_superadmin(current_user: dict):
    if current_user.get("role") not in ["superadmin", "admin"]:
        raise HTTPException(status_code=403, detail="Superadmin access required")

@router.get("/superadmin/stats")
async def sa_stats(current_user: dict = Depends(get_current_user)):
    _require_superadmin(current_user)
    now = datetime.now(timezone.utc)
    total = await db.users.count_documents({"role": {"$nin": ["superadmin", "admin"]}})
    active = await db.users.count_documents({"role": {"$nin": ["superadmin","admin"]}, "subscription_expires_at": {"$gt": now}})
    trial = await db.users.count_documents({"role": {"$nin": ["superadmin","admin"]}, "subscription_type": "trial", "subscription_expires_at": {"$gt": now}})
    return {"total_users": total, "active_subscriptions": active, "trial_users": trial, "expired": total - active}

@router.get("/superadmin/users")
async def sa_get_users(current_user: dict = Depends(get_current_user)):
    _require_superadmin(current_user)
    users = await db.users.find({"role": {"$nin": ["superadmin", "admin"]}}).sort("created_at", -1).to_list(None)
    now = datetime.now(timezone.utc)
    result = []
    for u in users:
        sub_exp = u.get("subscription_expires_at")
        if sub_exp and sub_exp.tzinfo is None:
            sub_exp = sub_exp.replace(tzinfo=timezone.utc)
        is_active = bool(sub_exp and now <= sub_exp)
        days_rem = max(0, (sub_exp - now).days) if sub_exp and is_active else 0
        result.append({
            "id": str(u["_id"]), "name": u.get("name", ""), "email": u.get("email") or "",
            "phone": u.get("phone", ""), "created_at": str(u.get("created_at", "")),
            "subscription_type": u.get("subscription_type", "trial"),
            "subscription_expires_at": str(sub_exp) if sub_exp else None,
            "subscription_active": is_active, "days_remaining": days_rem,
        })
    return result

@router.post("/superadmin/users/{user_id}/subscription")
async def sa_update_subscription(user_id: str, data: SubscriptionUpdate, current_user: dict = Depends(get_current_user)):
    _require_superadmin(current_user)
    days = data.duration_days or SUBSCRIPTION_DAYS.get(data.subscription_type, 30)
    now = datetime.now(timezone.utc)
    await db.users.update_one({"_id": ObjectId(user_id)}, {"$set": {
        "subscription_type": data.subscription_type,
        "subscription_started_at": now,
        "subscription_expires_at": now + timedelta(days=days),
        "subscription_is_active": True,
    }})
    return {"message": f"Subscription set to {data.subscription_type} for {days} days"}


# ─── AI Natural Language Entry Parser ────────────────────────────────────────

class AIParseRequest(BaseModel):
    text: str
    parties: List[str] = []   # existing party names for matching

@router.post("/ai/parse-entry")
async def ai_parse_entry(data: AIParseRequest, current_user: dict = Depends(get_current_user)):
    """Parse Hindi/English natural language into ledger entry fields.
    e.g. 'Vansh ko 500 dena hai' → {party: 'Vansh', amount: 500, type: 'naam'}
    """
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not llm_key:
            raise HTTPException(400, "AI not configured")

        party_list = ", ".join(data.parties[:30]) if data.parties else "none"
        chat = LlmChat(
            api_key=llm_key,
            session_id=f"parse_{current_user['_id']}_{datetime.now().timestamp()}",
            system_message="""You are an accounting assistant for an Indian ledger app (PoketBook).
Parse natural language Hindi/English text into structured ledger entry data.

ACCOUNTING RULES:
- NAAM (Credit) = party owes us / party took from us / lena hai party se = type "naam"
- JAMA (Debit) = party paid us / party gave us money / dena hai mujhe = type "jama"

Examples:
"Vansh ko 500 dena hai" → naam (Vansh owes us 500 / we gave credit to Vansh)
"Ramesh se 1000 lena hai" → naam (Ramesh owes us 1000)
"Suresh ne 200 diya" → jama (Suresh paid us 200)
"Mujhe Deepak ko 300 dena hai" → jama (we owe Deepak)
"Priya ka 1500 baaki hai" → naam (Priya owes us)

Return ONLY valid JSON, no explanation:
{"party": "Name", "amount": 500, "type": "naam|jama", "narration": "brief note", "confidence": 0.9}

If amount or party unclear, set confidence < 0.5."""
        ).with_model("openai", "gpt-4.1-mini")

        msg = UserMessage(text=f"Known parties: {party_list}\n\nText to parse: {data.text}")
        response = await chat.send_message(msg)

        import json as _json
        # Extract JSON from response
        txt = response.strip()
        if "```" in txt:
            txt = txt.split("```")[1].replace("json", "").strip()
        result = _json.loads(txt)
        return result
    except Exception as e:
        logging.error(f"AI parse error: {e}")
        raise HTTPException(500, f"AI parse failed: {str(e)}")



# ─── AI Self-Healing Agent ────────────────────────────────────────────────────

class HealRequest(BaseModel):
    issue: str
    context: Optional[str] = ""

@router.post("/superadmin/ai-heal")
async def ai_heal(data: HealRequest, current_user: dict = Depends(get_current_user)):
    """AI agent that diagnoses and suggests fixes for system issues."""
    _require_superadmin(current_user)
    try:
        from emergentintegrations.llm.chat import LlmChat, UserMessage
        llm_key = os.environ.get("EMERGENT_LLM_KEY", "")
        if not llm_key:
            raise HTTPException(400, "AI not configured")

        chat = LlmChat(
            api_key=llm_key,
            session_id=f"heal_{current_user['_id']}_{datetime.now().timestamp()}",
            system_message="""You are PoketBook's AI Self-Healing Agent. You diagnose and fix issues in a FastAPI+React ledger app.

You can diagnose:
- Authentication errors (login failures, token issues)
- Database connection issues (MongoDB down, query errors)
- API endpoint errors (5xx, 4xx, timeout)
- Frontend crashes (React errors, JS exceptions)
- Performance issues (slow queries, high memory)
- Data integrity issues (wrong balance calculations)

For each issue, provide:
1. ROOT CAUSE: What exactly is wrong
2. SEVERITY: Critical/High/Medium/Low
3. AUTO-FIX: Specific code or config change to fix it
4. PREVENTION: How to prevent it recurring
5. STATUS CHECK: How to verify the fix worked

Be specific and actionable. Format your response as JSON with these exact keys:
{
  "root_cause": "...",
  "severity": "Critical|High|Medium|Low",
  "auto_fix": "...",
  "prevention": "...",
  "status_check": "...",
  "confidence": 0.0-1.0
}"""
        ).with_model("openai", "gpt-4.1-mini")

        # Gather system context
        db_status = "unknown"
        try:
            await db.command("ping")
            db_status = "connected"
        except Exception as e:
            db_status = f"error: {e}"

        user_count = await db.users.count_documents({})
        party_count = await db.parties.count_documents({"is_deleted": {"$ne": True}})
        entry_count = await db.ledger_entries.count_documents({"is_deleted": {"$ne": True}})

        system_context = f"""
System Status:
- MongoDB: {db_status}
- Total users: {user_count}
- Total parties: {party_count}
- Total entries: {entry_count}
- Backend: FastAPI running
- Environment: Production (poketbook.in)

User-reported issue: {data.issue}
Additional context: {data.context or 'None'}
"""

        msg = UserMessage(text=system_context)
        response = await chat.send_message(msg)

        import json as _json
        txt = response.strip()
        if "```" in txt:
            txt = txt.split("```")[1].replace("json", "").strip()
        result = _json.loads(txt)

        # Log the healing session
        await db.ai_heal_log.insert_one({
            "issue": data.issue,
            "diagnosis": result,
            "admin_id": current_user["_id"],
            "timestamp": datetime.now(timezone.utc),
        })

        return result
    except Exception as e:
        logging.error(f"AI heal error: {e}")
        raise HTTPException(500, f"AI agent error: {str(e)}")

@router.get("/superadmin/ai-heal/history")
async def ai_heal_history(current_user: dict = Depends(get_current_user)):
    """Get recent AI healing sessions."""
    _require_superadmin(current_user)
    docs = await db.ai_heal_log.find(
        {}, {"_id": 0},
        sort=[("timestamp", -1)],
        limit=20
    ).to_list(None)
    return docs

@router.get("/superadmin/health-check")
async def system_health_check(current_user: dict = Depends(get_current_user)):
    """Automated system health check."""
    _require_superadmin(current_user)
    checks = {}

    # DB check
    try:
        await db.command("ping")
        checks["database"] = {"status": "ok", "message": "MongoDB connected"}
    except Exception as e:
        checks["database"] = {"status": "error", "message": str(e)}

    # Collections check
    try:
        uc = await db.users.count_documents({})
        pc = await db.parties.count_documents({"is_deleted": {"$ne": True}})
        ec = await db.ledger_entries.count_documents({"is_deleted": {"$ne": True}})
        checks["data"] = {"status": "ok", "users": uc, "parties": pc, "entries": ec}
    except Exception as e:
        checks["data"] = {"status": "error", "message": str(e)}

    # Auth check
    try:
        admin = await db.users.find_one({"role": "admin"})
        checks["auth"] = {"status": "ok" if admin else "warn", "message": "Admin exists" if admin else "No admin found"}
    except Exception as e:
        checks["auth"] = {"status": "error", "message": str(e)}

    overall = "ok" if all(v["status"] == "ok" for v in checks.values()) else "degraded"
    checks["overall"] = overall
    return checks

# ─── Feature Consistency Audit ────────────────────────────────────────────────

@router.get("/superadmin/feature-audit")
async def feature_audit(current_user: dict = Depends(get_current_user)):
    """Audit users for missing subscription/feature data and auto-fix."""
    _require_superadmin(current_user)
    now = datetime.now(timezone.utc)
    issues = []
    fixed = 0

    users = await db.users.find({}).to_list(None)
    for u in users:
        uid = u["_id"]
        user_issues = []

        # Check for missing subscription fields
        if not u.get("subscription_type"):
            user_issues.append("missing subscription_type")
            await db.users.update_one({"_id": uid}, {"$set": {
                "subscription_type": "trial",
                "subscription_started_at": now,
                "subscription_expires_at": now + timedelta(days=7),
            }})
            fixed += 1

        # Check for missing email_verified field (new security field)
        if "email_verified" not in u:
            # Existing users get verified=True (backward compatibility)
            await db.users.update_one({"_id": uid}, {"$set": {"email_verified": True}})
            user_issues.append("added email_verified=True (existing user)")
            fixed += 1

        # Check for missing created_at
        if not u.get("created_at"):
            await db.users.update_one({"_id": uid}, {"$set": {"created_at": now}})
            user_issues.append("added missing created_at")
            fixed += 1

        if user_issues:
            issues.append({
                "user_id": str(uid),
                "email": u.get("email", ""),
                "issues": user_issues
            })

    return {
        "total_users": len(users),
        "users_with_issues": len(issues),
        "fixes_applied": fixed,
        "details": issues[:50],  # Cap at 50 for readability
        "status": "ok" if not issues else "fixed"
    }


@router.get("/superadmin/security-audit")
async def security_audit(current_user: dict = Depends(get_current_user)):
    """Security audit: recent login attempts, suspicious activity."""
    _require_superadmin(current_user)
    # Recent failed logins
    failed = await db.login_attempts.find(
        {}, {"_id": 0}, sort=[("last_attempt", -1)], limit=20
    ).to_list(None)
    # Recent audit logs
    audit = await db.audit_logs.find(
        {}, {"_id": 0}, sort=[("timestamp", -1)], limit=50
    ).to_list(None)
    # Suspicious: IPs with high attempt count
    suspicious = [a for a in failed if a.get("count", 0) >= 3]
    return {
        "failed_login_attempts": len(failed),
        "suspicious_ips": suspicious,
        "recent_security_events": audit[:20],
    }

