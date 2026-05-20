"""
Security utilities for PoketBook authentication.
Handles: email validation, password strength, rate limiting, audit logging.
"""
import re
import os
import logging
from datetime import datetime, timezone, timedelta
from typing import Optional

# ── Email Validation ──────────────────────────────────────────────────────────

_EMAIL_REGEX = re.compile(
    r"^[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}$"
)

_BLOCKED_DOMAINS = {
    "mailinator.com", "guerrillamail.com", "tempmail.com", "throwaway.email",
    "yopmail.com", "10minutemail.com", "trashmail.com", "fakeinbox.com",
    "dispostable.com", "mailnull.com", "spamgourmet.com",
}

def validate_email(email: str) -> tuple[bool, str]:
    """Returns (is_valid, error_message). Empty string = no error."""
    if not email or not isinstance(email, str):
        return False, "Email is required"
    email = email.strip().lower()
    if len(email) > 254:   # RFC 5321 max length
        return False, "Email address is too long"
    if not _EMAIL_REGEX.match(email):
        return False, "Invalid email format"
    domain = email.split("@")[-1]
    if domain in _BLOCKED_DOMAINS:
        return False, "Disposable email addresses are not allowed"
    return True, ""


# ── Password Strength ─────────────────────────────────────────────────────────

def validate_password_strength(password: str) -> tuple[bool, str]:
    """Enforce minimum password security requirements."""
    if not password:
        return False, "Password is required"
    if len(password) < 8:
        return False, "Password must be at least 8 characters"
    if len(password) > 128:
        return False, "Password is too long (max 128 characters)"
    # Require at least one letter and one digit for basic strength
    if not re.search(r"[a-zA-Z]", password):
        return False, "Password must contain at least one letter"
    if not re.search(r"[0-9]", password):
        return False, "Password must contain at least one number"
    return True, ""


def check_password_legacy(password: str) -> tuple[bool, str]:
    """Relaxed check for existing users (6+ chars) — backward compatible."""
    if not password or len(password) < 6:
        return False, "Password must be at least 6 characters"
    if len(password) > 128:
        return False, "Password is too long"
    return True, ""


# ── Input Sanitization ────────────────────────────────────────────────────────

def sanitize_name(name: str) -> str:
    """Strip dangerous characters from display names."""
    if not name:
        return ""
    # Keep letters, numbers, spaces, and common punctuation
    clean = re.sub(r"[<>\"'\\;{}()\[\]]", "", name.strip())
    return clean[:100]  # Max 100 chars


def sanitize_email(email: str) -> str:
    return email.strip().lower()[:254] if email else ""


# ── Rate Limiting Helpers ─────────────────────────────────────────────────────

MAX_ATTEMPTS = 5
LOCKOUT_MINUTES = 15
GLOBAL_IP_MAX = 20  # Max attempts per IP across all accounts per hour


async def check_rate_limit(db, identifier: str, ip: str) -> None:
    """
    Two-layer rate limiting:
    1. Per-account: 5 failed attempts = 15-min lockout
    2. Per-IP global: 20 failed attempts/hour across all accounts
    Raises HTTPException 429 if limit exceeded.
    """
    from fastapi import HTTPException
    now = datetime.now(timezone.utc)

    # Layer 1: per account+IP
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= MAX_ATTEMPTS:
        last = attempt.get("last_attempt")
        if last:
            last_aware = last if last.tzinfo else last.replace(tzinfo=timezone.utc)
            if now - last_aware < timedelta(minutes=LOCKOUT_MINUTES):
                remaining = int((timedelta(minutes=LOCKOUT_MINUTES) - (now - last_aware)).total_seconds() / 60) + 1
                raise HTTPException(
                    status_code=429,
                    detail=f"Too many failed attempts. Try again in {remaining} minutes.",
                    headers={"Retry-After": str(remaining * 60)}
                )
        # Lockout expired — reset
        await db.login_attempts.delete_one({"identifier": identifier})

    # Layer 2: global IP throttle (20 attempts/hour across all accounts)
    ip_key = f"ip:{ip}"
    ip_attempt = await db.login_attempts.find_one({"identifier": ip_key})
    if ip_attempt and ip_attempt.get("count", 0) >= GLOBAL_IP_MAX:
        first = ip_attempt.get("first_attempt", now)
        first_aware = first if first.tzinfo else first.replace(tzinfo=timezone.utc)
        if now - first_aware < timedelta(hours=1):
            raise HTTPException(
                status_code=429,
                detail="Too many requests from this IP. Try again in 1 hour.",
                headers={"Retry-After": "3600"}
            )
        # Hour window expired — reset
        await db.login_attempts.delete_one({"identifier": ip_key})


async def record_failed_attempt(db, identifier: str, ip: str) -> None:
    now = datetime.now(timezone.utc)
    await db.login_attempts.update_one(
        {"identifier": identifier},
        {"$inc": {"count": 1}, "$set": {"last_attempt": now}},
        upsert=True,
    )
    # Track global IP attempts
    ip_key = f"ip:{ip}"
    await db.login_attempts.update_one(
        {"identifier": ip_key},
        {"$inc": {"count": 1}, "$setOnInsert": {"first_attempt": now}, "$set": {"last_attempt": now}},
        upsert=True,
    )


async def clear_rate_limit(db, identifier: str) -> None:
    await db.login_attempts.delete_one({"identifier": identifier})


# ── Audit Logging ─────────────────────────────────────────────────────────────

async def audit_log(db, event: str, user_id: Optional[str], ip: str,
                    email: Optional[str] = None, details: Optional[dict] = None) -> None:
    """Log security-relevant events for monitoring."""
    await db.audit_logs.insert_one({
        "event": event,
        "user_id": user_id,
        "email": email,
        "ip": ip,
        "timestamp": datetime.now(timezone.utc),
        "details": details or {},
    })


# ── Cookie Security ───────────────────────────────────────────────────────────

def is_production() -> bool:
    return os.environ.get("ENVIRONMENT", "development") == "production"


def set_auth_cookies(response, access_token: str, refresh_token: str) -> None:
    """Set httpOnly cookies with appropriate security flags."""
    prod = is_production()
    response.set_cookie(
        "access_token", access_token,
        httponly=True,
        secure=prod,          # HTTPS-only in production
        samesite="lax" if not prod else "none",
        max_age=7 * 86400,    # 7 days (matches token expiry)
        path="/"
    )
    response.set_cookie(
        "refresh_token", refresh_token,
        httponly=True,
        secure=prod,
        samesite="lax" if not prod else "none",
        max_age=30 * 86400,   # 30 days
        path="/"
    )
