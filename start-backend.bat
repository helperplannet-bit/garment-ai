@echo off
title GAFS v1 — Backend Server
color 0B
echo.
echo ============================================================
echo   GAFS v1 — FastAPI Backend   (http://localhost:8000)
echo ============================================================
echo.
echo   API Docs: http://localhost:8000/docs
echo   Health:   http://localhost:8000/health
echo.
echo   Press Ctrl+C to stop.
echo.
cd /d "%~dp0backend"
python -m uvicorn main:app --host 0.0.0.0 --port 8000 --reload
pause
