# One-shot prep for recording the <3min English demo video.
# Starts MCP + simulator (offline agent), verifies endpoints, prints the shot list.
#
# Usage (from repo root):
#   .\scripts\prepare-demo-record.ps1
#   .\scripts\prepare-demo-record.ps1 -WithTunnel   # also remind / start tunnel proof flow

param(
  [switch]$WithTunnel,
  [switch]$SkipStart
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
Set-Location $root

Write-Host "== Hearth demo record prep ==" -ForegroundColor Cyan

# Free sticky ports from prior crashes
foreach ($port in 3100, 8787, 5173) {
  Get-NetTCPConnection -LocalPort $port -ErrorAction SilentlyContinue |
    ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
}
Start-Sleep -Seconds 1

$env:HEARTH_FORCE_OFFLINE = "1"
# Leave API key unset for local record; set before public tunnel separately.

Write-Host "Building shared…" -ForegroundColor DarkGray
npm run build -w @hearth/shared | Out-Null

if (-not $SkipStart) {
  Write-Host "Starting npm run demo (MCP + simulator)…" -ForegroundColor Cyan
  Start-Process -FilePath "npm" -ArgumentList "run", "demo" -WorkingDirectory $root -WindowStyle Normal
}

Write-Host "Waiting for MCP :3100 and UI :5173 …" -ForegroundColor DarkGray
$deadline = (Get-Date).AddSeconds(90)
$mcpOk = $false
$uiOk = $false
while ((Get-Date) -lt $deadline) {
  try {
    $h = Invoke-RestMethod -Uri "http://127.0.0.1:3100/health" -TimeoutSec 2
    if ($h.protocolVersion -eq "2025-11-25") { $mcpOk = $true }
  } catch {}
  try {
    $r = Invoke-WebRequest -Uri "http://127.0.0.1:5173/" -TimeoutSec 2 -UseBasicParsing
    if ($r.StatusCode -eq 200) { $uiOk = $true }
  } catch {}
  if ($mcpOk -and $uiOk) { break }
  Start-Sleep -Milliseconds 500
}

if (-not $mcpOk) { Write-Host "MCP not ready on :3100" -ForegroundColor Red; exit 1 }
if (-not $uiOk) { Write-Host "UI not ready on :5173 (demo may still be starting)" -ForegroundColor Yellow }

Write-Host "Local tunnel dry-run (assets on :3100)…" -ForegroundColor DarkGray
node scripts/tunnel-proof.mjs http://127.0.0.1:3100
if ($LASTEXITCODE -ne 0) { exit $LASTEXITCODE }

$demoUrl = "http://127.0.0.1:5173/?demo=1"
Write-Host ""
Write-Host "READY TO RECORD" -ForegroundColor Green
Write-Host "  Window A: $demoUrl"
Write-Host "  Window B: npm run demo:broll"
Write-Host "  Voiceover: docs/demo-assets/VOICEOVER_EN.txt"
Write-Host "  Shot list: docs/VIDEO_VOICEOVER.md"
Write-Host ""

try {
  Start-Process $demoUrl
} catch {}

if ($WithTunnel) {
  Write-Host "Tunnel proof (public HTTPS for video insert):" -ForegroundColor Cyan
  Write-Host "  1) In a new terminal: npm run mcp   (optionally set HEARTH_API_KEY first)"
  Write-Host "  2) .\scripts\tunnel-mcp.ps1"
  Write-Host "  3) node scripts/tunnel-proof.mjs https://YOUR_PUBLIC_HOST"
  Write-Host "  4) node scripts/fill-addon-json.mjs https://YOUR_PUBLIC_HOST"
  Write-Host "  5) Record 10-15s of /health → /legal/privacy.html → /assets/icon-72.png"
}
