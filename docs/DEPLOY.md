# Развёртывание Lot&Go — от А до Я

Полная инструкция для **Debian 12** на VM за роутером **Keenetic**.

| Параметр | Значение |
|----------|----------|
| IP сервера (WAN) | `77.50.193.34` |
| Домен | `lotgo.ru` |
| VM (внутренний IP) | `192.168.1.56` |
| HTTP снаружи | `:7080` → внутри VM `:80` |
| HTTPS снаружи | `:3454` → внутри VM `:443` |
| SSH снаружи | `:9022` → внутри VM `:22` |
| Приложение | Node на `127.0.0.1:8081` |

---

## Часть 1. Подготовка VM (Debian)

Подключитесь по SSH (сначала из локальной сети, потом через `:9022`):

```bash
ssh root@192.168.1.56
# или снаружи: ssh -p 9022 root@77.50.193.34
```

### 1.1 Обновление и пакеты

```bash
sudo apt update && sudo apt upgrade -y
sudo apt install -y curl git nginx openssl ufw
```

> **certbot не нужен** — SSL делаем через `openssl` или `acme.sh` (см. раздел 8).

### 1.2 Пользователь Linux `lotgo`

> Это **не** пользователь PostgreSQL. Нужен отдельно.

```bash
sudo adduser --disabled-password lotgo
sudo mkdir -p /var/www/lotgo
sudo chown lotgo:lotgo /var/www/lotgo
```

### 1.3 Node.js 22 + pnpm

```bash
curl -fsSL https://deb.nodesource.com/setup_22.x | sudo -E bash -
sudo apt install -y nodejs
sudo npm install -g pnpm
node -v   # v22.x
pnpm -v
```

### 1.4 PostgreSQL

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

---

## Часть 2. Код проекта

```bash
sudo -u lotgo git clone https://github.com/uwukillerik/lotandgo.git /var/www/lotgo
cd /var/www/lotgo
sudo -u lotgo pnpm install
```

---

## Часть 3. Файл `.env`

```bash
sudo -u lotgo cp .env.example .env
sudo -u lotgo nano .env
```

```env
NODE_ENV=production
PORT=8081
HOST=127.0.0.1

DATABASE_URL=postgresql://lotgo:надёжный_пароль@localhost:5432/lotgo
JWT_SECRET=сгенерируйте_openssl_rand
JWT_REFRESH_SECRET=другая_строка_openssl_rand

CORS_ORIGIN=http://lotgo.ru:7080,https://lotgo.ru:3454,http://www.lotgo.ru:7080,https://www.lotgo.ru:3454,http://77.50.193.34:7080,https://77.50.193.34:3454

UPLOAD_DIR=uploads
PAYMENT_PROVIDER=local
```

Секреты:

```bash
openssl rand -base64 48
```

Права:

```bash
sudo chown lotgo:lotgo /var/www/lotgo/.env
sudo chmod 600 /var/www/lotgo/.env
```

---

## Часть 4. База данных и сборка

```bash
cd /var/www/lotgo
sudo -u lotgo pnpm db:migrate
sudo -u lotgo pnpm db:seed
sudo -u lotgo mkdir -p uploads public/downloads
sudo -u lotgo pnpm build
```

Проверка вручную (дождитесь строки `Lot&Go → http://localhost:8081`):

```bash
sudo systemctl stop lotgo 2>/dev/null || true
sudo -u lotgo NODE_ENV=production pnpm start
# в другом терминале:
curl -I http://127.0.0.1:8081
# Ctrl+C
```

---

## Часть 5. systemd (автозапуск)

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
EnvironmentFile=/var/www/lotgo/.env
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
sleep 6
sudo systemctl status lotgo
curl -I http://127.0.0.1:8081
```

Логи: `sudo journalctl -u lotgo -n 50 --no-pager`

---

## Часть 6. nginx

На VM nginx слушает **80 и 443** (не 7080/3454 — это порты роутера).

```bash
sudo cp /var/www/lotgo/deploy/nginx/lotgo.conf /etc/nginx/sites-available/lotgo
sudo ln -sf /etc/nginx/sites-available/lotgo /etc/nginx/sites-enabled/
sudo rm -f /etc/nginx/sites-enabled/default
sudo nginx -t
sudo systemctl reload nginx
curl -I http://127.0.0.1
```

---

## Часть 7. Keenetic (проброс портов)

**Интернет → Доступ из интернета → Переадресация портов**

| Протокол | Снаружи | Внутри IP | Внутри порт |
|----------|---------|-----------|-------------|
| TCP | 7080 | 192.168.1.56 | 80 |
| TCP | 3454 | 192.168.1.56 | 443 |
| TCP | 9022 | 192.168.1.56 | 22 |

**Домашняя сеть** → зарезервировать IP VM: `192.168.1.56`.

Проверка с **телефона без Wi‑Fi**:

- `http://77.50.193.34:7080`

