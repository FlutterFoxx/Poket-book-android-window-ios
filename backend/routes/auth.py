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

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def register(data: UserCreate, response: Response):
    existing = await db.users.find_one({"email": data.email.lower()})
    if existing:
        raise HTTPException(status_code=400, detail="Email already registered")
    now = datetime.now(timezone.utc)
    result = await db.users.insert_one({
        "email": data.email.lower(),
        "password_hash": hash_password(data.password),
        "name": data.name,
        "role": "user",
        "created_at": now,
        # 7-day FREE trial on registration
        "subscription_type": "trial",
        "subscription_started_at": now,
        "subscription_expires_at": now + timedelta(days=7),
        "subscription_is_active": True,
    })
    user_id = str(result.inserted_id)
    access_token = create_access_token(user_id, data.email.lower())
    refresh_tok = create_refresh_token(user_id)
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
    response.set_cookie("refresh_token", refresh_tok, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": data.email.lower(), "name": data.name, "role": "user",
            "access_token": access_token, "refresh_token": refresh_tok}

@router.post("/auth/login")
async def login(data: UserLogin, response: Response, request: Request):
    email = data.email.lower()
    ip = request.client.host if request.client else "unknown"
    identifier = f"{ip}:{email}"
    attempt = await db.login_attempts.find_one({"identifier": identifier})
    if attempt and attempt.get("count", 0) >= 5:
        last = attempt.get("last_attempt")
        if last:
            last_aware = last if last.tzinfo else last.replace(tzinfo=timezone.utc)
            if datetime.now(timezone.utc) - last_aware < timedelta(minutes=15):
                raise HTTPException(status_code=429, detail="Too many failed attempts. 15 minute baad try karein.")
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user.get("password_hash", "")):
        await db.login_attempts.update_one(
            {"identifier": identifier},
            {"$inc": {"count": 1}, "$set": {"last_attempt": datetime.now(timezone.utc)}},
            upsert=True,
        )
        raise HTTPException(status_code=401, detail="Invalid email or password")
    await db.login_attempts.delete_one({"identifier": identifier})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, email)
    refresh_tok = create_refresh_token(user_id)
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
    response.set_cookie("refresh_token", refresh_tok, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "email": email, "name": user.get("name"), "role": user.get("role", "user"),
            "access_token": access_token, "refresh_token": refresh_tok}

@router.post("/auth/logout")
async def logout(response: Response):
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@router.post("/auth/change-password")
async def change_password(request: Request):
    """Change password — requires current password verification"""
    body = await request.json()
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    if len(new_password) < 6:
        raise HTTPException(400, "New password must be at least 6 characters")
    # Get user from token
    token = request.cookies.get("access_token")
    if not token:
        auth_header = request.headers.get("Authorization", "")
        if auth_header.startswith("Bearer "):
            token = auth_header[7:]
    if not token:
        raise HTTPException(401, "Not authenticated")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(404, "User not found")
        if not user.get("password_hash"):
            raise HTTPException(400, "Phone-only accounts cannot use password change. Please use Phone OTP login.")
        if not verify_password(current_password, user["password_hash"]):
            raise HTTPException(400, "Current password is incorrect")
        await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(new_password)}})
        return {"message": "Password changed successfully"}
    except jwt.InvalidTokenError:
        raise HTTPException(401, "Invalid token")

@router.post("/auth/forgot-password")
async def forgot_password(request: Request):
    """Generate a temporary reset token (send via email in production)"""
    body = await request.json()
    email = body.get("email", "").lower()
    if not email:
        raise HTTPException(400, "Email is required")
    user = await db.users.find_one({"email": email})
    # Always return success to prevent email enumeration
    if user:
        import secrets as sec
        reset_token = sec.token_urlsafe(32)
        expires_at = datetime.now(timezone.utc) + timedelta(hours=1)
        await db.password_resets.insert_one({"email": email, "token": reset_token, "expires_at": expires_at, "used": False})
        # TODO: Send email with reset link: /reset-password?token={reset_token}
        # In dev mode, log the token
        if os.environ.get("ADMIN_EMAIL") == email:
            logging.info(f"DEV reset token for {email}: {reset_token}")
    return {"message": "If this email is registered, a reset link has been sent."}

@router.post("/auth/reset-password")
async def reset_password(request: Request):
    """Reset password using the token from forgot-password"""
    body = await request.json()
    token = body.get("token", "")
    new_password = body.get("new_password", "")
    if len(new_password) < 6:
        raise HTTPException(400, "Password must be at least 6 characters")
    reset_doc = await db.password_resets.find_one({"token": token, "used": False})
    if not reset_doc:
        raise HTTPException(400, "Invalid or expired reset token")
    expires = reset_doc["expires_at"]
    if expires.tzinfo is None:
        expires = expires.replace(tzinfo=timezone.utc)
    if datetime.now(timezone.utc) > expires:
        raise HTTPException(400, "Reset token has expired. Please request a new one.")
    user = await db.users.find_one({"email": reset_doc["email"]})
    if not user:
        raise HTTPException(404, "User not found")
    await db.users.update_one({"_id": user["_id"]}, {"$set": {"password_hash": hash_password(new_password)}})
    await db.password_resets.update_one({"token": token}, {"$set": {"used": True}})
    return {"message": "Password reset successfully. You can now login with your new password."}

