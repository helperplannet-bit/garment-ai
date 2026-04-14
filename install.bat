@echo off
title GAFS v1 - Installer
echo ============================================================
echo   GARMENT AI FACTORY SYSTEM - PRODUCTION INSTALLER
echo ============================================================
echo.

echo [1/6] Checking System Requirements...

:: Check Python
python --version 2>nul | findstr /R "3.1[0-9]" >nul
if errorlevel 1 (
    echo [ERROR] Python 3.10+ not found.
    pause
    exit /b 1
)
echo [OK] Python 3.10+ detected.

:: Check Node.js
node --version 2>nul | findstr /R "v1[8-9] v2[0-9]" >nul
if errorlevel 1 (
    echo [ERROR] Node.js 18+ not found.
    pause
    exit /b 1
)
echo [OK] Node.js detected.

:: Check Git
git --version >nul 2>&1
if errorlevel 1 (
    echo [ERROR] Git not found.
    pause
    exit /b 1
)
echo [OK] Git detected.

echo [2/6] Setup Folders...
if not exist "assets" mkdir "assets"
if not exist "outputs" mkdir "outputs"
if not exist "mockups" mkdir "mockups"
if not exist "projects" mkdir "projects"
if not exist "backend\assets\blobs" mkdir "backend\assets\blobs"
echo [OK] Folders ready.

echo [3/6] Backend Setup...
cd /d "%~dp0backend"
if not exist ".venv" python -m venv .venv
call .venv\Scripts\activate.bat
python -m pip install --upgrade pip
pip install -r requirements.txt
echo [OK] Backend ready.

echo [4/6] Frontend Setup...
cd /d "%~dp0frontend"
call npm install
echo [OK] Frontend ready.

echo [5/6] AI Engine Setup...
cd /d "%~dp0"
if not exist "stable-diffusion-webui" (
    git clone https://github.com/AUTOMATIC1111/stable-diffusion-webui.git
)
echo [OK] AI Engine ready.

echo.
echo ============================================================
echo   GAFS v1 SETUP COMPLETE!
echo ============================================================
pause
