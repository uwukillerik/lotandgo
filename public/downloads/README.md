# APK — Android SDK (без Expo)

**APK не в git** (файл ~5 МБ). После сборки загрузите на сервер отдельно.

## 1. Сборка (Windows, нужен Android Studio)

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
pnpm build:apk
```

Результат: `public/downloads/lotgo.apk`

## 2. Загрузка на сервер

```powershell
pnpm upload:apk
```

Или вручную:

```bash
scp -P 9022 public/downloads/lotgo.apk root@77.50.193.34:/var/www/lotgo/public/downloads/
```

Скачивание: https://lotgo.ru:3454/downloads/lotgo.apk

Проект Android: `android-app/`
