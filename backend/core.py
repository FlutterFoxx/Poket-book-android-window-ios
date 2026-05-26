from dotenv import load_dotenv
load_dotenv()

import os
import io
import logging
import bcrypt
import jwt
import secrets
import string
import base64
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
from email.mime.base import MIMEBase
from email import encoders
from fastapi import APIRouter, Request, HTTPException, Depends
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta

import uuid as uuid_lib
from fastapi import APIRouter

mongo_url = os.environ["MONGO_URL"]
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ["DB_NAME"]]



# In-memory OTP store (replace with Redis in production)
_otp_store: dict = {}  # {phone: {otp, expires_at, attempts}}

GOOGLE_SCOPES = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/gmail.send",
    "openid",
    "https://www.googleapis.com/auth/userinfo.email",
]

SUBSCRIPTION_DAYS = {"trial": 7, "trial_ext": 15, "weekly": 7, "monthly": 30, "yearly": 365}
NEXT_BACKUP_DELTA = {"daily": timedelta(days=1), "weekly": timedelta(weeks=1), "monthly": timedelta(days=30)}
SUBSCRIPTION_PRICES = {"trial": 0, "weekly": 129, "monthly": 499, "yearly": 5799}

# ─── Models ───────────────────────────────────────────────────────────────────

class UserCreate(BaseModel):
    name: str
    email: str
    password: str

class UserLogin(BaseModel):
    email: str
    password: str

class PhoneSendOTP(BaseModel):
    phone: str

class PhoneVerifyOTP(BaseModel):
    phone: str
    otp: str
    name: Optional[str] = None

class SubscriptionUpdate(BaseModel):
    subscription_type: str   # trial, weekly, monthly, yearly
    duration_days: Optional[int] = None  # override default if set

class BackupSettings(BaseModel):
    backup_email: str
    backup_frequency: str  # off / daily / weekly / monthly

class PartyCreate(BaseModel):
    name: str
    mobile: str = ""
    address: str = ""

class PartyUpdate(BaseModel):
    name: Optional[str] = None
    mobile: Optional[str] = None
    address: Optional[str] = None

class LedgerEntryCreate(BaseModel):
    date: str
    jama: float = 0.0
    naam: float = 0.0
    narration: str = ""
    counterparty_id: Optional[str] = None

class LedgerEntryUpdate(BaseModel):
    date: Optional[str] = None
    jama: Optional[float] = None
    naam: Optional[float] = None
    narration: Optional[str] = None

# ─── Auth Utils ───────────────────────────────────────────────────────────────

JWT_ALGORITHM = "HS256"

def hash_password(password: str) -> str:
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(password.encode("utf-8"), salt).decode("utf-8")

def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))

def create_access_token(user_id: str, email: str) -> str:
    payload = {"sub": user_id, "email": email, "exp": datetime.now(timezone.utc) + timedelta(days=7), "type": "access"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

def create_refresh_token(user_id: str) -> str:
    payload = {"sub": user_id, "exp": datetime.now(timezone.utc) + timedelta(days=30), "type": "refresh"}
    return jwt.encode(payload, os.environ["JWT_SECRET"], algorithm=JWT_ALGORITHM)

async def get_current_user(request: Request) -> dict:
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _decode_user(token)

async def get_current_user_dl(request: Request) -> dict:
    """Auth for direct download URLs — also accepts ?token= query param."""
    token = request.query_params.get("token") or request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    return await _decode_user(token)

async def _decode_user(token: str) -> dict:
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "access":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["_id"] = str(user["_id"])
        user.pop("password_hash", None)
        # Ensure email_verified is always present
        if "email_verified" not in user:
            user["email_verified"] = False
        # Add subscription info
        sub_type = user.get("subscription_type", "trial")
        sub_expires = user.get("subscription_expires_at")
        now = datetime.now(timezone.utc)
        if sub_expires:
            if hasattr(sub_expires, 'tzinfo') and sub_expires.tzinfo is None:
                sub_expires = sub_expires.replace(tzinfo=timezone.utc)
            is_active = now <= sub_expires
            days_rem = max(0, (sub_expires - now).days)
        else:
            is_active = True
            days_rem = 15
        user["subscription"] = {
            "type": sub_type,
            "expires_at": sub_expires.isoformat() if sub_expires else None,
            "is_active": is_active or user.get("role") in ["admin", "superadmin"],
            "days_remaining": days_rem,
        }
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")

# ─── Balance Utils ────────────────────────────────────────────────────────────

async def recalculate_balances(party_id: str) -> float:
    entries = await db.ledger_entries.find(
        {"party_id": party_id, "is_deleted": {"$ne": True}},
        sort=[("date", 1), ("created_at", 1)]
    ).to_list(None)
    running = 0.0
    for e in entries:
        # NEW formula: balance = prev + naam (credit/lena) - jama (debit/dena)
        # positive balance = Lena Hai (receivable), negative = Dena Hai (payable)
        running = running + e.get("naam", 0.0) - e.get("jama", 0.0)
        await db.ledger_entries.update_one(
            {"_id": e["_id"]}, {"$set": {"balance": round(running, 2)}}
        )
    return round(running, 2)

async def get_party_balance(party_id: str) -> float:
    last = await db.ledger_entries.find_one(
        {"party_id": party_id, "is_deleted": {"$ne": True}},
        sort=[("date", -1), ("created_at", -1)]
    )
    return last.get("balance", 0.0) if last else 0.0

def _fmt_dt(dt) -> str:
    """Serialize a datetime to ISO-8601 string with explicit UTC offset (+00:00).
    MongoDB Motor returns naive datetimes (no tzinfo) even though they're UTC.
    Without the +00:00 suffix, browsers treat the string as local time → wrong IST display.
    """
    if dt is None:
        return ""
    if hasattr(dt, "replace"):
        if dt.tzinfo is None:
            dt = dt.replace(tzinfo=timezone.utc)
        return dt.isoformat()
    return str(dt)

def format_entry(e: dict) -> dict:
    return {
        "id": str(e["_id"]),
        "party_id": e.get("party_id", ""),
        "counterparty_id": e.get("counterparty_id"),
        "counterparty_name": e.get("counterparty_name", ""),   # populated by caller
        "transaction_id": e.get("transaction_id"),
        "date": e.get("date", ""),
        "jama": e.get("jama", 0.0),
        "naam": e.get("naam", 0.0),
        "narration": e.get("narration", ""),
        "balance": e.get("balance", 0.0),
        "is_locked": e.get("is_locked", False),
        "tally_id": e.get("tally_id"),
        "created_at": _fmt_dt(e.get("created_at")),
    }

