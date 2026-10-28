@echo off
chcp 65001 >nul
title Configuration du Raccourci Edge - Lux Outdoor

echo ================================================================
echo       INSTALLATEUR DU PROTOCOLE EDGE POUR LUX OUTDOOR
echo ================================================================
echo.
echo Enregistrement du protocole luxoutdoor:// dans votre session utilisateur...

set LAUNCHER_PATH=c:\Users\Francois.Gaborel\Downloads\Trace Outdoor\Lancer-Lux-Outdoor.bat

powershell -NoProfile -Command "New-Item -Path 'HKCU:\Software\Classes\luxoutdoor\shell\open\command' -Force | Out-Null; Set-ItemProperty -Path 'HKCU:\Software\Classes\luxoutdoor' -Name '(Default)' -Value 'URL:Lux Outdoor Protocol'; Set-ItemProperty -Path 'HKCU:\Software\Classes\luxoutdoor' -Name 'URL Protocol' -Value ''; Set-ItemProperty -Path 'HKCU:\Software\Classes\luxoutdoor\shell\open\command' -Name '(Default)' -Value '\"%LAUNCHER_PATH%\"'"

if %errorlevel% equ 0 (
    echo.
    echo [SUCCES] Le protocole luxoutdoor:// est maintenant configure !
    echo.
    echo INSTRUCTIONS POUR VOTRE BARRE DE FAVORIS EDGE :
    echo ------------------------------------------------------------
    echo 1. Ouvrez Microsoft Edge.
    echo 2. Clic droit sur la Barre de favoris ^> "Ajouter une page".
    echo 3. Nom : Lux Outdoor
    echo 4. URL : luxoutdoor://open
    echo 5. Cliquez sur Enregistrer.
    echo.
    echo Lors du premier clic sur ce favori, Edge affichera une confirmation :
    echo "Ouvrir Lux Outdoor ?" : cochez "Toujours autoriser" puis validez.
    echo Le serveur demarrera automatiquement et ouvrira l'application !
    echo ------------------------------------------------------------
) else (
    echo [ERREUR] Impossible d'enregistrer la cle dans le Registre.
)

echo.
pause
