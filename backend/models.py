from pydantic import BaseModel
from typing import Optional, List

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

