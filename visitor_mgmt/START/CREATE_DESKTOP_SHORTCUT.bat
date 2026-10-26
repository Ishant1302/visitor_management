@echo off
setlocal
title Create SUVMS Desktop Shortcuts

color 0B
cls
echo ===============================================================================
echo          CREATING SUVMS SHORTCUTS ON YOUR WINDOWS DESKTOP
echo ===============================================================================
echo.

set "TARGET_BAT=%~dp0CLICK_TO_START_WEBSITE.bat"

powershell -NoProfile -Command ^
  "$ws = New-Object -ComObject WScript.Shell; " ^
  "$desktop = [Environment]::GetFolderPath('Desktop'); " ^
  "$lnkPath = Join-Path $desktop 'Start SUVMS Website.lnk'; " ^
  "$s = $ws.CreateShortcut($lnkPath); " ^
  "$s.TargetPath = '%TARGET_BAT%'; " ^
  "$s.WorkingDirectory = '%~dp0'; " ^
  "$s.Description = 'Start Smart University Visitor Management System'; " ^
  "$s.Save(); " ^
  "$urlPath = Join-Path $desktop 'Open SUVMS Webpage.url'; " ^
  "'[InternetShortcut]`r`nURL=http://localhost:5173/' | Out-File -FilePath $urlPath -Encoding ascii; " ^
  "Write-Host '[✓] Shortcut 1: Start SUVMS Website (Launches server + opens browser)' -ForegroundColor Green; " ^
  "Write-Host '[✓] Shortcut 2: Open SUVMS Webpage (Direct browser link)' -ForegroundColor Green;"

echo.
echo ===============================================================================
echo  SUCCESS! Look at your Desktop, you now have:
echo    1. 'Start SUVMS Website' (Double-click to start servers and open browser)
echo    2. 'Open SUVMS Webpage'  (Double-click to open webpage anytime)
echo ===============================================================================
echo.
pause
