# KhataBook — Udhar/Khaata Ledger System
## Product Requirements Document

**Created:** April 17, 2026  
**Updated:** April 17, 2026 (UI redesign based on reference software)
**Stack:** React + Tailwind CSS (Frontend), FastAPI + MongoDB (Backend)

---

## Problem Statement
Build a desktop-first, high-speed ledger accounting application (Udhar/Khaata system) for Indian small business owners. Transaction ledger with fast keyboard-driven data entry, party-based accounting, running balance calculation, locking/tally system.

## Core Accounting Logic
**Formula:** `balance = prev_balance + jama (debit) - naam (credit)`  
- Negative Balance → **Lena Hai / लेने** (Receivable) = Blue (left column in balance sheet)
- Positive Balance → **Dena Hai / देने** (Payable) = Red (right column in balance sheet)

---

## Architecture
- **Frontend:** React + Tailwind CSS, Hinglish (Hindi+English) bilingual UI
- **Backend:** FastAPI + MongoDB (Motor async driver), JWT Bearer auth
- **Auth:** JWT tokens in sessionStorage, Authorization Bearer header
- **CORS:** allow_origins=["*"] (Kubernetes ingress compatibility)

---

## UI Design (Reference-based redesign)
Redesigned to match legacy BitBetts accounting software reference:

### Ledger Page
- Red/pink header bar: "Settling Entry | Party :- [name] | Mobile :- [number]"
- Peach/salmon alternating rows (#FFE8CC/#FFD9AA)
- Chocolate brown (#D2691E) table headers with Hindi labels: नाम (Credit) / जमा (Debit)
- Balance display: "500.00 लेने" (blue) or "500.00 देने" (red)
- Orange entry row at bottom with OK/Clear buttons
- Status bar: Entries count | Locked | Open

### Balance Sheet
- Red header bar: "Settling Report / Balance Sheet" with radio filter buttons
- Two-column dense table: Left = BLUE (Lena Hai / लेना है), Right = RED (Dena Hai / देना है)
- Party count per column [n parties]
- Total at bottom + Net Balance
- Print/PDF + Excel Export buttons

---

## What's Been Implemented

### Auth (JWT)
- Login/Register, Bearer token auth, admin auto-seeded: admin@khaata.com / admin123

### Party Management
- Create/Edit/Delete with double DELETE confirmation

### Ledger System
- High-density table with peach/salmon rows, sticky entry row
- Tab/Enter keyboard navigation, Hindi labels
- Running balance with लेने/देने display

### Lock/Tally System
- Lock all entries, immutable after lock, tally snapshot

### Balance Sheet (reference-style)
- Two-column: Blue=Lena Hai (left), Red=Dena Hai (right)
- Filter toggles, party counts, totals

### Export
- PDF + Excel for ledger and balance sheet

---

## Test Credentials
- Admin: admin@khaata.com / admin123
