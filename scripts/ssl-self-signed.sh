#!/bin/bash
# Самоподписанный SSL (без certbot). Браузер покажет предупреждение — ок для теста.
# Для доверенного сертификата: scripts/ssl-acme-dns.sh

set -euo pipefail

DOMAIN="${1:-lotgo.ru}"
SSL_DIR="/etc/nginx/ssl/lotgo"
DAYS=365

sudo mkdir -p "$SSL_DIR"

sudo openssl req -x509 -nodes -days "$DAYS" -newkey rsa:4096 \
  -keyout "$SSL_DIR/privkey.pem" \
  -out "$SSL_DIR/fullchain.pem" \
  -subj "/CN=${DOMAIN}/O=LotGo/C=RU"

sudo chmod 600 "$SSL_DIR/privkey.pem"
sudo chmod 644 "$SSL_DIR/fullchain.pem"

echo "Готово: $SSL_DIR/fullchain.pem"
echo "Перезагрузите nginx: sudo nginx -t && sudo systemctl reload nginx"
echo "Сайт: https://${DOMAIN}:3454 или https://77.50.193.34:3454"
