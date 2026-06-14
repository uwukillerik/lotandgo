#!/bin/bash
# Подписанный APK через Android SDK. Без Expo.
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ANDROID_APP="$ROOT/android-app"
OUT="$ROOT/public/downloads/lotgo.apk"
KEYSTORE_DIR="$ANDROID_APP/keystore"
KEYSTORE_FILE="$KEYSTORE_DIR/lotgo-release.jks"
PROPS_FILE="$KEYSTORE_DIR/keystore.properties"

export ANDROID_HOME="${ANDROID_HOME:-${ANDROID_SDK_ROOT:-$HOME/Android/Sdk}}"

if [ ! -d "$ANDROID_HOME" ]; then
  echo "ANDROID_HOME не найден. Установите Android Studio."
  exit 1
fi

if [ ! -f "$KEYSTORE_FILE" ]; then
  echo "-> Создаём ключ подписи Lot&Go"
  mkdir -p "$KEYSTORE_DIR"
  keytool -genkeypair -v \
    -keystore "$KEYSTORE_FILE" \
    -storepass "LotGo2026!" \
    -alias lotgo \
    -keypass "LotGo2026!" \
    -keyalg RSA -keysize 2048 -validity 10000 \
    -dname "CN=Lot and Go, OU=Mobile, O=LotGo, L=Moscow, ST=Moscow, C=RU"
fi

if [ ! -f "$PROPS_FILE" ]; then
  cp "$KEYSTORE_DIR/keystore.properties.example" "$PROPS_FILE"
fi

cd "$ANDROID_APP"

if [ ! -f "./gradlew" ]; then
  if command -v gradle >/dev/null; then
    gradle wrapper --gradle-version 8.9
  else
    echo "Откройте android-app в Android Studio (Sync Project)."
    exit 1
  fi
fi

chmod +x gradlew
./gradlew assembleRelease --no-daemon

APK="app/build/outputs/apk/release/app-release.apk"
mkdir -p "$(dirname "$OUT")"
cp "$APK" "$OUT"
echo "ГОТОВО: $OUT"
