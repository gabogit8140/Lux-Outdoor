@echo off
chcp 65001 >nul
title Lux Outdoor Launcher

cd /d "c:\Users\Francois.Gaborel\Downloads\Trace Outdoor"

echo [Lux Outdoor] Verification de l'etat du serveur local (port 3000)...
netstat -ano | findstr LISTENING | findstr :3000 >nul
if %errorlevel% equ 0 (
    echo [Lux Outdoor] Le serveur local tourne deja sur le port 3000.
) else (
    echo [Lux Outdoor] Demarrage du serveur local Vite en arriere-plan...
    start "Lux Outdoor Server (Port 3000)" /min cmd /c "npm run dev"
    timeout /t 2 /nobreak >nul
)

echo [Lux Outdoor] Ouverture dans Microsoft Edge...
start msedge "http://localhost:3000/"
exit
