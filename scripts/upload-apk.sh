#!/usr/bin/env bash
# Загрузить собранный APK на сервер (после pnpm build:apk локально).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
APK="$ROOT/public/downloads/lotgo.apk"
HOST="${DEPLOY_HOST:-77.50.193.34}"
PORT="${DEPLOY_SSH_PORT:-9022}"
USER="${DEPLOY_USER:-root}"
REMOTE_DIR="/var/www/lotgo/public/downloads"

if [[ ! -f "$APK" ]]; then
  echo "APK не найден: $APK"
  echo "Сначала соберите: pnpm build:apk"
  exit 1
fi

echo "-> $APK -> $USER@$HOST:$REMOTE_DIR/"
scp -P "$PORT" "$APK" "$USER@$HOST:$REMOTE_DIR/lotgo.apk"
ssh -p "$PORT" "$USER@$HOST" "chown lotgo:lotgo $REMOTE_DIR/lotgo.apk && ls -lh $REMOTE_DIR/lotgo.apk"
echo "Готово: https://lotgo.ru:3454/downloads/lotgo.apk"
