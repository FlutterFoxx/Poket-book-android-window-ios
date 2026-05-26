"""
PoketBook Email Service — Resend integration
Handles: email verification, subscription expiry reminders, password reset
"""
import os, asyncio, logging
import resend

resend.api_key = os.environ.get("RESEND_API_KEY", "")
SENDER = os.environ.get("SENDER_EMAIL", "onboarding@resend.dev")
APP_URL = os.environ.get("APP_URL", os.environ.get("FRONTEND_URL", "https://poketbook.in"))

BRAND_HEADER = """
<div style="background: linear-gradient(135deg, #1E3A5F 0%, #2563EB 100%); padding: 28px 30px; border-radius: 12px 12px 0 0; text-align: center;">
  <h1 style="color: #ffffff; margin: 0; font-size: 26px; font-weight: 800; letter-spacing: -0.5px;">PoketBook</h1>
  <p style="color: rgba(255,255,255,0.75); margin: 6px 0 0; font-size: 13px;">Apna Udhar-Khaata Digital Banao</p>
</div>
"""
BRAND_FOOTER = """
<hr style="border: none; border-top: 1px solid #e2e8f0; margin: 24px 0 16px;">
<p style="color: #94a3b8; font-size: 12px; text-align: center; margin: 0;">PoketBook — Powered by Flutter Fox</p>
"""

def _wrap(body: str) -> str:
    return f"""
<div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; background: #f1f5f9;">
  {BRAND_HEADER}
  <div style="background: #ffffff; padding: 32px 30px; border-radius: 0 0 12px 12px; border: 1px solid #e2e8f0; border-top: none;">
    {body}
    {BRAND_FOOTER}
  </div>
</div>
"""

async def _send(to_email: str, subject: str, html: str):
    """Non-blocking send using asyncio.to_thread (Resend SDK is synchronous)."""
    params = {"from": f"PoketBook <{SENDER}>", "to": [to_email], "subject": subject, "html": html}
    try:
        result = await asyncio.to_thread(resend.Emails.send, params)
        logging.info(f"Email sent to {to_email}: {result}")
    except Exception as e:
        logging.error(f"Email send failed to {to_email}: {e}")


async def send_verification_email(to_email: str, name: str, token: str):
    verify_url = f"{APP_URL}/verify-email?token={token}"
    display_name = name or "there"
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0; font-size: 22px;">Verify your email address</h2>
    <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Hi <strong>{display_name}</strong>,</p>
    <p style="color: #475569; font-size: 15px;">Welcome to PoketBook! Click the button below to verify your email and start tracking your Udhar-Khaata.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{verify_url}"
         style="background: linear-gradient(135deg, #1E3A5F, #2563EB); color: #ffffff; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block; letter-spacing: 0.3px;">
        Verify Email Address
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">This link is valid for <strong>24 hours</strong>. If you didn't create a PoketBook account, you can safely ignore this email.</p>
    """
    await _send(to_email, "Verify your PoketBook email address", _wrap(body))


async def send_expiry_reminder(to_email: str, name: str, plan: str, days: int):
    renew_url = f"{APP_URL}/settings"
    if days == 0:
        urgency = "has expired today"
        subject = f"Your PoketBook {plan.title()} plan has expired"
        urgency_color = "#DC2626"
        urgency_label = "EXPIRED"
    elif days == 1:
        urgency = "expires tomorrow"
        subject = f"Your PoketBook plan expires tomorrow — Renew now"
        urgency_color = "#EA580C"
        urgency_label = "EXPIRES TOMORROW"
    else:
        urgency = f"expires in {days} days"
        subject = f"Your PoketBook plan expires in {days} days"
        urgency_color = "#D97706"
        urgency_label = f"EXPIRES IN {days} DAYS"

    body = f"""
    <div style="background: {urgency_color}15; border: 2px solid {urgency_color}; border-radius: 8px; padding: 14px 18px; margin-bottom: 24px;">
      <p style="color: {urgency_color}; font-weight: 800; font-size: 15px; margin: 0;">{urgency_label}</p>
    </div>
    <h2 style="color: #1E3A5F; margin-top: 0; font-size: 20px;">Your <span style="color:{urgency_color};">{plan.title()}</span> plan {urgency}!</h2>
    <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Hi <strong>{name or 'there'}</strong>,</p>
    <p style="color: #475569; font-size: 15px;">Renew your PoketBook plan to keep tracking your Udhar-Khaata without any interruption.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{renew_url}"
         style="background: {urgency_color}; color: #ffffff; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">
        Renew My Plan Now
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">Questions? Contact us at support@poketbook.in</p>
    """
    await _send(to_email, subject, _wrap(body))


async def send_password_reset_email(to_email: str, name: str, token: str):
    reset_url = f"{APP_URL}/reset-password?token={token}"
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0; font-size: 22px;">Reset your password</h2>
    <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Hi <strong>{name or 'there'}</strong>,</p>
    <p style="color: #475569; font-size: 15px;">We received a request to reset your PoketBook password. Click the button below to set a new password.</p>
    <div style="text-align: center; margin: 32px 0;">
      <a href="{reset_url}"
         style="background: #7C3AED; color: #ffffff; padding: 15px 36px; border-radius: 8px; text-decoration: none; font-size: 16px; font-weight: 700; display: inline-block;">
        Reset Password
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">This link expires in <strong>1 hour</strong>. If you didn't request a password reset, ignore this email — your account is safe.</p>
    """
    await _send(to_email, "Reset your PoketBook password", _wrap(body))


