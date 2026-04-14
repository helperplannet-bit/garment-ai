@echo off
title GAFS v1 — React Frontend
color 0E
echo.
echo ============================================================
echo   GAFS v1 — React Frontend    (http://localhost:3000)
echo ============================================================
echo.
echo   Make sure start-backend.bat is also running!
echo.
echo   Press Ctrl+C to stop.
echo.
cd /d "%~dp0frontend"
call npm start
pause
