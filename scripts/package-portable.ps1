$ErrorActionPreference = "Stop"

$Root = Resolve-Path (Join-Path $PSScriptRoot "..")
$ReleaseDir = Join-Path $Root "release"
$Target = Join-Path $ReleaseDir "comfyui-monitor-portable"
$ZipPath = Join-Path $ReleaseDir "comfyui-monitor-portable.zip"
$DistDir = Join-Path $Root "dist"

if (!(Test-Path (Join-Path $DistDir "renderer\index.html"))) {
  throw "Missing renderer build. Run npm run build:web first."
}

if (!(Test-Path (Join-Path $DistDir "server\server\server.js"))) {
  throw "Missing server build. Run npm run build:web first."
}

if (Test-Path $Target) {
  Remove-Item -LiteralPath $Target -Recurse -Force
}

New-Item -ItemType Directory -Force -Path $Target | Out-Null
New-Item -ItemType Directory -Force -Path $ReleaseDir | Out-Null

Copy-Item -LiteralPath $DistDir -Destination (Join-Path $Target "dist") -Recurse -Force
Copy-Item -LiteralPath (Join-Path $Root "package.json") -Destination (Join-Path $Target "package.json") -Force
Copy-Item -LiteralPath (Join-Path $Root "package-lock.json") -Destination (Join-Path $Target "package-lock.json") -Force

Push-Location $Target
try {
  npm ci --omit=dev --ignore-scripts
}
finally {
  Pop-Location
}

$NodeVersion = node -p "process.versions.node"
$NodeZipName = "node-v$NodeVersion-win-x64.zip"
$NodeUrl = "https://nodejs.org/dist/v$NodeVersion/$NodeZipName"
$CacheDir = Join-Path $Root ".cache\node"
$ZipDownload = Join-Path $CacheDir $NodeZipName
$ExtractDir = Join-Path $CacheDir "node-v$NodeVersion-win-x64"

New-Item -ItemType Directory -Force -Path $CacheDir | Out-Null

if (!(Test-Path $ZipDownload)) {
  Invoke-WebRequest -Uri $NodeUrl -OutFile $ZipDownload
}

if (Test-Path $ExtractDir) {
  Remove-Item -LiteralPath $ExtractDir -Recurse -Force
}

Expand-Archive -LiteralPath $ZipDownload -DestinationPath $CacheDir -Force
Copy-Item -LiteralPath (Join-Path $ExtractDir "node.exe") -Destination (Join-Path $Target "node.exe") -Force

$RunBat = @"
@echo off
chcp 65001 >nul
cd /d "%~dp0"
set "PORT=7890"
echo Starting ComfyUI Monitor portable server...
echo Local URL: http://127.0.0.1:%PORT%/
if not "%COMFYUI_MONITOR_NO_BROWSER%"=="1" (
  start "" "http://127.0.0.1:%PORT%/"
)
".\node.exe" ".\dist\server\server\server.js"
if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
"@

Set-Content -LiteralPath (Join-Path $Target "run.bat") -Value $RunBat -Encoding UTF8

if (Test-Path $ZipPath) {
  Remove-Item -LiteralPath $ZipPath -Force
}

Compress-Archive -Path (Join-Path $Target "*") -DestinationPath $ZipPath -Force
Write-Host "Portable package created: $ZipPath"
