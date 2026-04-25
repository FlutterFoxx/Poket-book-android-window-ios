# Test Credentials — PoketBook App

## Admin Account
- Email: admin@khaata.com
- Password: admin123
- Role: admin

## Super Admin Account
- Email: superadmin@poketbook.in
- Password: PoketBook@Super2024
- Role: superadmin
- Panel: /superadmin

## Subscription Plans
- Trial: ₹89 / 15 days (auto on registration)
- Weekly: ₹129 / 7 days
- Monthly: ₹499 / 30 days
- Yearly: ₹5799 / 365 days (orig ₹6199)

## Key API Endpoints
- POST /api/auth/send-otp { phone }
- POST /api/auth/verify-otp { phone, otp, name }
- GET /api/superadmin/stats
- GET /api/superadmin/users
- POST /api/superadmin/users/:id/subscription { subscription_type, duration_days }
- GET /api/export/csv-backup
- GET /api/oauth/sheets/connect

## External Integrations
- MSG91_AUTH_KEY → from msg91.com dashboard (phone OTP - placeholder ready)
- GOOGLE_CLIENT_ID → 190943738344-q0ekv9t1t0g6rm5g333oqnl21tgugs71.apps.googleusercontent.com ✅
- GOOGLE_CLIENT_SECRET → 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 ✅
- GOOGLE_REDIRECT_URI → https://party-tally-1.preview.emergentagent.com/api/oauth/sheets/callback
  ⚠️ Add this URI to Google Cloud Console → OAuth 2.0 Credentials → Authorized redirect URIs