---

## Часть 8. SSL (без certbot)

### Вариант A — самоподписанный (5 минут)

```bash
cd /var/www/lotgo
chmod +x scripts/ssl-self-signed.sh
sudo ./scripts/ssl-self-signed.sh lotgo.ru
sudo nginx -t && sudo systemctl reload nginx
```

Сайт: `https://77.50.193.34:3454` (браузер предупредит — нормально для теста).

### Вариант B — Let's Encrypt через acme.sh + DNS Reg.ru

```bash
export REGRU_Username="логин_reg.ru"
export REGRU_Password="api_пароль"
chmod +x scripts/ssl-acme-dns.sh
./scripts/ssl-acme-dns.sh lotgo.ru
```

После SSL:

```bash
sudo systemctl restart lotgo
```

---

## Часть 9. DNS (Reg.ru)

В панели домена **только**:

| Тип | Имя | Значение |
|-----|-----|----------|
| A | `@` | `77.50.193.34` |
| A | `www` | `77.50.193.34` |

**Удалите:**

- записи с IP `37.140.192.68` (парковка Reg.ru)
- лишние AAAA (IPv6), если IPv6 не настраивали

Проверка на ПК:

```powershell
nslookup lotgo.ru
```

Должен быть `77.50.193.34`.

Сайт после DNS:

- `http://lotgo.ru:7080`
- `https://lotgo.ru:3454`

---

## Часть 10. APK (Android SDK, без Expo)

Нативный проект: **`android-app/`** (Kotlin + WebView + Gradle). Expo не используется.

### На Windows

1. [Android Studio](https://developer.android.com/studio)
2. PowerShell:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd C:\Users\DA\Desktop\auctions
pnpm build:apk
```

Скрипт сам:
- создаёт ключ подписи **Lot&Go** (`keystore/lotgo-release.jks`)
- собирает **подписанный** `app-release.apk`
- копирует в `public/downloads/lotgo.apk`

### Залить на сервер

```powershell
scp -P 9022 public/downloads/lotgo.apk lotgo@77.50.193.34:/var/www/lotgo/public/downloads/
```

На сервере:

```bash
cd /var/www/lotgo && sudo -u lotgo pnpm build && sudo systemctl restart lotgo
```

### Открыть в Android Studio

File → Open → `android-app` → Build → Build APK(s).

---

## Часть 11. PWA

Собирается автоматически при `pnpm build`. На главной — **«Установить приложение»** (Chrome/Edge на телефоне).

---

## Часть 12. Обновление версии

**Одна команда** (от `root` на сервере):

```bash
bash /var/www/lotgo/scripts/update-server.sh
```

Скрипт сам: подтянет недостающие ключи в `.env` из `deploy/env.production`, `git pull`, `pnpm install`, миграции, сборку и перезапуск. Ждёт до 25 секунд, пока поднимется `:8081`.

Вручную (если нужно):

```bash
cd /var/www/lotgo
bash scripts/sync-env.sh
sudo -u lotgo git pull origin main
sudo -u lotgo pnpm install
sudo -u lotgo pnpm db:migrate
sudo -u lotgo pnpm build
sudo systemctl restart lotgo
sleep 10
curl -I http://127.0.0.1:8081
```

---

## Чеклист

- [ ] `curl -I http://127.0.0.1:8081` → 200
- [ ] `curl -I http://127.0.0.1` → 200
- [ ] `http://77.50.193.34:7080` открывается с телефона (без Wi‑Fi)
- [ ] `nslookup lotgo.ru` → `77.50.193.34`
- [ ] Регистрация и вход работают
- [ ] WebSocket (ставки) без ошибок в DevTools
- [ ] `/downloads/lotgo.apk` скачивается

---

## Частые проблемы

| Симптом | Решение |
|---------|---------|
| **502 Bad Gateway** | `systemctl status lotgo`, `journalctl -u lotgo -n 30` |
| **Could not connect 8081** | Подождите 5–6 сек после старта; проверьте `.env` |
| **Missing parameter name** | В `server.ts` должно быть `app.use`, не `app.get("*")` |
| **Домен не открывается, IP открывается** | DNS указывает не на `77.50.193.34` |
| **Дома не открывается, с мобильного ок** | Нет hairpin NAT на Keenetic — проверяйте с мобильного интернета |
| **CORS** | Проверьте `CORS_ORIGIN` — URL с портами `:7080` / `:3454` |

## Демо-аккаунты (`db:seed:demo`)

Пароль: `Demo123456` — `admin@lotgo.ru`, `seller@lotgo.ru`, `bidder1@lotgo.ru`
