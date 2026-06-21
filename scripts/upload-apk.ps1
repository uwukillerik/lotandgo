# Загрузить APK на сервер после локальной сборки.
$ErrorActionPreference = "Stop"
$Root = Split-Path -Parent $PSScriptRoot
$Apk = Join-Path $Root "public\downloads\lotgo.apk"
$Host_ = if ($env:DEPLOY_HOST) { $env:DEPLOY_HOST } else { "77.50.193.34" }
$Port = if ($env:DEPLOY_SSH_PORT) { $env:DEPLOY_SSH_PORT } else { "9022" }
$User = if ($env:DEPLOY_USER) { $env:DEPLOY_USER } else { "root" }
$Remote = "/var/www/lotgo/public/downloads/lotgo.apk"

if (-not (Test-Path $Apk)) {
    Write-Error "APK не найден: $Apk`nСначала: pnpm build:apk"
}

Write-Host "-> Upload $Apk"
scp -P $Port $Apk "${User}@${Host_}:${Remote}"
ssh -p $Port "${User}@${Host_}" "chown lotgo:lotgo $Remote && ls -lh $Remote"
Write-Host "OK: https://lotgo.ru:3454/downloads/lotgo.apk"
