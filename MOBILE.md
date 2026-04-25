# 📱 poketbook Mobile Apps
## Android APK + iOS IPA — Shared Database with Web App

Both mobile apps connect to the **same backend API** → **same MongoDB database**.
Login with the same credentials on web, Android, and iOS.

---

## 🏗️ Project Structure

```
app/
├── backend/           # FastAPI + MongoDB (shared by web + mobile)
├── frontend/          # React web app
│   ├── build/         # Production web build
│   ├── android/       # Android project (Capacitor)
│   ├── ios/           # iOS project (Capacitor)
│   └── capacitor.config.json
├── .github/
│   └── workflows/
│       └── build-apk.yml   # GitHub Actions: auto-build APK + IPA
├── build-apps.sh      # Local build script (interactive)
└── MOBILE.md          # This file
```

---

## 🚀 Quick Build

### Option A: GitHub Actions (Recommended — Zero Setup)

1. Push code to GitHub
2. Go to **Actions** tab → **Build poketbook Apps**
3. Click **Run workflow** → Select platform (Android/iOS/Both)
4. Download APK/IPA from Artifacts when done

### Option B: Local Build Script

```bash
chmod +x build-apps.sh
./build-apps.sh
```

Follow the interactive prompts.

---

## 🤖 Android APK Build

### Prerequisites
- Node.js 18+
- Java 17 (JDK): https://adoptium.net
- Android Studio: https://developer.android.com/studio

### Steps

```bash
# 1. Install Android Studio and set ANDROID_HOME
export ANDROID_HOME=~/Android/Sdk                    # Linux/Mac
export PATH=$PATH:$ANDROID_HOME/platform-tools

# 2. Build React app
cd frontend
REACT_APP_BACKEND_URL=https://party-tally-1.preview.emergentagent.com \
CI=false yarn build

# 3. Sync Capacitor
npx cap sync android

# 4a. Debug APK (for testing)
cd android && ./gradlew assembleDebug
# APK: android/app/build/outputs/apk/debug/app-debug.apk

# 4b. Release APK (for distribution)
cd android && ./gradlew assembleRelease
# APK: android/app/build/outputs/apk/release/app-release-unsigned.apk

# 4c. Open in Android Studio
cd .. && npx cap open android
```

### Sign Release APK (required for Google Play)

```bash
# Generate keystore (do this ONCE, keep it safe!)
keytool -genkey -v \
  -keystore poketbook-release.keystore \
  -alias poketbook \
  -keyalg RSA -keysize 2048 -validity 10000

# Sign the APK
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore poketbook-release.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  poketbook
```

### Install on Android Device

1. Transfer APK to phone (USB/WhatsApp/email)
2. Settings → Security → Enable "Install from Unknown Sources"
3. Open APK → Install

---

## 🍎 iOS IPA Build

### Prerequisites
- **macOS only** (iOS builds cannot be done on Windows/Linux)
- Xcode 15+: https://developer.apple.com/xcode/
- CocoaPods: `sudo gem install cocoapods`
- Apple Developer Account (for TestFlight/App Store distribution)

### Steps

```bash
# 1. Install dependencies
cd frontend
yarn install

# 2. Build React app
REACT_APP_BACKEND_URL=https://party-tally-1.preview.emergentagent.com \
CI=false yarn build

# 3. Sync Capacitor
npx cap sync ios

# 4. Install CocoaPods
cd ios/App && pod install

# 5a. Open in Xcode (easiest way)
cd ../.. && npx cap open ios

# 5b. Build IPA via command line
xcodebuild archive \
  -workspace ios/App/App.xcworkspace \
  -scheme App \
  -configuration Release \
  -destination "generic/platform=iOS" \
  -archivePath poketbook.xcarchive \
  PRODUCT_BUNDLE_IDENTIFIER=in.poketbook.app

xcodebuild -exportArchive \
  -archivePath poketbook.xcarchive \
  -exportPath poketbook-ipa \
  -exportOptionsPlist ios/App/ExportOptions.plist
# IPA: poketbook-ipa/poketbook.ipa
```

### Install on iPhone (without App Store)

**Method 1: AltStore (FREE — no Apple Developer account)**
1. Install AltStore: https://altstore.io
2. Open AltStore → My Apps → + → Select IPA
3. Sign with your Apple ID (free)
4. Refresh every 7 days (free accounts limit)

**Method 2: TestFlight (Apple Developer — $99/year)**
1. Upload IPA to App Store Connect
2. Add testers → Send TestFlight invites
3. Testers install via TestFlight app

**Method 3: Xcode Direct (Development devices only)**
1. Open project in Xcode
2. Connect iPhone via USB
3. Trust device → Run directly

---

## ⚙️ Configuration

### Backend URL (shared between web + mobile)

Currently set to:
```
https://party-tally-1.preview.emergentagent.com
```

To change (for production deployment):
1. Update `frontend/capacitor.config.json` → `server.url`
2. Update `frontend/.env` → `REACT_APP_BACKEND_URL`
3. Rebuild: `yarn build && npx cap sync`

### App Details

| Field | Value |
|-------|-------|
| App ID | `in.poketbook.app` |
| App Name | `poketbook` |
| Version | `1.0.0` |
| Min Android | API 22 (Android 5.0) |
| Min iOS | iOS 13.0 |
| Backend | FastAPI + MongoDB |

---

## 🔑 GitHub Secrets (for GitHub Actions)

Add these in Settings → Secrets → Actions:

### Android Secrets
| Secret | Description |
|--------|-------------|
| `ANDROID_SIGNING_KEY` | Base64 encoded keystore file |
| `ANDROID_KEYSTORE_PASSWORD` | Keystore password |
| `ANDROID_KEY_ALIAS` | Key alias (usually "poketbook") |
| `ANDROID_KEY_PASSWORD` | Key password |

```bash
# Generate keystore and encode to base64
keytool -genkey -v -keystore poketbook.keystore -alias poketbook -keyalg RSA -keysize 2048 -validity 10000
base64 -i poketbook.keystore | pbcopy  # macOS
base64 -w 0 poketbook.keystore | xclip  # Linux
```

### iOS Secrets
| Secret | Description |
|--------|-------------|
| `IOS_P12_BASE64` | Base64 encoded .p12 distribution certificate |
| `IOS_P12_PASSWORD` | .p12 certificate password |
| `APPLE_ISSUER_ID` | App Store Connect API issuer ID |
| `APPLE_KEY_ID` | App Store Connect API key ID |
| `APPLE_PRIVATE_KEY` | App Store Connect API private key (.p8) |

---

## 🌐 Shared Database Architecture

```
┌─────────────────────┐    ┌─────────────────────┐    ┌─────────────────────┐
│   Web Browser       │    │   Android APK        │    │   iOS IPA           │
│   (React PWA)       │    │   (Capacitor)        │    │   (Capacitor)       │
└──────────┬──────────┘    └──────────┬──────────┘    └──────────┬──────────┘
           │                          │                          │
           └──────────────────────────┼──────────────────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  FastAPI Backend         │
                         │  party-tally-1.preview  │
                         │  .emergentagent.com     │
                         └────────────┬────────────┘
                                      │
                         ┌────────────▼────────────┐
                         │  MongoDB Database        │
                         │  (Single shared DB)     │
                         │  - users                │
                         │  - parties              │
                         │  - ledger_entries       │
                         └─────────────────────────┘
```

All three clients (web, Android, iOS) login with the **same credentials** and see the **same data**.

---

*Built with ❤️ by Flutter Fox | poketbook.in*
