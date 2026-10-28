' Demarre silencieusement le serveur local Vite au demarrage de Windows
Set WshShell = CreateObject("WScript.Shell")
projectDir = "c:\Users\Francois.Gaborel\Downloads\Trace Outdoor"

' Verifie si le port 3000 tourne deja
Set oExec = WshShell.Exec("cmd.exe /c netstat -ano | findstr LISTENING | findstr :3000")
strOutput = ""
Do While Not oExec.StdOut.AtEndOfStream
    strOutput = strOutput & oExec.StdOut.ReadLine()
Loop

If InStr(strOutput, ":3000") = 0 Then
    WshShell.Run "cmd.exe /c cd /d """ & projectDir & """ && npm.cmd run dev", 0, False
End If
