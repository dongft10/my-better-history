@echo off
setlocal

echo Packing My Better History extension...

:: Remove output directory (build-extension.mjs 的实际输出目录)
if exist "output" (
    echo Removing output directory...
    rmdir /s /q "output"
)

:: Check if npm is available
where npm >nul 2>nul
if %errorlevel% neq 0 (
    echo Error: npm is not found. Please install Node.js and npm.
    pause
    exit /b 1
)

:: Install dependencies if node_modules doesn't exist
if not exist "node_modules" (
    echo Installing dependencies...
    npm install
    if %errorlevel% neq 0 (
        echo Error: Failed to install dependencies.
        pause
        exit /b 1
    )
)

:: Run the build process
echo Building the extension...
npm run build-extension

if %errorlevel% equ 0 (
    echo.
    echo Packing completed successfully!
    echo The extension is ready in the 'output/dist' folder.
    echo You can load it in Chrome by going to chrome://extensions and selecting the 'output/dist' folder.
) else (
    echo.
    echo Error: Build failed.
)

echo.
pause