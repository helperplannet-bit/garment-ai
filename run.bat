@echo off
color 0B
echo =====================================
echo   GAFS FAST AUTO PUSH
echo =====================================

cd /d "D:\t shrts\garment-ai"

git add .

git commit -m "Auto update %date% %time%"

git push

echo.
echo DONE ✅
pause