# Lot&Go

Платформа аукционов частной собственности: **Next.js 15 + PostgreSQL + Socket.io + Expo mobile**.

## Стек

| Слой | Технологии |
|------|------------|
| Web + API | Next.js 15 (App Router), Node.js |
| БД | PostgreSQL (локально, без Docker) |
| Real-time | Socket.io (custom Node server) |
| Mobile | Expo / React Native |

## Быстрый старт

### 1. PostgreSQL (без Docker)

Установите PostgreSQL локально и создайте базу:

```sql
CREATE USER lotgo WITH PASSWORD 'lotgo';
CREATE DATABASE lotgo OWNER lotgo;
```

Или используйте облачный PostgreSQL (Neon, Supabase, Railway) — укажите URL в `.env`.

### 2. Переменные окружения

```bash
cp .env.example .env
```

### 3. Миграции и seed

```bash
npm run db:migrate
npm run db:seed
```

Demo-аккаунты (пароль `Demo123456`):
- `seller@lotgo.ru`
- `bidder1@lotgo.ru`
- `bidder2@lotgo.ru`

### 4. Запуск (один Node-процесс)

```bash
npm run dev
```

- Web + API: http://localhost:3000
- WebSocket: ws://localhost:3000/ws

### 5. Мобильное приложение

```bash
cd mobile
cp .env.example .env
# Android-эмулятор: EXPO_PUBLIC_API_URL=http://10.0.2.2:3000
npm start
```

## Production

```bash
npm run build
npm start
```

## Структура

```
app/             Next.js pages + API routes
lib/             DB, auth, services, WebSocket
mobile/          Expo React Native
shared/          Общие типы и Zod-схемы
drizzle/         SQL-миграции
server.ts        Custom Node server (Next + Socket.io)
public/          Статика, logo.png, uploads/
```

## API

Все эндпоинты на `/api/*` — см. предыдущую документацию. Mobile и web используют один и тот же API на порту 3000.
