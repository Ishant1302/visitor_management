@echo off
setlocal
title Smart University Visitor Management System (SUVMS)

color 0A
cls
echo ===============================================================================
echo            SMART UNIVERSITY VISITOR MANAGEMENT SYSTEM (SUVMS)
echo ===============================================================================
echo.

:: 1. Detect suvms directory
set "APP_DIR="
if exist "%~dp0suvms\package.json"    set "APP_DIR=%~dp0suvms"
if exist "%~dp0..\suvms\package.json" set "APP_DIR=%~dp0..\suvms"
if exist "%~dp0package.json"          set "APP_DIR=%~dp0"

if "%APP_DIR%"=="" (
    color 0C
    echo [ERROR] Could not locate the 'suvms' project folder!
    echo Please make sure this file is inside the project directory.
    echo.
    pause
    exit /b 1
)

:: 2. Check Node.js
where node >nul 2>&1
if %ERRORLEVEL% neq 0 (
    color 0C
    echo [ERROR] Node.js is not found on your system!
    echo Please install Node.js from https://nodejs.org and try again.
    echo.
    pause
    exit /b 1
)

echo  [+] Project Directory : %APP_DIR%
echo  [+] Website Link      : http://localhost:5173
echo  [+] Backend API       : http://localhost:3001/api
echo.
echo ===============================================================================
echo   Starting Backend & Frontend servers...
echo   Your web browser will open http://localhost:5173 automatically!
echo.
echo   [!] KEEP THIS WINDOW OPEN while using the website.
echo   [!] To stop the website, close this window or press Ctrl + C.
echo ===============================================================================
echo.

:: Open default browser directly to the web portal
start http://localhost:5173

:: Switch directory and run dev servers
cd /d "%APP_DIR%"
call npm.cmd run dev

if %ERRORLEVEL% neq 0 (
    echo.
    echo [INFO] Servers have stopped.
    pause
)
