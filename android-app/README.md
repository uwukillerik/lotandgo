# Lot&Go — нативное Android-приложение (WebView)

**Без Expo.** Чистый Android SDK + Gradle + Kotlin.

Открывает ваш сайт: `http://77.50.193.34:7080`

Пакет: `com.lotgo.app`

## Сборка APK (Windows)

1. [Android Studio](https://developer.android.com/studio) + SDK Platform 35
2. PowerShell:

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
cd C:\path\to\auctions
pnpm build:apk
```

Первый запуск создаст ключ подписи **Lot&Go** в `keystore/lotgo-release.jks`.

APK: `public/downloads/lotgo.apk` — подписанный release.

## Или из Android Studio

1. File → Open → папка `android-app`
2. Build → Generate Signed Bundle / APK → APK
3. Keystore уже в `keystore/` (после `pnpm build:apk` один раз)

## Сменить URL сервера

`android-app/app/build.gradle` → `buildConfigField "WEB_URL"`.

## Пароль keystore (по умолчанию)

См. `keystore/keystore.properties.example` — смените после первой сборки.
