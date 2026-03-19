@echo off
chcp 65001 >nul
title ComfyUI Monitor

REM 快速啟動 ComfyUI Monitor (假設已安裝依賴並編譯完成)
echo 啟動 ComfyUI Monitor...
npm run electron:dev
echo 應用已啟動！
exit
