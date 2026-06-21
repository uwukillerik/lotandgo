# Текст для презентации Lot&Go

> Готовые блоки для слайдов дипломного проекта. Можно копировать в PowerPoint / Google Slides.

---

## Слайд 1 — Титул

**Lot&Go** — веб-платформа аукционов частной собственности в реальном времени

- Выпускная квалификационная работа
- Автор: [ФИО]
- Научный руководитель: [ФИО]
- 2026

---

## Слайд 2 — Проблема и цель

**Проблема:** частные продавцы и покупатели редких вещей (антиквариат, коллекции) не имеют удобной российской площадки с прозрачными live-торгами, мобильным доступом и безопасным обменом контактами.

**Цель:** разработать и внедрить production-ready платформу аукционов с веб-клиентом, PWA/APK и серверной частью на Node.js.

**Задачи:**
- каталог лотов и live-ставки через WebSocket;
- кошелёк, сделки, чат победитель–продавец;
- уведомления (in-app, email, Web Push);
- админ-панель и развёртывание на собственном сервере.

---

## Слайд 3 — Архитектура

```
[ Браузер / PWA / APK WebView ]
        ↓ HTTPS + WSS
[ nginx → Node.js (Express + Vite SPA) ]
        ↓              ↓
[ PostgreSQL ]   [ Socket.io — live-торги ]
```

- **Монорепозиторий:** фронтенд (React SPA) + API + shared-типы
- **Один процесс** в production: `server.ts` отдаёт API, WebSocket и статику
- **Маршруты API:** Next.js App Router handlers через Express-bridge (`lib/api-bridge.ts`)

---

## Слайд 4 — Технологический стек

| Слой | Технологии |
|------|------------|
| **Frontend** | React 18, TypeScript, Vite 6, React Router 6, Tailwind CSS 3 |
| **State / data** | TanStack Query, React Hook Form, Zod |
| **UI** | Radix UI, Lucide Icons, Sonner (toast) |
| **Backend** | Node.js 22, Express 5, TypeScript |
| **БД** | PostgreSQL 16, Drizzle ORM, миграции SQL |
| **Real-time** | Socket.io 4 (ставки, уведомления, anti-snipe) |
| **Auth** | JWT (access + refresh), bcrypt |
| **Email** | Nodemailer + SMTP (Reg.ru) |
| **Push** | Web Push API + VAPID (`web-push`) |
| **PWA** | vite-plugin-pwa, Workbox, Service Worker |
| **Платежи** | Локальный провайдер + Stripe (опционально) |
| **Тесты** | Vitest |
| **Деплой** | Debian, systemd, nginx, Keenetic port-forward |

---

## Слайд 5 — Ключевые библиотеки (подробнее)

**Клиент**
- `@tanstack/react-query` — кэш API, infinite scroll каталога
- `socket.io-client` — подписка на комнату аукциона
- `date-fns` — форматирование дат в истории ставок
- `zod` + `@hookform/resolvers` — валидация форм
- `vite-plugin-pwa` — manifest, offline, push SW

**Сервер**
- `drizzle-orm` + `pg` — типобезопасные запросы
- `jsonwebtoken` — авторизация
- `express-rate-limit` — защита от спама ставок
- `node-cron` + `auctionEngine` — жизненный цикл аукционов
- `nodemailer` — transactional email
- `web-push` — браузерные push-уведомления
- `multer` — загрузка фото лотов
- `helmet`, `cors` — базовая безопасность HTTP

---

## Слайд 6 — Функциональность (реализовано)

1. **Регистрация / вход** — согласие с офертой и политикой ПДн  
2. **Каталог** — фильтры, поиск с подсказками, пагинация  
3. **Live-аукцион** — ставки, история, anti-snipe, автоставка с лимитом  
4. **Избранное**, продвижение лотов (boost / featured / premium)  
5. **Кошелёк** — депозит, оплата победителем, выплата продавцу  
6. **Чат и статусы сделки** — awaiting_payment → completed  
7. **Уведомления** — in-app, email, Web Push  
8. **Подписки на категории** — новый лот в «Антиквариат» и т.д.  
9. **Отзывы о продавце** — после завершённой сделки  
10. **Админка** — пользователи, лоты, CSV-экспорт, тест SMTP  
11. **PWA + APK** — установка на телефон, deep links `/auction/:id`  
12. **SEO** — sitemap.xml, robots.txt, Open Graph на лотах  

---

## Слайд 7 — База данных

**Основные сущности:** users, lots, lot_images, auctions, bids, notifications, favorites, wallets, wallet_transactions, seller_reviews, category_subscriptions, push_subscriptions, auto_bids.

**Особенности:**
- enum-статусы аукциона и сделки;
- уникальность «один аукцион на лот»;
- миграции Drizzle (`drizzle/*.sql`);
- ежедневный `pg_dump` (`scripts/backup-db.sh`).

---

## Слайд 8 — Real-time и честные торги

- Клиент подключается к `ws://host/ws`, комната `auction:{id}`
- События: `bid:new`, `auction:ended`, `notification:new`
- **Anti-snipe:** продление `endsAt` при ставке в последние минуты
- **Автоставка:** пользователь задаёт max — движок перебивает до лимита
- Rate limit: не более 10 ставок в минуту на пользователя

---

## Слайд 9 — Безопасность

- Пароли: bcrypt (cost 12)
- JWT в `Authorization: Bearer` + httpOnly refresh cookie
- Контакты продавца — только победителю после торгов
- Роли: `user` / `admin`
- SMTP-пароль и секреты — только в `.env` на сервере
- nginx TLS, CORS whitelist для production-доменов

---

## Слайд 10 — Развёртывание

- **Сервер:** Debian VM за Keenetic, `lotgo.ru:3454` (HTTPS)
- **Путь:** `/var/www/lotgo`
- **Сервис:** `systemctl restart lotgo`
- **Обновление:** `bash scripts/update-server.sh`
- **Бэкап БД:** cron + `scripts/backup-db.sh`

---

## Слайд 11 — Демонстрация (сценарий)

1. Главная → live-блок аукционов  
2. Каталог → поиск «монета» → открыть лот  
3. Ставка + автоставка  
4. Победа → чат → смена статуса сделки → отзыв  
5. Настройки → push + подписка на категорию  
6. Админка → экспорт CSV, тест письма  

---

## Слайд 12 — Итоги

**Результат:** работающая платформа Lot&Go с веб-интерфейсом, PWA, API, БД и развёртыванием на реальном домене.

**Практическая значимость:** готовая основа для коммерческого запуска (осталось подключить ЮKassa и масштабировать инфраструктуру).

**Направления развития:** ЮKassa, модерация лотов, Redis для очередей, S3 для медиа.

---

## Краткое устное вступление (30 сек)

«Lot&Go — это платформа живых аукционов для частных продавцов. Я реализовал full-stack решение: React SPA с PWA, Node.js API, PostgreSQL и WebSocket для ставок в реальном времени. Пользователь может выставить лот, торговаться с автоставкой, получить push при перебитой ставке, оплатить через кошелёк и оставить отзыв продавцу. Система развёрнута на собственном сервере с nginx, systemd и автоматическим бэкапом базы.»
