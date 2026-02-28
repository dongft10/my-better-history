@echo off
chcp 65001 >nul

echo ========================================
echo   Chrome Extension Packaging Tool
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "DIST_DIR=%PROJECT_DIR%dist"
set "OUTPUT_DIR=%PROJECT_DIR%output"
set "PEM_FILE=F:\dft\workspace\better-history\my-better-history.pem"

if not exist "%DIST_DIR%" (
    echo [ERROR] dist folder not found. Please run build first.
    pause
    exit /b 1
)

if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

set VERSION=1.0.0

echo Version: %VERSION%
echo.

echo [1/2] Cleaning old packages...
del /q "%OUTPUT_DIR%\*.zip" 2>nul
del /q "%OUTPUT_DIR%\*.crx" 2>nul

echo [2/2] Creating ZIP package...
set "ZIP_NAME=my-better-history_v%VERSION%.zip"
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%OUTPUT_DIR%\%ZIP_NAME%' -Force"

if exist "%PEM_FILE%" (
    echo.
    echo [Bonus] PEM file found: %PEM_FILE%
    set "CRX_NAME=my-better-history_v%VERSION%.crx"
    echo CRX: %CRX_NAME%
    echo NOTE: CRX signing requires Chrome SDK tools.
    echo       Use Chrome Developer Dashboard for official signing.
)

echo.
echo ========================================
echo   Packaging Complete!
echo ========================================
echo.
echo Output: %OUTPUT_DIR%
echo.
dir /b "%OUTPUT_DIR%"
echo.
pause
