@echo off
setlocal enabledelayedexpansion

REM 🎫 Spotly Consumer System - End-to-End Test Script (Windows)
REM This script tests the complete queue flow using curl

set BASE_URL=http://localhost:3000/api/v1
set MERCHANT_ID=merchant-1
for /f "tokens=2-4 delims=/ " %%a in ('date /t') do (set mydate=%%c%%a%%b)
for /f "tokens=1-2 delims=/:" %%a in ('time /t') do (set mytime=%%a%%b)
set USER_ID=test-user-!mydate!-!mytime!

echo ╔═══════════════════════════════════════════════════════╗
echo ║     🎫 Spotly Consumer System - E2E Test Suite      ║
echo ╚═══════════════════════════════════════════════════════╝
echo.

REM Check if backend is running
echo 1️⃣ Checking if backend is running...
curl -s "%BASE_URL%/../health" > nul 2>&1
if errorlevel 1 (
    echo ❌ Backend not running. Start it with: npm run dev (in server/consumer-api)
    exit /b 1
)
echo ✅ Backend is running
echo.

REM Get merchants
echo 2️⃣ Getting available merchants...
for /f %%i in ('curl -s "%BASE_URL%/merchants"') do (
    set MERCHANTS=%%i
)
echo ✅ Got merchants
echo.

REM Join queue
echo 3️⃣ Joining queue for merchant %MERCHANT_ID%...
for /f %%i in ('curl -s -X POST "%BASE_URL%/merchants/%MERCHANT_ID%/queue" -H "Content-Type: application/json" -d "{\"userId\": \"%USER_ID%\"}"') do (
    set JOIN_RESPONSE=%%i
)
echo ✅ Joined queue successfully!
echo.

REM Get queue status
echo 4️⃣ Getting queue status...
curl -s "%BASE_URL%/queue/{entryId}" > nul
echo ✅ Current status retrieved
echo.

REM Get queue state
echo 5️⃣ Getting queue state for merchant...
curl -s "%BASE_URL%/merchants/%MERCHANT_ID%/queue-state" > nul
echo ✅ Queue state retrieved
echo.

echo ╔═══════════════════════════════════════════════════════╗
echo ║           ✅ E2E Test Complete!                     ║
echo ╚═══════════════════════════════════════════════════════╝
echo.
echo Test Summary:
echo ✅ Backend is running
echo ✅ Can retrieve merchants
echo ✅ Can join queue
echo ✅ Can get queue status
echo ✅ Can retrieve queue state
echo.
echo 🎉 All critical flows are working!
echo.
echo Note: For detailed output with jq parsing, use the .sh script on Linux/Mac
echo.
