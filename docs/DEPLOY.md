# Развёртывание Lot&Go на Debian + домен

Инструкция для **Debian 12** (Bookworm). Сервер: VPS с публичным IP, домен (например `lotgo.ru`).

## 1. Что понадобится

| Компонент | Версия |
|-----------|--------|
| Node.js | 20+ (рекомендуется 22 LTS) |
| PostgreSQL | 15+ |
| nginx | из репозитория Debian |
| certbot | Let's Encrypt SSL |

Стек проекта: **Express + Vite SPA** на порту `8081` (настраивается в `.env`).

## 2. Подготовка сервера

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx certbot python3-certbot-nginx ufw
```

Создайте пользователя для приложения:

```bash
sudo adduser --disabled-password lotgo
sudo usermod -aG sudo lotgo   # опционально
```

## 3. Node.js и pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
node -v   # v22.x
```

## 4. PostgreSQL

```bash
sudo apt install -y postgresql postgresql-contrib
sudo -u postgres psql
```

В psql:

```sql
CREATE USER lotgo WITH PASSWORD 'надёжный_пароль';
CREATE DATABASE lotgo OWNER lotgo;
\q
```

## 5. Загрузка проекта

```bash
sudo mkdir -p /var/www/lotgo
sudo chown lotgo:lotgo /var/www/lotgo
sudo -u lotgo git clone <URL_ВАШЕГО_РЕПО> /var/www/lotgo
cd /var/www/lotgo
sudo -u lotgo pnpm install
```

## 6. Переменные окружения

```bash
sudo -u lotgo cp .env.example .env   # или создайте вручную
sudo -u lotgo nano .env
```

Пример **production** `.env`:

```env
NODE_ENV=production
PORT=8081
HOST=127.0.0.1

DATABASE_URL=postgresql://lotgo:надёжный_пароль@localhost:5432/lotgo
JWT_SECRET=длинная_случайная_строка_минимум_32_символа

# Ваш домен (через запятую — если несколько)
CORS_ORIGIN=https://lotgo.ru,https://www.lotgo.ru

# Загрузки (папка uploads в корне проекта)
UPLOAD_DIR=uploads

# Платежи: local (тест) или stripe
PAYMENT_PROVIDER=local
```

Сгенерировать секрет:

```bash
openssl rand -base64 48
```

## 7. База данных

```bash
cd /var/www/lotgo
sudo -u lotgo pnpm db:migrate
sudo -u lotgo pnpm db:seed        # базовые данные
# sudo -u lotgo pnpm db:seed:demo  # демо-лоты (опционально)
```

Папка загрузок:

```bash
sudo -u lotgo mkdir -p uploads
```

## 8. Сборка фронтенда

```bash
cd /var/www/lotgo
sudo -u lotgo pnpm build
```

Проверка локально на сервере:

```bash
sudo -u lotgo pnpm start
curl -I http://127.0.0.1:8081
# Ctrl+C после проверки
```

## 9. systemd (автозапуск)

```bash
sudo nano /etc/systemd/system/lotgo.service
```

```ini
[Unit]
Description=Lot&Go Auction Platform
After=network.target postgresql.service

[Service]
Type=simple
User=lotgo
WorkingDirectory=/var/www/lotgo
Environment=NODE_ENV=production
ExecStart=/usr/bin/pnpm start
Restart=on-failure
RestartSec=5

[Install]
WantedBy=multi-user.target
```

```bash
sudo systemctl daemon-reload
sudo systemctl enable lotgo
sudo systemctl start lotgo
sudo systemctl status lotgo
```

Логи: `journalctl -u lotgo -f`

## 10. DNS домена

У регистратора домена создайте записи:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | IP_ВАШЕГО_СЕРВЕРА |
| A | `www` | IP_ВАШЕГО_СЕРВЕРА |

Подождите 5–30 минут распространения DNS.

## 11. nginx (reverse proxy)

```bash
sudo nano /etc/nginx/sites-available/lotgo
```

```nginx
server {
    listen 80;
    server_name lotgo.ru www.lotgo.ru;

    client_max_body_size 20M;

    location / {
        proxy_pass http://127.0.0.1:8081;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "upgrade";
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
}
```

```bash
sudo ln -s /etc/nginx/sites-available/lotgo /etc/nginx/sites-enabled/
sudo nginx -t
sudo systemctl reload nginx
```

## 12. SSL (HTTPS)

```bash
sudo certbot --nginx -d lotgo.ru -d www.lotgo.ru
```

Certbot настроит редирект HTTP → HTTPS. Продление: `sudo certbot renew --dry-run`.

Обновите `.env`:

```env
CORS_ORIGIN=https://lotgo.ru,https://www.lotgo.ru
```

```bash
sudo systemctl restart lotgo
```

## 13. Файрвол

```bash
sudo ufw allow OpenSSH
sudo ufw allow 'Nginx Full'
sudo ufw enable
```

Порт `8081` снаружи **не открывайте** — только nginx на 80/443.

## 14. Обновление версии

```bash
cd /var/www/lotgo
sudo -u lotgo git pull
sudo -u lotgo pnpm install
sudo -u lotgo pnpm db:migrate
sudo -u lotgo pnpm build
sudo systemctl restart lotgo
```

## 15. Чеклист после деплоя

- [ ] Сайт открывается по `https://lotgo.ru`
- [ ] Регистрация и вход работают
- [ ] WebSocket (ставки в реальном времени) — в DevTools нет ошибок `ws`
- [ ] Загрузка фото лота сохраняется в `uploads/`
- [ ] Админ-панель: `/admin` (логин `admin@lotgo.ru` после seed)

## Демо-аккаунты (после `db:seed:demo`)

Пароль для всех: `Demo123456`

- `admin@lotgo.ru` — администратор
- `seller@lotgo.ru` — продавец
- `bidder1@lotgo.ru`, `bidder2@lotgo.ru` — покупатели

## Частые проблемы

**502 Bad Gateway** — сервис не запущен: `systemctl status lotgo`.

**CORS / cookies** — проверьте `CORS_ORIGIN` и что сайт открыт по HTTPS с тем же доменом.

**WebSocket обрывается** — в nginx нужны заголовки `Upgrade` и `Connection` (см. конфиг выше).

**База не подключается** — проверьте `DATABASE_URL`, что PostgreSQL слушает `localhost` и пользователь `lotgo` имеет доступ.
