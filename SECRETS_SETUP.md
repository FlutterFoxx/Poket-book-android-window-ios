# 🔑 GitHub Secrets Setup Guide
## poketbook CI/CD — Required Secrets

All signing keys, passwords, and certificates are stored ONLY in GitHub Secrets.
**Never commit keys to code files.**

---

## Where to Add Secrets

1. Go to your GitHub repository
2. Click **Settings** → **Secrets and variables** → **Actions**
3. Click **New repository secret**

---

## 🤖 Android Secrets

### Step 1: Generate Keystore (do once, store forever)

```bash
keytool -genkeypair -v \
  -keystore poketbook-release.keystore \
  -alias poketbook \
  -keyalg RSA \
  -keysize 4096 \
  -validity 10000 \
  -dname "CN=poketbook, OU=Flutter Fox, O=Flutter Fox, L=Delhi, S=Delhi, C=IN"

# You will be prompted for:
# - Keystore password → store as ANDROID_KEYSTORE_PASSWORD
# - Key password      → store as ANDROID_KEY_PASSWORD
```

### Step 2: Encode keystore to base64

```bash
# macOS
base64 -i poketbook-release.keystore | pbcopy

# Linux
base64 -w 0 poketbook-release.keystore

# Windows PowerShell
[Convert]::ToBase64String([IO.File]::ReadAllBytes("poketbook-release.keystore")) | Set-Clipboard
```

### Step 3: Add these secrets to GitHub

| Secret Name | Value | How to Get |
|-------------|-------|-----------|
| `ANDROID_SIGNING_KEY` | Base64 output from step 2 | `base64 poketbook-release.keystore` |
| `ANDROID_KEYSTORE_PASSWORD` | Password you chose in step 1 | Your chosen password |
| `ANDROID_KEY_ALIAS` | `poketbook` | Set in -alias above |
| `ANDROID_KEY_PASSWORD` | Same as keystore password | Usually same password |

> ⚠️ **CRITICAL:** Save `poketbook-release.keystore` somewhere safe (password manager).
> If you lose it, you CANNOT update your Play Store app.

---

## 🍎 iOS Secrets

### Step 1: Create Distribution Certificate (requires Apple Developer Account)

1. Go to https://developer.apple.com/account → Certificates
2. Click **+** → **Apple Distribution** certificate
3. Follow the steps to generate and download `.cer`
4. Double-click `.cer` to install in Keychain Access
5. In Keychain Access: right-click → Export as `.p12`
6. Set a password (this is `IOS_P12_PASSWORD`)

### Step 2: Encode P12 to base64

```bash
base64 -i distribution.p12 | pbcopy    # macOS
base64 -w 0 distribution.p12            # Linux
```

### Step 3: Create App Store Connect API Key

1. Go to https://appstoreconnect.apple.com → Users → Integrations → Keys
2. Click **+** → Name: "GitHub Actions" → Role: App Manager
3. Download the `.p8` file → copy its contents
4. Note the **Key ID** and **Issuer ID**

### Step 4: Create Provisioning Profile

1. Go to https://developer.apple.com/account → Profiles
2. Click **+** → App Store Distribution
3. Select App ID: `in.poketbook.app`
4. Select your distribution certificate
5. Name it: `poketbook App Store`

### Step 5: Add these secrets to GitHub

| Secret Name | Value | How to Get |
|-------------|-------|-----------|
| `IOS_P12_BASE64` | Base64 of .p12 file | `base64 distribution.p12` |
| `IOS_P12_PASSWORD` | Password you set in step 1 | Your chosen password |
| `APPLE_ISSUER_ID` | App Store Connect Issuer ID | App Store Connect → Keys page |
| `APPLE_KEY_ID` | App Store Connect Key ID | App Store Connect → Keys page |
| `APPLE_PRIVATE_KEY` | Contents of .p8 file | `cat AuthKey_XXXXX.p8` |

---

## 🔒 Security Checklist

- [ ] `.keystore` file is NOT committed to git
- [ ] Keystore is backed up in a password manager
- [ ] P12 certificate is NOT committed to git
- [ ] P8 key file is NOT committed to git
- [ ] All workflow files reference only `${{ secrets.NAME }}` — no hardcoded values
- [ ] `.gitignore` includes `*.keystore`, `*.p12`, `*.p8`

### Add to .gitignore

```gitignore
# Mobile signing — NEVER commit these
*.keystore
*.jks
*.p12
*.p8
*.mobileprovision
distribution.p12
poketbook-release.keystore
```

---

## 🧪 Test Secrets Are Working

1. Go to **Actions** → **Build & Release poketbook Apps**
2. Click **Run workflow** → Platform: `android` → Click **Run**
3. Watch logs — if keystore decode step passes, Android secrets are correct
4. Run again with Platform: `ios` to test iOS secrets

---

## 🗂️ Summary Table

| Secret Name | Platform | Required For |
|-------------|----------|-------------|
| `ANDROID_SIGNING_KEY` | Android | Signing AAB/APK |
| `ANDROID_KEYSTORE_PASSWORD` | Android | Opening keystore |
| `ANDROID_KEY_ALIAS` | Android | Key alias in keystore |
| `ANDROID_KEY_PASSWORD` | Android | Signing key |
| `IOS_P12_BASE64` | iOS | Code signing certificate |
| `IOS_P12_PASSWORD` | iOS | Opening P12 |
| `APPLE_ISSUER_ID` | iOS | App Store Connect API |
| `APPLE_KEY_ID` | iOS | App Store Connect API |
| `APPLE_PRIVATE_KEY` | iOS | App Store Connect API auth |
| `GITHUB_TOKEN` | Both | Auto-provided by GitHub — no setup needed |

---

*Flutter Fox · poketbook.in · Solution@poketbook.in*
