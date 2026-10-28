' Script de lancement silencieux et transparent pour Lux Outdoor
Set WshShell = CreateObject("WScript.Shell")

projectDir = "c:\Users\Francois.Gaborel\Downloads\Trace Outdoor"

' 1. Verification si le port 3000 est deja actif
Set oExec = WshShell.Exec("cmd.exe /c netstat -ano | findstr LISTENING | findstr :3000")
strOutput = ""
Do While Not oExec.StdOut.AtEndOfStream
    strOutput = strOutput & oExec.StdOut.ReadLine()
Loop

If InStr(strOutput, ":3000") = 0 Then
    ' Demarrage silencieux du serveur Vite en arriere-plan (0 = totalement masque)
    WshShell.Run "cmd.exe /c cd /d """ & projectDir & """ && npm.cmd run dev", 0, False
    ' Attente breve d'initialisation du serveur
    WScript.Sleep 2500
End If

' 2. Ouverture de l'application standalone dans Microsoft Edge (mode PWA / App dediee)
WshShell.Run "cmd.exe /c start msedge.exe --app=""http://localhost:3000/""", 0, False
