@echo off
setlocal
title Stop SUVMS Website Servers

color 0E
cls
echo ===============================================================================
echo                 STOPPING SUVMS SERVERS (Ports 5173 and 3001)
echo ===============================================================================
echo.

powershell -NoProfile -Command ^
  "$ports = @(5173, 3001); " ^
  "foreach ($p in $ports) { " ^
  "  $conns = Get-NetTCPConnection -LocalPort $p -ErrorAction SilentlyContinue; " ^
  "  if ($conns) { " ^
  "    foreach ($c in $conns) { " ^
  "      try { Stop-Process -Id $c.OwningProcess -Force -ErrorAction SilentlyContinue; Write-Host \"[✓] Stopped process $($c.OwningProcess) on port $p\" } catch {} " ^
  "    } " ^
  "  } " ^
  "}; " ^
  "Write-Host '[✓] Cleanup complete. SUVMS servers are stopped.'"

echo.
echo ===============================================================================
echo  Website servers are stopped.
echo  You can restart anytime by clicking 'CLICK_TO_START_WEBSITE.bat'.
echo ===============================================================================
echo.
pause
