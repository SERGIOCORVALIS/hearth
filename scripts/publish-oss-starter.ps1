# Publishes oss/streamable-http-mcp-starter as its own public GitHub repo.
# Prerequisites: gh auth login, git configured.
# Usage: .\scripts\publish-oss-starter.ps1 -GitHubUser YOUR_USER [-RepoName streamable-http-mcp-starter]

param(
  [Parameter(Mandatory = $true)][string]$GitHubUser,
  [string]$RepoName = "streamable-http-mcp-starter"
)

$ErrorActionPreference = "Stop"
$root = Split-Path -Parent $PSScriptRoot
$src = Join-Path $root "oss\streamable-http-mcp-starter"
$tmp = Join-Path $env:TEMP "hearth-$RepoName-publish"

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Install GitHub CLI: https://cli.github.com/" -ForegroundColor Red
  exit 1
}

if (Test-Path $tmp) { Remove-Item -Recurse -Force $tmp }
New-Item -ItemType Directory -Path $tmp | Out-Null
Copy-Item -Recurse -Force "$src\*" $tmp

Push-Location $tmp
try {
  git init
  git add .
  git commit -m "feat: Streamable HTTP MCP starter for Alexa+ (2025-11-25)"
  git branch -M main

  gh repo create "$GitHubUser/$RepoName" --public --source=. --remote=origin --push --description "Minimal Alexa+-ready MCP server using Streamable HTTP (MCP spec 2025-11-25)"

  Write-Host ""
  Write-Host "Published: https://github.com/$GitHubUser/$RepoName" -ForegroundColor Green
  Write-Host "Paste that URL into Devpost Open Source mini fields (see docs/OSS_MINI.md)."
} finally {
  Pop-Location
}
