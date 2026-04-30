# KhataBook / PoketBook — Product Requirements Document

## Overview
**App Name**: PoketBook  
**Created**: April 17, 2026  
**Stack**: React + Tailwind CSS + Shadcn UI (Frontend), FastAPI + MongoDB (Backend), Capacitor (Mobile)

---

## Problem Statement
Build a mobile-first, high-speed ledger accounting application (PoketBook / Udhar/Khaata system) for Indian small business owners. Features: fast keyboard-driven data entry, strict double-entry accounting (Naam/Jama mapped to Lena/Dena), party management, running balance calculations, lock/tally system, PDF/Excel exports, Google Sheets/Gmail backup, AI layer, cross-platform (Web, Android, iOS).

---

## Core Accounting Logic
**IMPORTANT — Do NOT revert this logic:**
- `Naam` (Credit) = Party took from us → They OWE US → **DENA HAI (Blue)** in UI
- `Jama` (Debit) = Party gave us → We OWE THEM → **LENA HAI (Red)** in UI
- Balance Sheet: Left = DENA HAI (Blue/Payable), Right = LENA HAI (Red/Receivable)

---

## Architecture
- **Frontend**: React + Tailwind CSS, Shadcn UI, Capacitor (mobile wrappers)
- **Backend**: FastAPI + MongoDB (Motor async), JWT Bearer auth
- **Auth**: JWT tokens, sessionStorage, Authorization Bearer header
- **CORS**: allow_origins=["*"] (Kubernetes ingress compatibility)
- **CI/CD**: GitHub Actions → builds signed AAB + APK

---

## What's Been Implemented

### Auth (JWT)
- Login/Register/Change Password/Forgot Password
- Admin auto-seeded: admin@khaata.com / admin123
- 7-day FREE trial on registration
- Phone OTP (MSG91 placeholder — activate with MSG91_AUTH_KEY)

### Party Management
- Create/Edit/Delete with double DELETE confirmation

### Ledger System
- High-density table with peach/salmon rows, sticky entry row
- Tab/Enter keyboard navigation, Hindi labels (नाम / जमा)
- Running balance with लेने/देने display
- Double-entry system (every transaction creates 2 entries with same transaction_id)

### Lock/Tally System
- Lock all entries, immutable after lock, tally snapshot

### Balance Sheet
- Two-column independent scroll: Blue=Dena Hai (left), Red=Lena Hai (right)
- Filter toggles, party counts, totals, net balance

### Settings Page
- Change Password
- Forgot Password (email reset flow)
- Subscription status display

### Export
- PDF export for ledger and balance sheet (matching 2-column UI layout)
- Excel export for both

### Dashboard
- Google Sheets backup integration
- Google OAuth connect flow
- Quick party list

### Google Sheets/Gmail Backup
- OAuth integration (GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET configured)
- Auto-backup scheduling
- WhatsApp-style email reports

### Mobile / CI/CD (April 30, 2026)
- Capacitor wrappers for Android and iOS
- **GitHub Actions FIXED**: Signed AAB + APK builds working
  - Fixed: `storeFile file('app/...')` → `new java.io.File(absPath)` (eliminated app/app/ double path)
  - Fixed: `secrets` context not allowed in `if:` conditions
  - Fixed: Added `Restore build.gradle after cap sync` step
  - Fixed: YAML syntax error (colon in step name)
  - Build artifacts: `poketbook-android-aab-v1.0.23` (14.6 MB) + `poketbook-android-apk-release-v1.0.23` (14.6 MB)

### PDF Export (April 30, 2026)
- Balance Sheet PDF now matches 2-column UI: Blue=DENA HAI (left), Red=LENA HAI (right)
- Party counts in column headers, alternating row backgrounds, net balance footer

---

## Key API Endpoints
- POST /api/auth/register
- POST /api/auth/login
- POST /api/auth/change-password
- POST /api/auth/forgot-password
- POST /api/auth/send-otp (MSG91 placeholder)
- POST /api/auth/verify-otp
- GET/POST /api/parties
- GET/POST /api/ledger/{party_id}/entries
- GET /api/balance-sheet
- GET /api/export/balance-sheet/pdf
- GET /api/export/balance-sheet/excel
- GET /api/export/ledger/{party_id}/pdf
- GET /api/oauth/sheets/connect
- POST /api/export/google-sheets-backup
- GET /api/superadmin/stats (superadmin only)

---

## DB Schema
- `parties`: `_id`, `name`, `mobile`, `address`, `created_at`, `is_deleted`
- `ledger_entries`: `_id`, `party_id`, `counterparty_id`, `date`, `debit`(Jama), `credit`(Naam), `narration`, `balance`, `transaction_id`, `is_locked`, `tally_id`
- `users`: `_id`, `email`, `password_hash`, `role`, `subscription_expires_at`, `subscription_type`

---

## Subscription Plans
- Trial: FREE / 7 days (auto on registration)
- Weekly: ₹129 / 7 days
- Monthly: ₹499 / 30 days
- Yearly: ₹5799 / 365 days

---

## Prioritized Backlog

### P0 (Critical)
- [x] GitHub Actions signed APK/AAB build — FIXED April 30

### P1 (High Priority)
- [ ] Emergent AI Layer: Voice/NL entry ("Vansh ko 500 dena hai")
- [ ] MSG91 SMS OTP (awaiting user's MSG91_AUTH_KEY)

### P2 (Medium Priority)
- [ ] Refactor server.py (1400+ lines → split routes/models/exports)
- [ ] LedgerPage componentization (split LedgerTable, FastEntryForm)

### Backlog
- [ ] How To Use interactive tutorial page
- [ ] Push notifications for due reminders
- [ ] Multi-business/multi-user support
