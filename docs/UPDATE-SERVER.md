# Обновление Lot&Go на сервере

Краткая шпаргалка для VM **Debian** (`/var/www/lotgo`, сервис `lotgo`, порт `8081`).

Полная первичная установка — в [DEPLOY.md](./DEPLOY.md).

---

## Быстрое обновление (рекомендуется)

Подключение снаружи:

```bash
ssh -p 9022 root@77.50.193.34
```

Одна команда — pull, env, зависимости, миграции, сборка, перезапуск:

```bash
bash /var/www/lotgo/scripts/update-server.sh
```

Скрипт сам:
1. Синхронизирует `.env` (новые ключи + SMTP из `deploy/env.production`)
2. `git pull origin main`
3. `pnpm install`
4. `pnpm db:migrate`
5. `pnpm build`
6. `systemctl restart lotgo`
7. Проверяет `http://127.0.0.1:8081`

---

## Пошагово (вручную)

```bash
cd /var/www/lotgo

# 1. Синхронизация .env (не затирает существующие значения, кроме SMTP)
bash scripts/sync-env.sh

# 2. Код
sudo -u lotgo git pull origin main

# 3. Зависимости
sudo -u lotgo pnpm install

# 4. Миграции БД
sudo -u lotgo pnpm db:migrate

# 5. Сборка фронта + SPA
sudo -u lotgo pnpm build

# 6. Перезапуск
systemctl restart lotgo

# 7. Проверка
sleep 6
systemctl status lotgo --no-pager
curl -I http://127.0.0.1:8081
curl -I https://lotgo.ru:3454
```

---

## Если меняли только `.env`

```bash
nano /var/www/lotgo/.env
chown lotgo:lotgo /var/www/lotgo/.env
chmod 600 /var/www/lotgo/.env
systemctl restart lotgo
journalctl -u lotgo -n 30 --no-pager
```

---

## Если меняли nginx

```bash
sudo cp /var/www/lotgo/deploy/nginx/lotgo.conf /etc/nginx/sites-available/lotgo
sudo nginx -t
sudo systemctl reload nginx
```

---

## Демо-данные (по желанию, не на проде с живыми пользователями)

```bash
cd /var/www/lotgo
sudo -u lotgo pnpm db:seed:demo
```

---

## Логи и диагностика

```bash
# Последние логи приложения
journalctl -u lotgo -f

# Последние 80 строк
journalctl -u lotgo -n 80 --no-pager

# Проверка API
curl -s http://127.0.0.1:8081/api/health
curl -s http://127.0.0.1:8081/api/ping

# PostgreSQL
sudo -u postgres psql -d lotgo -c '\dt'

# Кто слушает 8081
ss -tlnp | grep 8081
```

---

## Откат на предыдущий коммит

```bash
cd /var/www/lotgo
sudo -u lotgo git log --oneline -5
sudo -u lotgo git checkout <хеш-коммита>
sudo -u lotgo pnpm install
sudo -u lotgo pnpm db:migrate
sudo -u lotgo pnpm build
systemctl restart lotgo
```

> Миграции БД откатываются вручную только если вы знаете, что делаете. Проще откатить код и не трогать уже применённые миграции.

---

## Чеклист после деплоя

- [ ] `systemctl status lotgo` — `active (running)`
- [ ] Сайт открывается: https://lotgo.ru:3454
- [ ] Вход / регистрация работают
- [ ] Live-ставки на аукционе обновляются
- [ ] Админка → тест SMTP (если настроен)
- [ ] PWA / APK скачивается с `/downloads/`

---

## Полезные пути

| Что | Где |
|-----|-----|
| Код | `/var/www/lotgo` |
| `.env` | `/var/www/lotgo/.env` |
| Загрузки | `/var/www/lotgo/uploads` |
| systemd | `/etc/systemd/system/lotgo.service` |
| nginx | `/etc/nginx/sites-available/lotgo` |

---

## Резервное копирование БД

```bash
bash /var/www/lotgo/scripts/backup-db.sh
```

Cron (ежедневно в 03:00):

```bash
0 3 * * * bash /var/www/lotgo/scripts/backup-db.sh >> /var/log/lotgo-backup.log 2>&1
```

Бэкапы: `/var/backups/lotgo/`, хранение 14 дней.
