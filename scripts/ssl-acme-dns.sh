#!/bin/bash
# Let's Encrypt через acme.sh (без certbot), DNS-01 — работает с портами 7080/3454.
# Нужен API Reg.ru: https://www.reg.ru/user/account/#/settings/api/

set -euo pipefail

DOMAIN="${1:-lotgo.ru}"
SSL_DIR="/etc/nginx/ssl/lotgo"
ACME_HOME="${ACME_HOME:-$HOME/.acme.sh}"

if [ ! -f "$ACME_HOME/acme.sh" ]; then
  curl -fsSL https://get.acme.sh | sh -s email=admin@${DOMAIN}
fi

export REGRU_Username="${REGRU_Username:?Задайте REGRU_Username}"
export REGRU_Password="${REGRU_Password:?Задайте REGRU_Password}"

"$ACME_HOME/acme.sh" --issue --dns dns_regru -d "$DOMAIN" -d "www.$DOMAIN"

sudo mkdir -p "$SSL_DIR"
"$ACME_HOME/acme.sh" --install-cert -d "$DOMAIN" \
  --key-file       "$SSL_DIR/privkey.pem" \
  --fullchain-file "$SSL_DIR/fullchain.pem" \
  --reloadcmd      "sudo nginx -t && sudo systemctl reload nginx"

echo "SSL установлен в $SSL_DIR"
echo "Продление: $ACME_HOME/acme.sh --cron"
