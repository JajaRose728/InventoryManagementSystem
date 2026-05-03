@echo off
echo Setting Firebase project...
firebase use inventorymanagement-8be56

echo Building Angular app for production...
ng build

echo Deploying to Firebase Hosting...
firebase deploy --only hosting

echo.
echo Deployment complete! Visit: https://inventorymanagement-8be56.web.app
pause

