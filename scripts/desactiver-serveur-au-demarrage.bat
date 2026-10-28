@echo off
chcp 65001 >nul
title Desactiver Lux Outdoor au demarrage de Windows

set STARTUP_DIR=%APPDATA%\Microsoft\Windows\Start Menu\Programs\Startup
if exist "%STARTUP_DIR%\Lux-Outdoor-Server.lnk" (
    del "%STARTUP_DIR%\Lux-Outdoor-Server.lnk"
    echo [SUCCES] Le demarrage automatique a ete supprime.
) else (
    echo [INFO] Aucun raccourci automatique n'etait configure.
)
pause
