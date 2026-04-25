#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  poketbook Mobile App Builder
#  Builds Android APK + iOS IPA with shared backend database
# ═══════════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; CYAN='\033[0;36m'; NC='\033[0m'
BOLD='\033[1m'

print_header() {
  echo ""
  echo -e "${BLUE}╔══════════════════════════════════════════════════╗${NC}"
  echo -e "${BLUE}║  🚀  poketbook Mobile App Builder                 ║${NC}"
  echo -e "${BLUE}║  🌐  Shared Backend → Same Database               ║${NC}"
  echo -e "${BLUE}╚══════════════════════════════════════════════════╝${NC}"
  echo ""
}

check_tool() {
  if command -v "$1" &> /dev/null; then
    echo -e "${GREEN}  ✓ $1 found${NC}"
    return 0
  else
    echo -e "${RED}  ✗ $1 not found${NC}"
    return 1
  fi
}

BACKEND_URL="https://party-tally-1.preview.emergentagent.com"

print_header

# ── Menu ────────────────────────────────────────────────────────
echo -e "${BOLD}Which platform do you want to build?${NC}"
echo ""
echo "  1) 🤖  Android APK only"
echo "  2) 🍎  iOS IPA only (requires macOS + Xcode)"
echo "  3) 📱  Both Android + iOS"
echo ""
read -p "Enter choice (1-3): " PLATFORM_CHOICE
echo ""

BUILD_ANDROID=false
BUILD_IOS=false
case "$PLATFORM_CHOICE" in
  1) BUILD_ANDROID=true ;;
  2) BUILD_IOS=true ;;
  3) BUILD_ANDROID=true; BUILD_IOS=true ;;
  *) echo -e "${RED}Invalid choice${NC}"; exit 1 ;;
esac

# ── Check prerequisites ─────────────────────────────────────────
echo -e "${BOLD}Checking prerequisites...${NC}"
MISSING=0

check_tool "node" || MISSING=1
check_tool "yarn" || { check_tool "npm" && alias yarn="npm run" || MISSING=1; }
check_tool "java" || MISSING=1

if $BUILD_ANDROID; then
  echo ""
  echo -e "${CYAN}Android requirements:${NC}"
  if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
    echo -e "${RED}  ✗ ANDROID_HOME not set${NC}"
    echo -e "${YELLOW}    Install Android Studio: https://developer.android.com/studio${NC}"
    echo -e "${YELLOW}    Then: export ANDROID_HOME=~/Android/Sdk  (Linux/Mac)${NC}"
    echo -e "${YELLOW}    Or:   setx ANDROID_HOME C:\\Users\\YourUser\\AppData\\Local\\Android\\Sdk  (Windows)${NC}"
    MISSING=1
  else
    echo -e "${GREEN}  ✓ ANDROID_HOME = ${ANDROID_HOME:-$ANDROID_SDK_ROOT}${NC}"
  fi
fi

if $BUILD_IOS; then
  echo ""
  echo -e "${CYAN}iOS requirements:${NC}"
  if [[ "$OSTYPE" != "darwin"* ]]; then
    echo -e "${RED}  ✗ iOS builds ONLY work on macOS${NC}"
    echo -e "${YELLOW}    Use a Mac with Xcode installed to build iOS${NC}"
    BUILD_IOS=false
    MISSING=0
  else
    check_tool "xcodebuild" || MISSING=1
    check_tool "pod" || {
      echo -e "${YELLOW}  ⚠ CocoaPods not found. Installing...${NC}"
      sudo gem install cocoapods
    }
  fi
fi

if [ "$MISSING" = "1" ]; then
  echo ""
  echo -e "${RED}Please install missing prerequisites and try again.${NC}"
  exit 1
fi

# ── Step 1: Install dependencies ──────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}Step 1/4: Installing dependencies...${NC}"
cd frontend
yarn install
echo -e "${GREEN}  ✓ Dependencies installed${NC}"

