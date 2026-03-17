@echo off
chcp 65001 >nul
title ComfyUI Monitor

echo ========================================
echo   ComfyUI Monitor - 快速啟動
echo ========================================
echo.

REM 檢查 Node.js 是否安裝
node --version >nul 2>&1
if %errorlevel% neq 0 (
    echo [錯誤] 未檢測到 Node.js，請先安裝 Node.js 20.x
    echo 下載連結：https://nodejs.org/
    pause
    exit /b 1
)

echo [✓] Node.js 已安裝
echo.

REM 檢查依賴是否已安裝
if not exist "node_modules" (
    echo [提示] 首次啟動，正在安裝依賴...
    call npm install
    if %errorlevel% neq 0 (
        echo [錯誤] 依賴安裝失敗
        pause
        exit /b 1
    )
    echo [✓] 依賴安裝完成
    echo.
)

REM 檢查是否需要編譯
if not exist "dist" (
    echo [提示] 正在編譯專案...
    call npm run build
    if %errorlevel% neq 0 (
        echo [錯誤] 編譯失敗
        pause
        exit /b 1
    )
    echo [✓] 編譯完成
    echo.
)

echo [啟動] 正在啟動 ComfyUI Monitor...
echo.
echo 提示：
echo - 按 Ctrl+C 可停止應用
echo - 應用將在背景運行
echo.

REM 啟動應用
start "" npm run electron:dev

echo [✓] 應用已啟動
echo.
echo 視窗應該已經開啟，如果沒有看到請檢查工作列
echo.
pause
