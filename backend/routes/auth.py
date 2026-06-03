from dotenv import load_dotenv
load_dotenv()
import os
import io
import logging
import secrets
import string
import base64
import asyncio
import jwt
from fastapi import APIRouter, Request, HTTPException, Depends, Response
from typing import Optional, List
from bson import ObjectId
from datetime import datetime, timezone, timedelta
import uuid as uuid_lib
from core import (db, hash_password, verify_password, create_access_token, create_refresh_token, get_current_user, JWT_ALGORITHM, UserCreate, UserLogin, PhoneSendOTP, PhoneVerifyOTP, _otp_store, register_session, revoke_session)
from security import (
    validate_email, validate_password_strength, check_password_legacy,
    sanitize_name, sanitize_email,
    check_rate_limit, record_failed_attempt, clear_rate_limit,
    set_auth_cookies, audit_log,
)
# ── Email helpers — fully isolated, never block auth ─────────────────────────
# All email sending is lazy-imported inside a background task.
# If resend/email_service fails for any reason, it logs and continues silently.

async def _send_email_task(func_name: str, *args):
    """Fire-and-forget email wrapper. Imports email_service lazily inside the task."""
    try:
        import email_service as _es
        fn = getattr(_es, func_name, None)
        if fn:
            await fn(*args)
    except Exception as _e:
        logging.warning(f"Email '{func_name}' failed silently: {_e}")

def _fire_email(func_name: str, *args):
    """Schedule email sending as a background task without blocking the request."""
    try:
        asyncio.create_task(_send_email_task(func_name, *args))
    except Exception:
        pass  # Never crash auth due to email issues

router = APIRouter(prefix="/api")

# ─── Auth Routes ──────────────────────────────────────────────────────────────

@router.post("/auth/register")
async def register(data: UserCreate, response: Response, request: Request):
    ip = request.client.host if request.client else "unknown"
    email = sanitize_email(data.email)

    # Input validation
    email_ok, email_err = validate_email(email)
    if not email_ok:
        raise HTTPException(status_code=422, detail=email_err)

    # Password strength (new users get stricter rules)
    pass_ok, pass_err = validate_password_strength(data.password)
    if not pass_ok:
        raise HTTPException(status_code=422, detail=pass_err)

    name = sanitize_name(data.name or "")

    existing = await db.users.find_one({"email": email})
    if existing:
        # Don't reveal if email exists — return same message
        await audit_log(db, "register_duplicate", None, ip, email=email)
        raise HTTPException(status_code=400, detail="Registration failed. Please check your details.")

    now = datetime.now(timezone.utc)
    result = await db.users.insert_one({
        "email": email,
        "password_hash": hash_password(data.password),
        "name": name,
        "role": "user",
        "created_at": now,
        "email_verified": True,
        "subscription_type": "trial",
        "subscription_started_at": now,
        "subscription_expires_at": now + timedelta(days=7),
        "subscription_is_active": True,
    })
    user_id = str(result.inserted_id)
    import secrets as _sec
    session_id = _sec.token_hex(16)
    access_token = create_access_token(user_id, email, session_id)
    refresh_tok = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_tok)
    await register_session(user_id, session_id)
    await audit_log(db, "register_success", user_id, ip, email=email)
    return {"id": user_id, "email": email, "name": name, "role": "user",
            "email_verified": True,
            "access_token": access_token, "refresh_token": refresh_tok}

@router.post("/auth/login")
async def login(data: UserLogin, response: Response, request: Request):
    ip = request.client.host if request.client else "unknown"
    email = sanitize_email(data.email)

    # Validate email format before any DB lookup
    email_ok, _ = validate_email(email)
    if not email_ok:
        raise HTTPException(status_code=401, detail="Invalid email or password")

    # Rate limiting (per account + global IP)
    identifier = f"{ip}:{email}"
    await check_rate_limit(db, identifier, ip)

    user = await db.users.find_one({"email": email})

    # Google-only account trying email/password login — give a helpful message
    if user and user.get("google_auth") and not user.get("password_hash"):
        raise HTTPException(status_code=401, detail="This account uses Google login. Please click 'Continue with Google' to sign in.")

    if not user or not verify_password(data.password, user.get("password_hash") or ""):
        await record_failed_attempt(db, identifier, ip)
        await audit_log(db, "login_failed", None, ip, email=email,
                        details={"reason": "invalid_credentials"})
        # Always same message — prevents email enumeration
        raise HTTPException(status_code=401, detail="Invalid email or password")

    await clear_rate_limit(db, identifier)
    user_id = str(user["_id"])
    import secrets as _sec
    session_id = _sec.token_hex(16)
    access_token = create_access_token(user_id, email, session_id)
    refresh_tok = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_tok)
    await register_session(user_id, session_id)
    await audit_log(db, "login_success", user_id, ip, email=email)
    return {"id": user_id, "email": email, "name": user.get("name"), "role": user.get("role", "user"),
            "email_verified": True,
            "access_token": access_token, "refresh_token": refresh_tok}

