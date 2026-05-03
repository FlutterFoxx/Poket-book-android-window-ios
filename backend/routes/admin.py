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


