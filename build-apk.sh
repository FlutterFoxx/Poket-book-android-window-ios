#!/bin/bash
# ═══════════════════════════════════════════════════════════════
#  poketbook Android APK Builder
#  Run this script on your local machine to generate the APK
#  Requires: Node.js 18+, Java 17+, Android SDK
# ═══════════════════════════════════════════════════════════════

set -e
RED='\033[0;31m'; GREEN='\033[0;32m'; YELLOW='\033[1;33m'; BLUE='\033[0;34m'; NC='\033[0m'

echo -e "${BLUE}╔════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║   poketbook Android APK Builder        ║${NC}"
echo -e "${BLUE}║   Shared Database with Web App         ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════╝${NC}"
echo ""

# Check prerequisites
echo -e "${YELLOW}Checking prerequisites...${NC}"

if ! command -v node &> /dev/null; then
  echo -e "${RED}✗ Node.js not found. Install from https://nodejs.org${NC}"; exit 1
fi
NODE_VER=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
if [ "$NODE_VER" -lt 16 ]; then
  echo -e "${RED}✗ Node.js 16+ required (found v$NODE_VER)${NC}"; exit 1
fi
echo -e "${GREEN}✓ Node.js $(node -v)${NC}"

if ! command -v java &> /dev/null; then
  echo -e "${RED}✗ Java not found. Install JDK 17 from https://adoptium.net${NC}"; exit 1
fi
echo -e "${GREEN}✓ Java $(java -version 2>&1 | head -1)${NC}"

if [ -z "$ANDROID_HOME" ] && [ -z "$ANDROID_SDK_ROOT" ]; then
  echo -e "${YELLOW}⚠ ANDROID_HOME not set. Install Android Studio: https://developer.android.com/studio${NC}"
  echo -e "${YELLOW}  After installing, set: export ANDROID_HOME=~/Android/Sdk${NC}"
  read -p "Continue anyway? (y/N) " -n 1 -r; echo
  [[ ! $REPLY =~ ^[Yy]$ ]] && exit 1
fi
echo -e "${GREEN}✓ Android SDK: ${ANDROID_HOME:-$ANDROID_SDK_ROOT}${NC}"

echo ""
echo -e "${BLUE}Step 1/4: Installing npm dependencies...${NC}"
cd frontend
yarn install

echo ""
echo -e "${BLUE}Step 2/4: Building React web app...${NC}"
CI=false \
DISABLE_ESLINT_PLUGIN=true \
REACT_APP_BACKEND_URL=https://party-tally-1.preview.emergentagent.com \
yarn build

echo -e "${GREEN}✓ Web app built in ./frontend/build/${NC}"

echo ""
echo -e "${BLUE}Step 3/4: Syncing Capacitor Android...${NC}"
npx cap sync android
echo -e "${GREEN}✓ Android project synced${NC}"

echo ""
echo -e "${BLUE}Step 4/4: Building Android APK...${NC}"
cd android
chmod +x gradlew

echo ""
echo "Choose build type:"
echo "  1) Debug APK (for testing — no signing required)"
echo "  2) Release APK (for distribution — requires keystore)"
read -p "Enter choice (1 or 2): " BUILD_CHOICE

if [ "$BUILD_CHOICE" = "2" ]; then
  echo -e "${YELLOW}Building Release APK...${NC}"
  ./gradlew assembleRelease
  APK_PATH="app/build/outputs/apk/release/app-release-unsigned.apk"
  echo ""
  echo -e "${YELLOW}Note: Release APK is unsigned. To sign it:${NC}"
  echo "  keytool -genkey -v -keystore poketbook.keystore -alias poketbook -keyalg RSA -keysize 2048 -validity 10000"
  echo "  jarsigner -verbose -sigalg SHA256withRSA -digestalg SHA-256 -keystore poketbook.keystore $APK_PATH poketbook"
else
  echo -e "${YELLOW}Building Debug APK...${NC}"
  ./gradlew assembleDebug
  APK_PATH="app/build/outputs/apk/debug/app-debug.apk"
fi

cd ../..

echo ""
echo -e "${GREEN}╔════════════════════════════════════════╗${NC}"
echo -e "${GREEN}║         APK BUILD SUCCESSFUL!          ║${NC}"
echo -e "${GREEN}╚════════════════════════════════════════╝${NC}"
echo ""
APK_FULL="frontend/android/$APK_PATH"
APK_SIZE=$(du -h "$APK_FULL" | cut -f1)
echo -e "${GREEN}✓ APK Location: ${APK_FULL}${NC}"
echo -e "${GREEN}✓ APK Size: ${APK_SIZE}${NC}"
echo ""
echo -e "${BLUE}How to install on Android device:${NC}"
echo "  1. Transfer APK to your Android phone"
echo "  2. Settings → Security → Enable 'Install Unknown Apps'"
echo "  3. Open APK file to install"
echo "  4. Login with same credentials as web app"
echo ""
echo -e "${BLUE}Shared Database:${NC}"
echo "  Web:    https://party-tally-1.preview.emergentagent.com"
echo "  Mobile: Connects to SAME backend API → same data!"
echo ""
echo -e "${YELLOW}To open in Android Studio for further editing:${NC}"
echo "  cd frontend && npx cap open android"
echo ""
