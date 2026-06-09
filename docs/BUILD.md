# Сборка приложений Lot&Go (Web, APK, EXE)

Проект состоит из трёх частей:

| Часть | Папка | Результат |
|-------|-------|-----------|
| Веб + API | корень репозитория | сайт + сервер Node.js |
| Мобильное | `mobile/` | APK / AAB (Android), IPA (iOS) |
| Десктоп | — | отдельного EXE в репозитории нет (см. раздел 3) |

---

## 1. Веб-приложение (production)

На сервере или локально:

```bash
pnpm install
pnpm db:migrate
pnpm build      # Vite → dist/spa
pnpm start      # Express на PORT из .env (8081)
```

Артефакты:

- `dist/spa/` — статика SPA (HTML, JS, CSS)
- Сервер: `server.ts` (API, WebSocket, раздача SPA)

Подробный деплой на Debian: [DEPLOY.md](./DEPLOY.md).

---

## 2. APK / AAB (Android) — Expo

Мобильное приложение в папке `mobile/` (React Native + Expo 56).

### 2.1. Локальная разработка

```bash
# из корня репозитория
pnpm run dev:mobile

# или
cd mobile
npm install
npx expo start
```

Укажите URL API в конфиге мобильного приложения (должен указывать на ваш сервер, не `localhost`, на реальном устройстве).

### 2.2. Сборка APK через EAS (рекомендуется)

1. Установите EAS CLI:

```bash
npm install -g eas-cli
eas login
```

2. В `mobile/` инициализируйте проект (если ещё не сделано):

```bash
cd mobile
eas init
```

3. Создайте `eas.json`:

```json
{
  "cli": { "version": ">= 16.0.0" },
  "build": {
    "preview": {
      "android": { "buildType": "apk" }
    },
    "production": {
      "android": { "buildType": "app-bundle" }
    }
  }
}
```

4. Сборка APK:

```bash
cd mobile
eas build -p android --profile preview
```

После сборки EAS даст ссылку на скачивание `.apk`.

5. Для Google Play (AAB):

```bash
eas build -p android --profile production
```

### 2.3. Локальная сборка APK (без облака EAS)

Требуется Android Studio + JDK 17:

```bash
cd mobile
npx expo prebuild --platform android
cd android
./gradlew assembleRelease
```

APK: `mobile/android/app/build/outputs/apk/release/app-release.apk`

Подпись релиза — настройте keystore в `android/app/build.gradle` (стандартная документация Android).

### 2.4. iOS (IPA)

Только на macOS с Xcode:

```bash
cd mobile
eas build -p ios --profile production
```

---

## 3. EXE для Windows

**Готового Electron/Tauri-приложения в репозитории нет.** Варианты:

### Вариант A — PWA / «Установить сайт» (самый простой)

1. Разверните веб-версию на домене ([DEPLOY.md](./DEPLOY.md)).
2. В Chrome или Edge откройте `https://ваш-домен.ru`.
3. Меню → **«Установить приложение»** / **Install app**.

Получится ярлык на рабочем столе с отдельным окном — без отдельной сборки EXE.

### Вариант B — Ярлык на браузер

Создайте `.bat` или ярлык:

```bat
start msedge --app=https://lotgo.ru
```

### Вариант C — Electron-обёртка (для разработчиков)

Если нужен настоящий `.exe`, можно обернуть production URL:

```bash
mkdir lotgo-desktop && cd lotgo-desktop
npm init -y
npm install electron electron-builder --save-dev
```

`main.js`:

```js
const { app, BrowserWindow } = require("electron");
app.whenReady().then(() => {
  const win = new BrowserWindow({ width: 1280, height: 800 });
  win.loadURL("https://lotgo.ru"); // или http://localhost:8081 для dev
});
```

`package.json` → `"main": "main.js"`, скрипт `"dist": "electron-builder"`.

Это **не входит** в текущий репозиторий — только как опция при необходимости.

### Вариант D — EXE только сервера (не клиент)

В `package.json` есть заготовка `pkg` для упаковки Node-сервера. Это **серверная** утилита, не замена клиентского приложения:

```bash
pnpm build
npx pkg server.ts --targets node22-win-x64 --output lotgo-server.exe
```

Для полноценного десктоп-клиента используйте варианты A–C.

---

## 4. Переменные для мобильного клиента

На телефоне `localhost` недоступен. В коде `mobile/` задайте базовый URL API:

```
https://lotgo.ru/api
wss://lotgo.ru/ws
```

(точные пути зависят от конфигурации в `mobile/src` — проверьте файлы с `API_URL` / `SOCKET_URL`.)

После смены URL пересоберите APK.

---

## 5. Краткая шпаргалка

```bash
# Веб
pnpm build && pnpm start

# Android APK (облако)
cd mobile && eas build -p android --profile preview

# Демо-данные
pnpm db:seed:demo
```

Демо-логин: `admin@lotgo.ru` / `Demo123456`
