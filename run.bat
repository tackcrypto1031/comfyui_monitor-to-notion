@echo off
chcp 65001 >nul
title ComfyUI Monitor
cd /d "%~dp0"

echo Root run.bat delegates to start.bat for dependency checks, build, and launch.
echo Portable package run.bat is the no-Node.js launcher.
echo.
call "%~dp0start.bat"