@router.post("/auth/logout")
async def logout(request: Request, response: Response):
    # Revoke the session so the slot becomes available for another device
    try:
        token = request.cookies.get("access_token")
        if not token:
            auth_header = request.headers.get("Authorization", "")
            if auth_header.startswith("Bearer "):
                token = auth_header[7:]
        if token:
            import jwt as _jwt
            payload = _jwt.decode(token, os.environ["JWT_SECRET"], algorithms=[JWT_ALGORITHM])
            await revoke_session(payload.get("sub", ""), payload.get("sid", ""))
    except Exception:
        pass
    response.delete_cookie("access_token", path="/")
    response.delete_cookie("refresh_token", path="/")
    return {"message": "Logged out"}

@router.post("/auth/change-password")
async def change_password(request: Request):
    """Change password — requires current password verification"""
    body = await request.json()
    current_password = body.get("current_password", "")
    new_password = body.get("new_password", "")
    # Use legacy check for existing users (backward compatible)
    pass_ok, pass_err = check_password_legacy(new_password)
    if not pass_ok:
        raise HTTPException(400, pass_err)
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
        _fire_email("send_password_reset_email", email, user.get("name", ""), reset_token)
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
        set_auth_cookies(response, access_token, access_token)
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
    set_auth_cookies(response, access_token, access_token)
    return {"id": user_id, "name": user.get("name"), "phone": phone,
            "access_token": access_token, "refresh_token": refresh_tok}


# ─── Google OAuth (Custom — PoketBook's own Google credentials) ───────────────

async def _upsert_google_user(email: str, name: str, picture: str):
    """Find or create a user from Google auth data. Returns (user_id, is_new)."""
    now = datetime.now(timezone.utc)
    user = await db.users.find_one({"email": email})
    if not user:
        result = await db.users.insert_one({
            "email": email, "name": name, "role": "user",
            "password_hash": None, "google_auth": True, "picture": picture,
            "email_verified": True,
            "created_at": now,
            "subscription_type": "trial",
            "subscription_started_at": now,
            "subscription_expires_at": now + timedelta(days=7),
            "subscription_is_active": True,
        })
        return str(result.inserted_id), True, None
    else:
        await db.users.update_one({"_id": user["_id"]}, {
            "$set": {"name": name, "picture": picture, "google_auth": True, "email_verified": True}
        })
        return str(user["_id"]), False, user.get("role", "user")


@router.post("/auth/google/token")
async def google_token_login(request: Request, response: Response):
    """GIS ID Token flow — no redirect_uri needed. Receives id_token from frontend."""
    import httpx, secrets as _sec
    body = await request.json()
    id_token = body.get("id_token", "")
    if not id_token:
        raise HTTPException(status_code=400, detail="id_token required")

    # Verify the ID token with Google's tokeninfo endpoint
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            resp = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token})
        if resp.status_code != 200:
            raise HTTPException(status_code=401, detail="Invalid Google token")
        gdata = resp.json()
    except HTTPException:
        raise
    except Exception as e:
        logging.error(f"Google tokeninfo error: {e}")
        raise HTTPException(status_code=401, detail="Google verification failed")

    # Validate audience (client_id)
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if client_id and gdata.get("aud") != client_id:
        raise HTTPException(status_code=401, detail="Token audience mismatch")

    email = gdata.get("email", "").lower()
    name  = gdata.get("name", email.split("@")[0])
    picture = gdata.get("picture", "")
    if not email:
        raise HTTPException(status_code=400, detail="No email in Google token")

    user_id, is_new, existing_role = await _upsert_google_user(email, name, picture)
    session_id = _sec.token_hex(16)
    access_token  = create_access_token(user_id, email, session_id)
    refresh_token = create_refresh_token(user_id)
    set_auth_cookies(response, access_token, refresh_token)
    await register_session(user_id, session_id)

    role = "user" if is_new else (existing_role or "user")
    return {
        "id": user_id, "email": email, "name": name, "role": role,
        "email_verified": True,
        "access_token": access_token, "refresh_token": refresh_token,
    }