# ── Step 2: Build React app ────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}Step 2/4: Building React web app...${NC}"
echo -e "  Backend URL: ${CYAN}$BACKEND_URL${NC}"
CI=false \
DISABLE_ESLINT_PLUGIN=true \
REACT_APP_BACKEND_URL=$BACKEND_URL \
yarn build
echo -e "${GREEN}  ✓ Web app built → ./frontend/build/${NC}"

# ── Step 3: Sync Capacitor ─────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}Step 3/4: Syncing Capacitor...${NC}"

if $BUILD_ANDROID && $BUILD_IOS; then
  npx cap sync
elif $BUILD_ANDROID; then
  npx cap sync android
elif $BUILD_IOS; then
  npx cap sync ios
fi
echo -e "${GREEN}  ✓ Capacitor synced${NC}"

# ── Step 4: Build apps ─────────────────────────────────────────
echo ""
echo -e "${BOLD}${BLUE}Step 4/4: Building apps...${NC}"
echo ""

# ── Android Build ─────────────────────────────────────────────
if $BUILD_ANDROID; then
  echo -e "${BOLD}🤖 Building Android APK...${NC}"
  cd android
  chmod +x gradlew

  echo ""
  echo "  Build type:"
  echo "    D) Debug APK  (for testing, no signing required)"
  echo "    R) Release APK (for distribution)"
  read -p "  Enter D or R: " ANDROID_BUILD_TYPE
  echo ""

  if [[ "$ANDROID_BUILD_TYPE" =~ ^[Rr]$ ]]; then
    echo -e "${YELLOW}  Building Release APK...${NC}"
    ./gradlew assembleRelease
    APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
    SIGNED_APK="app/build/outputs/apk/release/poketbook-release.apk"

    echo ""
    echo -e "${YELLOW}  Signing the APK...${NC}"
    read -p "  Do you have a keystore? (y/N): " HAS_KEYSTORE
    if [[ "$HAS_KEYSTORE" =~ ^[Yy]$ ]]; then
      read -p "  Keystore path: " KEYSTORE_PATH
      read -p "  Key alias: " KEY_ALIAS
      jarsigner -verbose \
        -sigalg SHA256withRSA \
        -digestalg SHA-256 \
        -keystore "$KEYSTORE_PATH" \
        "$APK_PATH" "$KEY_ALIAS"
      cp "$APK_PATH" "$SIGNED_APK"
      echo -e "${GREEN}  ✓ Signed APK: $SIGNED_APK${NC}"
    else
      echo -e "${YELLOW}  Creating new keystore for poketbook...${NC}"
      keytool -genkey -v \
        -keystore poketbook-release.keystore \
        -alias poketbook \
        -keyalg RSA \
        -keysize 2048 \
        -validity 10000 \
        -dname "CN=poketbook, OU=Flutter Fox, O=Flutter Fox, L=Delhi, S=Delhi, C=IN"
      jarsigner -verbose \
        -sigalg SHA256withRSA \
        -digestalg SHA-256 \
        -keystore poketbook-release.keystore \
        "$APK_PATH" poketbook
      cp "$APK_PATH" "$SIGNED_APK"
      echo -e "${GREEN}  ✓ Signed APK: frontend/android/$SIGNED_APK${NC}"
      echo -e "${YELLOW}  ⚠ Save poketbook-release.keystore safely — needed for future updates!${NC}"
    fi
  else
    echo -e "${YELLOW}  Building Debug APK...${NC}"
    ./gradlew assembleDebug
    APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
    echo -e "${GREEN}  ✓ Debug APK built${NC}"
  fi

  cd ..
  echo ""
  APK_FULL="frontend/android/$APK_PATH"
  APK_SIZE=$(du -h "$APK_FULL" | cut -f1)
  echo -e "${GREEN}  📦 APK: ${APK_FULL} (${APK_SIZE})${NC}"
fi

