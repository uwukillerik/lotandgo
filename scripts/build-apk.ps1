# Сборка подписанного APK — чистый Android SDK, без Expo.
# Нужно: JDK 17+, Android SDK (Android Studio).

$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$AndroidApp = Join-Path $Root "android-app"
$Out = Join-Path $Root "public\downloads\lotgo.apk"
$KeystoreDir = Join-Path $AndroidApp "keystore"
$KeystoreFile = Join-Path $KeystoreDir "lotgo-release.jks"
$PropsFile = Join-Path $KeystoreDir "keystore.properties"

if (-not $env:ANDROID_HOME -and -not $env:ANDROID_SDK_ROOT) {
    $defaultSdk = Join-Path $env:LOCALAPPDATA "Android\Sdk"
    if (Test-Path $defaultSdk) { $env:ANDROID_HOME = $defaultSdk }
}
if (-not $env:ANDROID_HOME) {
    Write-Error "ANDROID_HOME not found. Install Android Studio."
}

# JDK (keytool + gradle)
if (-not $env:JAVA_HOME) {
    $jbr = "C:\Program Files\Android\Android Studio\jbr"
    if (Test-Path $jbr) { $env:JAVA_HOME = $jbr }
}
$keytool = if ($env:JAVA_HOME) { Join-Path $env:JAVA_HOME "bin\keytool.exe" } else { "keytool" }

# Keystore Lot&Go
if (-not (Test-Path $KeystoreFile)) {
    Write-Host "-> Создаём ключ подписи Lot&Go"
    New-Item -ItemType Directory -Force -Path $KeystoreDir | Out-Null
    $dname = "CN=Lot and Go, OU=Mobile, O=LotGo, L=Moscow, ST=Moscow, C=RU"
    & $keytool -genkeypair -v `
        -keystore $KeystoreFile `
        -storepass "LotGo2026!" `
        -alias lotgo `
        -keypass "LotGo2026!" `
        -keyalg RSA -keysize 2048 -validity 10000 `
        -dname $dname
}

if (-not (Test-Path $PropsFile)) {
    Copy-Item (Join-Path $KeystoreDir "keystore.properties.example") $PropsFile
}

Set-Location $AndroidApp

if (-not (Test-Path "gradlew.bat")) {
    Write-Host "-> Gradle Wrapper"
    if (Get-Command gradle -ErrorAction SilentlyContinue) {
        gradle wrapper --gradle-version 8.9
    } else {
        Write-Error "gradlew.bat нет. Откройте android-app в Android Studio один раз (Sync Project)."
    }
}

Write-Host "-> assembleRelease (подписанный APK)"
.\gradlew.bat assembleRelease --no-daemon

$apk = "app\build\outputs\apk\release\app-release.apk"
if (-not (Test-Path $apk)) {
    Write-Error "APK не собрался: $apk"
}

New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null
Copy-Item $apk $Out -Force
Write-Host ""
Write-Host "GOTOVO: $Out"
Write-Host "Podpis: com.lotgo.app"
