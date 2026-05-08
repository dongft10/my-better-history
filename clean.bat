@echo off
setlocal

echo Cleaning My Better History build artifacts...

:: Remove output directory
if exist "output" (
    echo Removing output directory...
    rmdir /s /q "output"
)

:: Remove node_modules directory (optional, for complete cleanup)
:: Uncomment the following lines if you want to also remove node_modules
:: if exist "node_modules" (
::     echo Removing node_modules directory...
::     rmdir /s /q "node_modules"
:: )

echo.
echo Cleanup completed!
echo.