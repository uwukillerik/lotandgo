#!/usr/bin/env bash
# Добавляет в .env только отсутствующие ключи из deploy/env.production (не перезаписывает).
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
ENV_FILE="$ROOT/.env"
DEFAULTS="$ROOT/deploy/env.production"

if [[ ! -f "$DEFAULTS" ]]; then
  echo "Нет $DEFAULTS"
  exit 1
fi

if [[ ! -f "$ENV_FILE" ]]; then
  cp "$DEFAULTS" "$ENV_FILE"
  chown lotgo:lotgo "$ENV_FILE" 2>/dev/null || true
  chmod 600 "$ENV_FILE"
  echo "Создан .env из deploy/env.production"
  exit 0
fi

added=0
while IFS= read -r line || [[ -n "$line" ]]; do
  [[ -z "$line" || "$line" =~ ^[[:space:]]*# ]] && continue
  key="${line%%=*}"
  value="${line#*=}"
  [[ -z "$key" ]] && continue
  if ! grep -q "^${key}=" "$ENV_FILE"; then
    echo "${key}=${value}" >> "$ENV_FILE"
    added=$((added + 1))
  fi
done < "$DEFAULTS"

echo "sync-env: добавлено ключей — $added"
chown lotgo:lotgo "$ENV_FILE" 2>/dev/null || true
chmod 600 "$ENV_FILE" 2>/dev/null || true
