@echo off
setlocal

echo Packing My Better History extension for Edge Add-ons...

:: Remove edge output directory
if exist "edge" (
    echo Removing edge directory...
    rmdir /s /q "edge"
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

:: Run the Edge build process
echo Building the extension for Edge...
npm run build-extension -- --edge

if %errorlevel% equ 0 (
    echo.
    echo Packing completed successfully!
    echo The extension is ready in the 'edge/dist' folder.
    echo ZIP: edge\release\my-better-history-edge-vX.Y.Z.zip
    echo You can load it in Edge by going to edge://extensions and selecting the 'edge/dist' folder.
    echo Then upload the ZIP to the Edge Add-ons store.
) else (
    echo.
    echo Error: Build failed.
)

echo.
pause
