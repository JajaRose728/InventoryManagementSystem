@echo off
REM Deploy Inventory Management System to Firebase
REM Run this script from your project root

echo ========================================
echo Firebase Deployment Script
echo ========================================
echo.

REM Check if firebase is installed
where firebase >nul 2>&1
if %ERRORLEVEL% NEQ 0 (
    echo Firebase CLI not found. Installing...
    npm install -g firebase-tools
)

echo.
echo Step 1: Building Angular app...
call npm run build

echo.
echo Step 2: Deploying to Firebase...
call firebase deploy

echo.
echo ========================================
echo Deployment Complete!
echo ========================================
echo.
echo Your app should be live at:
echo https://inventorymanagement-8be56.web.app
echo.
pause