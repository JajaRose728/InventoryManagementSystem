@echo off
REM 🚀 Inventory Management System - QUICK START for Windows

color 0B
cls

echo.
echo ╔════════════════════════════════════════════════════════════════╗
echo ║  Inventory Management System - Full Stack Startup             ║
echo ║  3 Terminals Required (Firebase, Backend, Frontend)           ║
echo ╚════════════════════════════════════════════════════════════════╝
echo.

echo ═══════════════════════════════════════════════════════════════════
echo TERMINAL 1️⃣: Firebase Emulator (START FIRST!)
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 1. Install Firebase CLI (one time only):
echo    npm install -g firebase-tools
echo.
echo 2. Login to Firebase:
echo    firebase login
echo.
echo 3. Start Emulator (run in project root):
echo    firebase emulators:start
echo.
echo    ✅ Firestore: http://localhost:8080
echo    ✅ Auth: http://localhost:9099
echo    ✅ Storage: http://localhost:9199
echo    ✅ Emulator UI: http://localhost:4000
echo.
echo ⏸️  Keep this terminal running while testing!
echo.

echo ═══════════════════════════════════════════════════════════════════
echo TERMINAL 2️⃣: Backend API Server
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 1. Navigate to server folder:
echo    cd server
echo.
echo 2. Copy environment file:
echo    copy .env.example .env
echo.
echo 3. Install dependencies:
echo    npm install
echo.
echo 4. Start development server:
echo    npm run dev
echo.
echo    ✅ API: http://localhost:3000
echo    ✅ Docs: http://localhost:3000/api-docs
echo.
echo ⏸️  Keep this terminal running while testing!
echo.

echo ═══════════════════════════════════════════════════════════════════
echo TERMINAL 3️⃣: Frontend Angular App
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 1. Go back to project root:
echo    cd ..
echo.
echo 2. Install dependencies:
echo    npm install
echo.
echo 3. Start Angular dev server:
echo    npm start
echo.
echo    ✅ Frontend: http://localhost:4200
echo    ✅ Login: admin@demo.com / admin123
echo.
echo ⏸️  Keep this terminal running while testing!
echo.

echo ═══════════════════════════════════════════════════════════════════
echo ✅ VERIFICATION CHECKS
echo ═══════════════════════════════════════════════════════════════════
echo.
echo 1. Emulator UI: http://localhost:4000
echo 2. API Health: http://localhost:3000/health
echo 3. Swagger Docs: http://localhost:3000/api-docs
echo 4. Frontend: http://localhost:4200/login
echo.

echo ═══════════════════════════════════════════════════════════════════
echo ✅ Ready! Follow the steps above. 🎉
echo ═══════════════════════════════════════════════════════════════════
echo.
pause
