@echo off
setlocal

echo Cleaning My Better History build artifacts...

:: Remove out directory
if exist "out" (
    echo Removing out directory...
    rmdir /s /q "out"
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