@echo off
chcp 65001 >nul
title ComfyUI Monitor
cd /d "%~dp0"

echo ========================================
echo   ComfyUI Monitor - Web Launcher
echo ========================================
echo.

set "PORT=7890"

node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] Node.js was not found. Install Node.js 20.x first.
    echo To run without Node.js installed, build the portable package first.
    if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
    exit /b 1
)

call npm --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [ERROR] npm was not found. Check that Node.js is installed correctly.
    if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
    exit /b 1
)

echo [OK] Node.js and npm detected.
echo.

if not exist "node_modules" (
    echo [INFO] node_modules not found. Installing dependencies...
    call npm ci
    if %errorlevel% neq 0 (
        echo [ERROR] Dependency install failed.
        if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
        exit /b 1
    )
    echo [OK] Dependencies installed.
    echo.
)

echo [INFO] Building web app...
call npm run build:web
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
    if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
    exit /b 1
)

echo.
echo [START] Starting ComfyUI Monitor Web Server...
echo Local URL: http://127.0.0.1:%PORT%/
echo Enable listen mode in the UI to show LAN share URLs.
echo.

if not "%COMFYUI_MONITOR_NO_BROWSER%"=="1" (
    start "" "http://127.0.0.1:%PORT%/"
)
call npm run start:web

if not "%COMFYUI_MONITOR_NO_PAUSE%"=="1" pause
