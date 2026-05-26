# PoketBook PRD — Updated May 3, 2026

## Problem Statement
Mobile-first, high-speed ledger accounting application (PoketBook / Udhar/Khaata) for Indian small business owners. Double-entry accounting, party management, running balance, Google Sheets/Gmail backup, AI entry layer, cross-platform (Web + Android + iOS).

## Architecture
- **Frontend**: React + Tailwind CSS + Shadcn UI + Capacitor (mobile)
- **Backend**: FastAPI + MongoDB (Motor) + JWT auth
- **CI/CD**: GitHub Actions → signed AAB + APK builds
- **AI**: Emergent LLM Key (gpt-4.1-mini) for NL entry parsing

## Core Accounting Logic (DO NOT REVERT)
- NAAM (Credit) = Party owes us → DENA HAI (Blue)
- JAMA (Debit) = Party paid us → LENA HAI (Red)

## Implemented Features

### Auth
- Login/Register/Change Password/Forgot Password
- JWT tokens, bcrypt passwords
- Superadmin panel at /superadmin

### Ledger
- Double-entry system with auto-mirror entries
- Mobile curtain panel (toggle New Entry up/down)
- Duplicate entry prevention (savingLockRef)
- AI NL entry parser ("Vansh ko 500 dena hai" → fills form)
- WhatsApp share button (text summary via wa.me)
- Print/PDF with PoketBook + FlutterFox branding

### Balance Sheet
- Two-column independent scroll: Dena (Blue) | Lena (Red)
- Desktop: Print/PDF + Excel buttons beside Refresh (compact)
- Mobile: Full-width Print + Excel buttons
- Authenticated Excel download (blob)

### Dashboard
- Subscription countdown (X days remaining, color-coded)
- Google Sheets backup connect/sync
- Language toggle (Hindi/English) in navbar

### Export/Statement
- PDF + Excel for ledger and balance sheet
- All PDFs branded: "PoketBook — Powered by Flutter Fox"
- Mobile-optimized layout (full-width controls)

### Settings
- Change Password + Forgot Password

### Landing Page
- Privacy Policy (/privacy) + Terms & Conditions (/terms)
- Flutter Fox gradient logo (orange→pink brand colors)
- Footer links: Privacy | Terms | Contact

### Mobile / CI-CD
- GitHub Actions FIXED: signed AAB + APK (14.6 MB each)
- Key fixes: secrets context in if:, app/app/ keystore path, YAML syntax
- App icon: book symbol only (no text), dark navy background

### Performance
- useMemo for unlocked count, total sums
- Timestamp UTC+00:00 serialization (IST display fix)
- Toast duration 1500ms globally

### Google OAuth
- Dynamic redirect URI (fixed to env var)
- google-auth-oauthlib installed in requirements.txt
- Callback stores redirect_uri at connect-time

## Subscription Plans
- Trial: FREE / 7 days
- Weekly: ₹129 / 7 days
- Monthly: ₹499 / 30 days
- Yearly: ₹5799 / 365 days

## Recent Fixes (May 2026)
- BalanceSheet.jsx screenshot now targets `document.body` (full-screen like native screenshot), matching LedgerPage.jsx
- Balance sheet PDF/Excel export now sorts parties A→Z by name (was previously sorted by amount desc)
- Resend email integration: email verification on signup, banner for existing unverified users, subscription expiry reminders (cron job), password reset emails now sent via Resend
- LedgerPage.jsx componentized: 1050 → 403 lines (state/hooks only). 5 focused files in src/components/ledger/

## Pending / Backlog
- MSG91 SMS OTP (needs MSG91_AUTH_KEY from user)
- server.py refactor (1600+ lines monolith)
- LedgerPage componentization
- Full virtual scroll for very large entry lists (1000+)
- iOS build (needs Apple Developer certs)

## Test Credentials
- Admin: admin@khaata.com / admin123
- SuperAdmin: superadmin@poketbook.in / PoketBook@Super2024
- SuperAdmin URL: /superadmin
