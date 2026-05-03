from dotenv import load_dotenv
load_dotenv()

import logging
from fastapi import FastAPI
from starlette.middleware.cors import CORSMiddleware
from fastapi import APIRouter
from core import db, hash_password, create_access_token
from datetime import datetime, timezone, timedelta
from bson import ObjectId

# ── App ──────────────────────────────────────────────────────────────────────
app = FastAPI(title="PoketBook API")

app.add_middleware(
    CORSMiddleware,
    allow_credentials=False,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Startup — seed admin/superadmin ─────────────────────────────────────────
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
            "subscription_type": "yearly",
            "subscription_expires_at": now + timedelta(days=3650),
            "created_at": now,
        })

    # APScheduler for auto-backups
    try:
        from apscheduler.schedulers.asyncio import AsyncIOScheduler
        from routes.backup import run_scheduled_backups
        scheduler = AsyncIOScheduler(timezone="UTC")
        scheduler.add_job(run_scheduled_backups, "interval", hours=1)
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
