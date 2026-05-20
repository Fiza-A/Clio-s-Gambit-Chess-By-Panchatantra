# Stops whichever process is LISTENING on TCP port 5000 (Windows / PowerShell).
$port = 5000
$conns = Get-NetTCPConnection -LocalPort $port -State Listen -ErrorAction SilentlyContinue
if (-not $conns) {
  Write-Host "Nothing is listening on port $port."
  exit 0
}
$pids = $conns | Select-Object -ExpandProperty OwningProcess -Unique
foreach ($procId in $pids) {
  try {
    Stop-Process -Id $procId -Force -ErrorAction Stop
    Write-Host "Stopped PID $procId (was listening on port $port)."
  }
  catch {
    Write-Host "Could not stop PID ${procId}: $_"
    exit 1
  }
}