@router.get("/auth/google/login")
async def google_login_url(request: Request):
    """Return the Google OAuth2 URL for the login flow."""
    import urllib.parse
    client_id = os.environ.get("GOOGLE_CLIENT_ID", "")
    if not client_id:
        raise HTTPException(status_code=500, detail="Google OAuth not configured")

    # Build redirect URI dynamically so it works on any deployment (preview, production, etc.)
    # Prefer env var if set explicitly, otherwise derive from incoming request host
    redirect_uri = os.environ.get("GOOGLE_LOGIN_REDIRECT_URI", "")
    if not redirect_uri:
        scheme = request.headers.get("x-forwarded-proto", "https")
        host   = request.headers.get("x-forwarded-host", "") or request.url.hostname
        redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

    params = {
        "client_id": client_id,
        "redirect_uri": redirect_uri,
        "response_type": "code",
        "scope": "openid email profile",
        "access_type": "online",
        "prompt": "select_account",
    }
    url = "https://accounts.google.com/o/oauth2/v2/auth?" + urllib.parse.urlencode(params)
    return {"url": url}


@router.get("/auth/google/callback")
async def google_login_callback(request: Request, code: str = None, error: str = None):
    """Handle Google OAuth2 callback. Exchange code → tokens → JWT → redirect to frontend."""
    import httpx
    import urllib.parse
    from fastapi.responses import RedirectResponse

    # Derive app_url from the incoming request host so it works on any deployment
    scheme   = request.headers.get("x-forwarded-proto", "https")
    host     = request.headers.get("x-forwarded-host", "") or request.url.hostname
    app_url  = f"{scheme}://{host}"

    if error or not code:
        return RedirectResponse(f"{app_url}/login?error=google_cancelled")

    client_id     = os.environ.get("GOOGLE_CLIENT_ID", "")
    client_secret = os.environ.get("GOOGLE_CLIENT_SECRET", "")
    # Use same dynamic redirect URI that was used in /login
    redirect_uri = os.environ.get("GOOGLE_LOGIN_REDIRECT_URI", "")
    if not redirect_uri:
        scheme = request.headers.get("x-forwarded-proto", "https")
        host   = request.headers.get("x-forwarded-host", "") or request.url.hostname
        redirect_uri = f"{scheme}://{host}/api/auth/google/callback"

    # Exchange authorization code for tokens
    try:
        async with httpx.AsyncClient(timeout=15) as client:
            token_resp = await client.post("https://oauth2.googleapis.com/token", data={
                "code": code, "client_id": client_id, "client_secret": client_secret,
                "redirect_uri": redirect_uri, "grant_type": "authorization_code",
            })
        if token_resp.status_code != 200:
            logging.error(f"Google token exchange failed: {token_resp.text}")
            return RedirectResponse(f"{app_url}/login?error=token_exchange_failed")
        token_data = token_resp.json()
        id_token_val = token_data.get("id_token", "")
    except Exception as e:
        logging.error(f"Google OAuth token exchange error: {e}")
        return RedirectResponse(f"{app_url}/login?error=network_error")

    # Verify ID token via Google's tokeninfo endpoint
    try:
        async with httpx.AsyncClient(timeout=10) as client:
            info_resp = await client.get("https://oauth2.googleapis.com/tokeninfo", params={"id_token": id_token_val})
        if info_resp.status_code != 200:
            return RedirectResponse(f"{app_url}/login?error=invalid_token")
        gdata = info_resp.json()
    except Exception as e:
        logging.error(f"Google tokeninfo error: {e}")
        return RedirectResponse(f"{app_url}/login?error=token_verify_failed")

    email = gdata.get("email", "").lower()
    name  = gdata.get("name", email.split("@")[0])
    picture = gdata.get("picture", "")
    if not email:
        return RedirectResponse(f"{app_url}/login?error=no_email")

    user_id, is_new, existing_role = await _upsert_google_user(email, name, picture)

    import secrets as _sec
    session_id = _sec.token_hex(16)
    access_token  = create_access_token(user_id, email, session_id)
    refresh_token = create_refresh_token(user_id)
    await register_session(user_id, session_id)

    # Redirect to frontend AuthCallbackPage with tokens in URL hash
    params = urllib.parse.urlencode({"token": access_token, "refresh_token": refresh_token})
    return RedirectResponse(f"{app_url}/auth/callback#{params}")
