#!/usr/bin/env bash
set -euo pipefail

# FOCUS//OS — Stage 7 Verification & APK Generation Script
# Run inside /android with JDK 17 + Android SDK 35 configured.

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR"

if ! command -v java >/dev/null 2>&1; then
  echo "ERROR: JDK 17+ is required to compile Android builds." >&2
  exit 1
fi

GRADLE_CMD="./gradlew"
if [ ! -x "$GRADLE_CMD" ]; then
  if command -v gradle >/dev/null 2>&1; then
    GRADLE_CMD="gradle"
  else
    echo "ERROR: Neither ./gradlew nor system gradle found. Open /android in Android Studio first." >&2
    exit 1
  fi
fi

echo "==> [1/4] Running JVM unit tests..."
$GRADLE_CMD testDebugUnitTest

echo "==> [2/4] Running Android Lint..."
$GRADLE_CMD lintDebug

echo "==> [3/4] Building Debug APK..."
$GRADLE_CMD assembleDebug

echo "==> [4/4] Building Release APK (R8 minified + resource shrink)..."
$GRADLE_CMD assembleRelease

echo ""
echo "Build complete. Generated APK artifacts:"
for apk in app/build/outputs/apk/debug/*.apk app/build/outputs/apk/release/*.apk; do
  if [ -f "$apk" ]; then
    SIZE="$(du -h "$apk" | cut -f1)"
    SHA="$(sha256sum "$apk" | cut -d' ' -f1)"
    echo "  - $apk ($SIZE) sha256:$SHA"
  fi
done
