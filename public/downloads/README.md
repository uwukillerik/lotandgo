# APK в репозитории: public/downloads/lotgo.apk
# Пересборка (Windows + Android Studio):

```powershell
$env:ANDROID_HOME = "$env:LOCALAPPDATA\Android\Sdk"
pnpm build:apk
git add public/downloads/lotgo.apk
git commit -m "Update Android APK."
git push
```

Скачивание: `/downloads/lotgo.apk` · проект: `android-app/`
