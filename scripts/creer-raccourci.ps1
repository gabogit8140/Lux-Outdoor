$wsh = New-Object -ComObject WScript.Shell
$desktop = $wsh.SpecialFolders.Item('Desktop')
$shortcutPath = Join-Path $desktop "Lux Outdoor.lnk"

$shortcut = $wsh.CreateShortcut($shortcutPath)
$shortcut.TargetPath = "wscript.exe"
$shortcut.Arguments = "`"c:\Users\Francois.Gaborel\Downloads\Trace Outdoor\Lancer-Lux-Outdoor.vbs`""
$shortcut.WorkingDirectory = "c:\Users\Francois.Gaborel\Downloads\Trace Outdoor"
$shortcut.IconLocation = "c:\Users\Francois.Gaborel\Downloads\Trace Outdoor\public\favicon.ico,0"
$shortcut.Description = "Lux Outdoor - Circuits Velo & Randonnee"
$shortcut.Save()

Write-Output "Raccourci cree sur le Bureau : $shortcutPath"
