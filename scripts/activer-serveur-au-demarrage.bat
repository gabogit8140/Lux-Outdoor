@echo off
chcp 65001 >nul
title Activer Lux Outdoor au demarrage de Windows

echo ================================================================
echo    LANCEMENT AUTOMATIQUE DE LUX OUTDOOR AU DEMARRAGE DU PC
echo ================================================================
echo.
echo Ce script configure le serveur local pour qu'il demarre silencieusement
echo en arriere-plan des l'ouverture de votre session Windows.
echo.
echo Ainsi, l'application PWA installee dans Edge fonctionnera a tout
echo instant sans avoir besoin d'ouvrir de terminal !
echo ----------------------------------------------------------------

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
set PROJECT_DIR=c:\Users\Francois.Gaborel\Downloads\Trace Outdoor

powershell -NoProfile -Command "$wsh = New-Object -ComObject WScript.Shell; $sc = $wsh.CreateShortcut('%STARTUP_DIR%\Lux-Outdoor-Server.lnk'); $sc.TargetPath = 'wscript.exe'; $sc.Arguments = '\"%PROJECT_DIR%\scripts\demarrer-serveur-silencieux.vbs\"'; $sc.WorkingDirectory = '%PROJECT_DIR%'; $sc.Save()"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] Le serveur local est desormais active au demarrage de Windows !
    echo Emplacement : %STARTUP_DIR%\Lux-Outdoor-Server.lnk
) else (
    echo [ERREUR] Impossible de creer le raccourci dans le dossier de demarrage.
)

echo.
pause
