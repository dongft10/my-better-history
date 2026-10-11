@echo off
chcp 65001 >nul

echo ========================================
echo   Edge Extension Packaging Tool
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "DIST_DIR=%PROJECT_DIR%output\dist"
set "OUTPUT_DIR=%PROJECT_DIR%output\release"

if not exist "%DIST_DIR%" (
    echo [ERROR] output\dist folder not found. Please run build-edge first.
    pause
    exit /b 1
)

echo.
echo [2/3] Reading version from manifest.json...
for /f "tokens=2 delims=:," %%a in ('findstr /c:"version" "%DIST_DIR%\manifest.json"') do (
    set "VERSION=%%a"
)
set "VERSION=%VERSION:"=%"
set "VERSION=%VERSION: =%"
echo Version: %VERSION%

echo.
echo [3/3] Creating ZIP package...
if not exist "%OUTPUT_DIR%" (
    mkdir "%OUTPUT_DIR%"
)

:: 仅清理旧的 Edge 包，避免误删 Chrome 包
del /q "%OUTPUT_DIR%\my-better-history-edge-*.zip" 2>nul

set "ZIP_NAME=my-better-history-edge-v%VERSION%.zip"
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%OUTPUT_DIR%\%ZIP_NAME%' -Force"

echo.
echo ========================================
echo   Edge Packaging Complete!
echo ========================================
echo.
echo Output: %OUTPUT_DIR%\%ZIP_NAME%
echo.
dir /b "%OUTPUT_DIR%\my-better-history-edge-*.zip"
echo.
pause
