#!/usr/bin/env bash
# Одна команда: обновить код, env, зависимости, сборка, перезапуск.
# Запуск на сервере от root:
#   bash /var/www/lotgo/scripts/update-server.sh
set -euo pipefail

ROOT="/var/www/lotgo"
cd "$ROOT"

echo "==> sync .env"
bash "$ROOT/scripts/sync-env.sh"

echo "==> git pull"
sudo -u lotgo git stash push -m "auto-$(date +%s)" 2>/dev/null || true
sudo -u lotgo git pull origin main

echo "==> pnpm install"
sudo -u lotgo pnpm install

echo "==> db migrate"
sudo -u lotgo pnpm db:migrate

echo "==> build"
sudo -u lotgo pnpm build

echo "==> restart lotgo"
systemctl restart lotgo

echo "==> ждём старт (10 сек)..."
sleep 10

systemctl status lotgo --no-pager || true

for i in 1 2 3 4 5; do
  if curl -sf -o /dev/null -I http://127.0.0.1:8081; then
    echo "OK: http://127.0.0.1:8081"
    curl -I http://127.0.0.1:8081 | head -n 1
    exit 0
  fi
  echo "ожидание... ($i/5)"
  sleep 3
done

echo "ОШИБКА: приложение не отвечает на 8081"
journalctl -u lotgo -n 40 --no-pager
exit 1
