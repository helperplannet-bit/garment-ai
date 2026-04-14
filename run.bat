@echo off
color 0A
cd /d "D:\t shrts\garment-ai"

echo Adding changes...
git add .

git commit -m "Auto update %date% %time%"

echo Pushing...
git push

if errorlevel 1 (
    echo First time setup detected...
    git push --set-upstream origin main
)

echo DONE ✅
pause