@router.get("/auth/me")
async def get_me(current_user: dict = Depends(get_current_user)):
    return current_user

@router.post("/auth/refresh")
async def refresh_token_endpoint(request: Request, response: Response):
    token = request.cookies.get("refresh_token")
    if not token:
        try:
            body = await request.json()
            token = body.get("refresh_token")
        except Exception:
            pass
    if not token:
        raise HTTPException(status_code=401, detail="No refresh token")
    try:
        payload = jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
        if payload.get("type") != "refresh":
            raise HTTPException(status_code=401, detail="Invalid token type")
        user = await db.users.find_one({"_id": ObjectId(payload["sub"])})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        access_token = create_access_token(str(user["_id"]), user["email"])
        response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
        return {"message": "Token refreshed", "access_token": access_token}
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid refresh token")


# ─── Phone OTP (MSG91 placeholder — activate with MSG91_AUTH_KEY) ─────────────

@router.post("/auth/send-otp")
async def send_otp_endpoint(data: PhoneSendOTP):
    phone = data.phone.strip()
    if not phone.startswith("+"):
        phone = "+91" + phone.lstrip("0")
    otp = "".join(secrets.choice(string.digits) for _ in range(6))  # cryptographically secure OTP
    _otp_store[phone] = {"otp": otp, "expires_at": datetime.now(timezone.utc) + timedelta(minutes=5), "attempts": 0}
    msg91_key = os.environ.get("MSG91_AUTH_KEY", "PLACEHOLDER")
    if msg91_key and msg91_key != "PLACEHOLDER":
        try:
            import requests as req
            req.post("https://api.msg91.com/api/v5/otp",
                     params={"authkey": msg91_key, "mobile": phone.lstrip("+"), "otp_length": 6, "otp_expiry": 5},
                     json={"message": f"Your poketbook OTP is {otp}. Valid 5 minutes."})
        except Exception as e:
            logging.error(f"MSG91 error: {e}")
    dev_mode = (msg91_key == "PLACEHOLDER")
    result = {"message": "OTP sent", "phone": phone}
    if dev_mode:
        result["dev_otp"] = otp  # REMOVE IN PRODUCTION
    return result

@router.post("/auth/verify-otp")
async def verify_otp_endpoint(data: PhoneVerifyOTP, response: Response):
    phone = data.phone.strip()
    if not phone.startswith("+"):
        phone = "+91" + phone.lstrip("0")
    stored = _otp_store.get(phone)
    if not stored:
        raise HTTPException(400, "OTP not found or expired. Request a new OTP.")
    now = datetime.now(timezone.utc)
    exp = stored["expires_at"]
    if exp.tzinfo is None:
        exp = exp.replace(tzinfo=timezone.utc)
    if now > exp:
        _otp_store.pop(phone, None)
        raise HTTPException(400, "OTP expired. Please request a new OTP.")
    if stored["attempts"] >= 3:
        _otp_store.pop(phone, None)
        raise HTTPException(400, "Too many wrong attempts. Request a new OTP.")
    if stored["otp"] != data.otp:
        _otp_store[phone]["attempts"] += 1
        raise HTTPException(400, f"Invalid OTP. {3 - stored['attempts']} attempts remaining.")
    _otp_store.pop(phone, None)
    user = await db.users.find_one({"phone": phone})
    if not user:
        reg_now = datetime.now(timezone.utc)
        result = await db.users.insert_one({
            "phone": phone, "name": data.name or f"User {phone[-4:]}",
            "email": None, "password_hash": "", "role": "user", "created_at": reg_now,
            "subscription_type": "trial",
            "subscription_started_at": reg_now,
            "subscription_expires_at": reg_now + timedelta(days=7),
            "subscription_is_active": True,
        })
        user = await db.users.find_one({"_id": result.inserted_id})
    user_id = str(user["_id"])
    access_token = create_access_token(user_id, phone)
    refresh_tok = create_refresh_token(user_id)
    response.set_cookie("access_token", access_token, httponly=True, secure=False, samesite="lax", max_age=1800, path="/")
    response.set_cookie("refresh_token", refresh_tok, httponly=True, secure=False, samesite="lax", max_age=604800, path="/")
    return {"id": user_id, "name": user.get("name"), "phone": phone,
            "access_token": access_token, "refresh_token": refresh_tok}