# ── Onboarding Series ──────────────────────────────────────────────────────────

async def send_onboarding_day1(to_email: str, name: str):
    """Day 1: Naam & Jama tips — how to make first entry."""
    ledger_url = f"{APP_URL}/ledger"
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0; font-size: 22px;">Aapka pehla Khaata entry kaise karein?</h2>
    <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Namaste <strong>{name or 'dost'}</strong>! 🙏</p>
    <p style="color: #475569; font-size: 15px;">PoketBook mein double-entry accounting bahut simple hai. Bas yeh 2 rules yaad rakhein:</p>

    <table style="width: 100%; border-collapse: collapse; margin: 24px 0; border-radius: 10px; overflow: hidden;">
      <tr style="background: #DBEAFE;">
        <td style="padding: 14px 18px; font-weight: 800; color: #1D4ED8; font-size: 15px; border-bottom: 1px solid #BFDBFE;">NAAM (नाम) — Credit</td>
        <td style="padding: 14px 18px; color: #1D4ED8; font-size: 14px; border-bottom: 1px solid #BFDBFE;">Aapne party ko <strong>paise diye</strong> ya udhaar diya<br><span style="font-size:12px;opacity:0.8;">→ Party DENA HAI mein aayega (Blue)</span></td>
      </tr>
      <tr style="background: #FEE2E2;">
        <td style="padding: 14px 18px; font-weight: 800; color: #B91C1C; font-size: 15px;">JAMA (जमा) — Debit</td>
        <td style="padding: 14px 18px; color: #B91C1C; font-size: 14px;">Party ne aapko <strong>paise diye</strong> ya payment ki<br><span style="font-size:12px;opacity:0.8;">→ Party LENA HAI mein aayega (Red)</span></td>
      </tr>
    </table>

    <p style="color: #475569; font-size: 14px;"><strong>Pro Tip:</strong> F1 key dabao — entry form instantly open hoga. Fast keyboard entry ke liye Arrows + Tab use karein!</p>

    <div style="text-align: center; margin: 28px 0;">
      <a href="{ledger_url}"
         style="background: linear-gradient(135deg, #1E3A5F, #2563EB); color: #ffffff; padding: 14px 32px; border-radius: 8px; text-decoration: none; font-size: 15px; font-weight: 700; display: inline-block;">
        Apna Pehla Entry Karein →
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">Koi sawaal? Reply karein is email pe — hum help karenge!</p>
    """
    await _send(to_email, "PoketBook: Naam aur Jama kaise use karein? (Quick Guide)", _wrap(body))


async def send_onboarding_day3(to_email: str, name: str):
    """Day 3: Backup & Balance Sheet reminder."""
    backup_url = f"{APP_URL}/"
    balance_url = f"{APP_URL}/balance-sheet"
    body = f"""
    <h2 style="color: #1E3A5F; margin-top: 0; font-size: 22px;">Aapka Khaata safe hai? Backup zaroor lagaayein!</h2>
    <p style="color: #475569; font-size: 15px; margin-bottom: 8px;">Namaste <strong>{name or 'dost'}</strong>! 🙏</p>
    <p style="color: #475569; font-size: 15px;">3 din ho gaye PoketBook mein — great start! Ab apna data secure karne ke liye yeh 2 kaam karein:</p>

    <div style="background: #F0FDF4; border: 1px solid #86EFAC; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
      <p style="color: #166534; font-weight: 700; font-size: 15px; margin: 0 0 6px;">✓ Google Sheets Backup</p>
      <p style="color: #15803D; font-size: 13px; margin: 0;">Dashboard → Connect Google Sheets → Backup Now. Aapka poora Khaata Google Drive mein safe rahega.</p>
    </div>

    <div style="background: #EFF6FF; border: 1px solid #BFDBFE; border-radius: 10px; padding: 16px 20px; margin: 20px 0;">
      <p style="color: #1D4ED8; font-weight: 700; font-size: 15px; margin: 0 0 6px;">✓ Balance Sheet dekho</p>
      <p style="color: #1E40AF; font-size: 13px; margin: 0;">Ek nazar mein dekho: Kaun kitna dena hai, kaun kitna lena hai. A-to-Z sorted.</p>
    </div>

    <div style="display: flex; gap: 12px; margin: 28px 0; text-align: center;">
      <a href="{backup_url}"
         style="background: #16A34A; color: #ffffff; padding: 13px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; flex: 1;">
        Backup Setup
      </a>
      <a href="{balance_url}"
         style="background: #1D4ED8; color: #ffffff; padding: 13px 20px; border-radius: 8px; text-decoration: none; font-size: 14px; font-weight: 700; display: inline-block; flex: 1;">
        Balance Sheet
      </a>
    </div>
    <p style="color: #94a3b8; font-size: 13px; text-align: center;">Aapka free trial chal raha hai — enjoy PoketBook!</p>
    """
    await _send(to_email, "PoketBook: Kya aapne Google Backup liya? (3-din reminder)", _wrap(body))
