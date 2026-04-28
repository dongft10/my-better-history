@echo off
chcp 65001 >nul

echo ========================================
echo   Chrome Extension Packaging Tool
echo ========================================
echo.

set "PROJECT_DIR=%~dp0"
set "DIST_DIR=%PROJECT_DIR%out\dist"
set "OUTPUT_DIR=%PROJECT_DIR%out\release"

echo [1/3] Building extension...
call "%PROJECT_DIR%build.bat"
if %errorlevel% neq 0 (
    echo [ERROR] Build failed.
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

del /q "%OUTPUT_DIR%\*.zip" 2>nul

set "ZIP_NAME=my-better-history_v%VERSION%.zip"
powershell -Command "Compress-Archive -Path '%DIST_DIR%\*' -DestinationPath '%OUTPUT_DIR%\%ZIP_NAME%' -Force"

echo.
echo ========================================
echo   Packaging Complete!
echo ========================================
echo.
echo Output: %OUTPUT_DIR%
echo.
dir /b "%OUTPUT_DIR%\*.zip"
echo.
pause
