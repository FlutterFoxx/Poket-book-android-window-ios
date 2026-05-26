from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from core import db, hash_password, create_access_token
from datetime import datetime, timezone, timedelta

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="PoketBook API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Health endpoints — MUST be registered before startup event ────────────────
# Registered at BOTH paths: Kubernetes health probe uses /health (routed to
# backend by nginx), and /api/health for the /api/* → backend routing rule.
@app.get("/health")
@app.get("/api/health")
async def health_check():
    """Kubernetes liveness/readiness probe — must return 200 immediately."""
    return {"status": "ok"}

# ── Cron function — MUST be defined BEFORE startup_event references it ────────
async def send_subscription_expiry_reminders():
    """Daily cron: send renewal reminder emails to users expiring in 3 or 1 day(s)."""
    from email_service import send_expiry_reminder, send_onboarding_day1, send_onboarding_day3
    now = datetime.now(timezone.utc)

    # ── Subscription expiry reminders ──────────────────────────
    for days_ahead in [3, 1]:
        window_start = now + timedelta(days=days_ahead - 0.5)
        window_end   = now + timedelta(days=days_ahead + 0.5)
        async for user in db.users.find({
            "subscription_expires_at": {"$gte": window_start, "$lte": window_end},
            "email": {"$exists": True, "$ne": None},
            "role": {"$nin": ["admin", "superadmin"]},
        }):
            try:
                await send_expiry_reminder(
                    user["email"], user.get("name", ""),
                    user.get("subscription_type", "trial"), days_ahead,
                )
            except Exception as e:
                logging.error(f"Expiry reminder failed for {user.get('email')}: {e}")

    # ── Onboarding series: Day 1 tips ───────────────────────────
    day1_start = now - timedelta(days=1, hours=1)
    day1_end   = now - timedelta(hours=23)
    async for user in db.users.find({
        "created_at": {"$gte": day1_start, "$lte": day1_end},
        "email": {"$exists": True, "$ne": None},
        "onboarding_day1_sent": {"$ne": True},
        "role": {"$nin": ["admin", "superadmin"]},
    }):
        try:
            await send_onboarding_day1(user["email"], user.get("name", ""))
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"onboarding_day1_sent": True}})
        except Exception as e:
            logging.error(f"Onboarding Day1 failed for {user.get('email')}: {e}")

    # ── Onboarding series: Day 3 backup reminder ────────────────
    day3_start = now - timedelta(days=3, hours=1)
    day3_end   = now - timedelta(days=2, hours=23)
    async for user in db.users.find({
        "created_at": {"$gte": day3_start, "$lte": day3_end},
        "email": {"$exists": True, "$ne": None},
        "onboarding_day3_sent": {"$ne": True},
        "role": {"$nin": ["admin", "superadmin"]},
    }):
        try:
            await send_onboarding_day3(user["email"], user.get("name", ""))
            await db.users.update_one({"_id": user["_id"]}, {"$set": {"onboarding_day3_sent": True}})
        except Exception as e:
            logging.error(f"Onboarding Day3 failed for {user.get('email')}: {e}")


# ── Startup — seed admin/superadmin + start scheduler ────────────────────────
@app.on_event("startup")
async def startup_event():
    import os
    now = datetime.now(timezone.utc)

    admin_email = os.environ.get("ADMIN_EMAIL", "admin@khaata.com")
    admin_pass  = os.environ.get("ADMIN_PASSWORD", "admin123")
    if not await db.users.find_one({"email": admin_email}):
        await db.users.insert_one({
            "name": "Admin", "email": admin_email, "role": "admin",
            "password_hash": hash_password(admin_pass),
            "email_verified": True,
            "subscription_type": "yearly",
            "subscription_expires_at": now + timedelta(days=3650),
            "created_at": now,
        })

    sa_email = os.environ.get("SUPERADMIN_EMAIL", "superadmin@poketbook.in")
    sa_pass  = os.environ.get("SUPERADMIN_PASSWORD", "PoketBook@Super2024")
    if not await db.users.find_one({"email": sa_email}):
        await db.users.insert_one({
            "name": "Super Admin", "email": sa_email, "role": "superadmin",
            "password_hash": hash_password(sa_pass),
            "email_verified": True,
            "subscription_type": "yearly",
            "subscription_expires_at": now + timedelta(days=3650),
            "created_at": now,
        })

    # APScheduler for auto-backups + subscription expiry reminders
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from routes.backup import run_scheduled_backups
        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(run_scheduled_backups, "interval", hours=24)
        scheduler.add_job(send_subscription_expiry_reminders, "interval", hours=24)
        scheduler.start()
        app.state.scheduler = scheduler
    except Exception as e:
        logging.warning(f"APScheduler failed to start: {e}")


# ── Mount routers ────────────────────────────────────────────────────────────
from routes.auth     import router as auth_router
from routes.ledger   import router as ledger_router
from routes.export   import router as export_router
from routes.backup   import router as backup_router
from routes.admin    import router as admin_router

app.include_router(auth_router)
app.include_router(ledger_router)
app.include_router(export_router)
app.include_router(backup_router)
app.include_router(admin_router)


# ── Shutdown ─────────────────────────────────────────────────────────────────
@app.on_event("shutdown")
async def shutdown_db_client():
    try:
        if hasattr(app.state, "scheduler"):
            app.state.scheduler.shutdown()
    except Exception:
        pass
    from core import client
    client.close()


logging.basicConfig(level=logging.INFO)
