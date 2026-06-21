#!/usr/bin/env bash
# Резервная копия PostgreSQL Lot&Go
# Запуск на сервере (cron): 0 3 * * * bash /var/www/lotgo/scripts/backup-db.sh
set -euo pipefail

ROOT="/var/www/lotgo"
BACKUP_DIR="${BACKUP_DIR:-/var/backups/lotgo}"
KEEP_DAYS="${KEEP_DAYS:-14}"
STAMP="$(date +%Y%m%d_%H%M%S)"
FILE="$BACKUP_DIR/lotgo_${STAMP}.sql.gz"

mkdir -p "$BACKUP_DIR"

if [[ -f "$ROOT/.env" ]]; then
  set -a
  # shellcheck disable=SC1091
  source <(grep -E '^DATABASE_URL=' "$ROOT/.env" | sed 's/^/export /')
  set +a
fi

if [[ -z "${DATABASE_URL:-}" ]]; then
  echo "DATABASE_URL не задан"
  exit 1
fi

pg_dump "$DATABASE_URL" | gzip > "$FILE"
echo "OK: $FILE ($(du -h "$FILE" | cut -f1))"

find "$BACKUP_DIR" -name 'lotgo_*.sql.gz' -mtime +"$KEEP_DAYS" -delete