# ── iOS Build ──────────────────────────────────────────────────
if $BUILD_IOS; then
  echo ""
  echo -e "${BOLD}🍎 Building iOS IPA...${NC}"
  cd ios/App

  echo "  Installing CocoaPods..."
  pod install
  echo -e "${GREEN}  ✓ Pods installed${NC}"

  echo ""
  echo "  Build type:"
  echo "    D) Debug IPA  (install via AltStore — no Apple account)"
  echo "    R) Release IPA (TestFlight / App Store — Apple Dev account)"
  read -p "  Enter D or R: " IOS_BUILD_TYPE
  echo ""

  if [[ "$IOS_BUILD_TYPE" =~ ^[Rr]$ ]]; then
    echo -e "${YELLOW}  Building Release IPA (requires Apple Developer account)...${NC}"
    read -p "  Enter your Apple Team ID (10-char): " TEAM_ID
    xcodebuild archive \
      -workspace App.xcworkspace \
      -scheme App \
      -configuration Release \
      -destination "generic/platform=iOS" \
      -archivePath ../../poketbook.xcarchive \
      PRODUCT_BUNDLE_IDENTIFIER=in.poketbook.app \
      DEVELOPMENT_TEAM="$TEAM_ID"

    xcodebuild -exportArchive \
      -archivePath ../../poketbook.xcarchive \
      -exportPath ../../poketbook-ipa \
      -exportOptionsPlist ExportOptions.plist \
      DEVELOPMENT_TEAM="$TEAM_ID"

    IPA_PATH="../../poketbook-ipa/poketbook.ipa"
  else
    echo -e "${YELLOW}  Building Debug IPA (unsigned — use AltStore to install)...${NC}"
    xcodebuild \
      -workspace App.xcworkspace \
      -scheme App \
      -configuration Debug \
      -destination "generic/platform=iOS" \
      CODE_SIGN_IDENTITY="" \
      CODE_SIGNING_REQUIRED=NO \
      CODE_SIGNING_ALLOWED=NO \
      CONFIGURATION_BUILD_DIR=../../ios-build \
      DEPLOYMENT_POSTPROCESSING=NO \
      2>&1 | grep -E "(error:|warning:|BUILD SUCCEEDED|BUILD FAILED)"

    mkdir -p ../../ios-build/Payload
    mv ../../ios-build/App.app ../../ios-build/Payload/
    cd ../../ios-build
    zip -r ../poketbook-debug.ipa Payload/
    cd ../ios/App
    IPA_PATH="../../poketbook-debug.ipa"
  fi

  cd ../..
  IPA_FULL="frontend/ios/$IPA_PATH"
  IPA_SIZE=$(du -h "$IPA_FULL" 2>/dev/null | cut -f1 || echo "?")
  echo -e "${GREEN}  📦 IPA: ${IPA_FULL} (${IPA_SIZE})${NC}"
fi

# ── Summary ───────────────────────────────────────────────────
echo ""
echo -e "${BOLD}${GREEN}╔══════════════════════════════════════════════════╗${NC}"
echo -e "${BOLD}${GREEN}║  ✅  BUILD COMPLETE!                               ║${NC}"
echo -e "${BOLD}${GREEN}╚══════════════════════════════════════════════════╝${NC}"
echo ""

if $BUILD_ANDROID; then
  echo -e "${CYAN}🤖 Android APK:${NC}"
  echo "   Install: Transfer APK → Settings → Security → Unknown Sources → Install"
  echo "   Demo:    admin@khaata.com / admin123"
  echo ""
fi

if $BUILD_IOS; then
  echo -e "${CYAN}🍎 iOS IPA:${NC}"
  echo "   Debug:   Install via AltStore (https://altstore.io) — FREE, no Apple account"
  echo "   Release: Upload to App Store Connect → TestFlight"
  echo ""
fi

echo -e "${BOLD}🌐 Shared Database:${NC}"
echo "   Web:    https://party-tally-1.preview.emergentagent.com"
echo "   Mobile: Connects to SAME backend → SAME data!"
echo ""
echo -e "${YELLOW}💡 To open in IDE:${NC}"
echo "   Android Studio: cd frontend && npx cap open android"
echo "   Xcode:          cd frontend && npx cap open ios"
echo ""
