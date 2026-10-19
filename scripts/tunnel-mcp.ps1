# Expose local Hearth MCP (port 3100) publicly.
# Prefers ngrok (needs authtoken), then cloudflared.
# Requires: npm run mcp already listening.

$ErrorActionPreference = "Stop"

try {
  $health = Invoke-RestMethod -Uri "http://127.0.0.1:3100/health" -TimeoutSec 3
  Write-Host "MCP health OK — protocol $($health.protocolVersion)" -ForegroundColor Green
} catch {
  Write-Host "MCP is not reachable at http://127.0.0.1:3100/health" -ForegroundColor Red
  Write-Host "Start it first: npm run mcp"
  exit 1
}

Write-Host ""
Write-Host "After the public URL appears, run:" -ForegroundColor Cyan
Write-Host '  node scripts/fill-addon-json.mjs https://YOUR_PUBLIC_HOST'
Write-Host "Then open /health /legal/privacy.html /assets/icon-72.png for the video."
Write-Host "Full status: docs/STRONG_PLUS.md"
Write-Host ""

if (Get-Command ngrok -ErrorAction SilentlyContinue) {
  Write-Host "Trying ngrok http 3100 ..." -ForegroundColor Cyan
  Write-Host "(If ERR_NGROK_4018: ngrok config add-authtoken YOUR_TOKEN)" -ForegroundColor DarkYellow
  ngrok http 3100
  exit $LASTEXITCODE
}

if (Get-Command cloudflared -ErrorAction SilentlyContinue) {
  Write-Host "Trying cloudflared (needs outbound TCP/UDP 7844) ..." -ForegroundColor Cyan
  cloudflared tunnel --url http://127.0.0.1:3100 --protocol http2
  exit $LASTEXITCODE
}

Write-Host "Install ngrok (https://ngrok.com) or cloudflared, then retry." -ForegroundColor Red
exit 1
