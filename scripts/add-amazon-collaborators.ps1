# Add Amazon hackathon reviewers as GitHub collaborators.
# Run ONLY when submitting (invites expire in 7 days).
# Usage:
#   .\scripts\add-amazon-collaborators.ps1 -Repo owner/name
#   .\scripts\add-amazon-collaborators.ps1 -Repo owner/name -WhatIf
# Requires: gh auth login

param(
  [Parameter(Mandatory = $true)][string]$Repo,
  [switch]$WhatIf
)

$ErrorActionPreference = "Stop"

$users = @(
  "chris-trag",
  "knmeiss",
  "giolaq",
  "anishamalde",
  "mosesroth",
  "emersonsklar"
)

if ($Repo -notmatch '^[^/]+/[^/]+$') {
  Write-Host "Repo must look like owner/name (got: $Repo)" -ForegroundColor Red
  exit 1
}

if (-not (Get-Command gh -ErrorAction SilentlyContinue)) {
  Write-Host "Install GitHub CLI: https://cli.github.com/" -ForegroundColor Red
  exit 1
}

Write-Host "Checking gh auth…" -ForegroundColor DarkGray
gh auth status 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Host "Run: gh auth login" -ForegroundColor Red
  exit 1
}

Write-Host "Checking repo access for $Repo…" -ForegroundColor DarkGray
gh repo view $Repo --json nameWithOwner,visibility -q '"\(.nameWithOwner) (\(.visibility))"' 2>&1 | Out-Host
if ($LASTEXITCODE -ne 0) {
  Write-Host "Cannot view $Repo — push the repo first and confirm the name." -ForegroundColor Red
  exit 1
}

if ($WhatIf) {
  Write-Host ""
  Write-Host "WhatIf: would invite (permission: pull):" -ForegroundColor Cyan
  foreach ($u in $users) { Write-Host "  -> $u" }
  Write-Host ""
  Write-Host "Re-run without -WhatIf at submit time." -ForegroundColor Yellow
  exit 0
}

Write-Host "Inviting collaborators on $Repo (permission: pull)…" -ForegroundColor Cyan
$failed = @()
foreach ($u in $users) {
  Write-Host "  -> $u"
  gh api -X PUT "repos/$Repo/collaborators/$u" -f permission=pull 2>&1 | Out-Null
  if ($LASTEXITCODE -ne 0) {
    Write-Host "     FAILED for $u" -ForegroundColor Red
    $failed += $u
  }
}

Write-Host ""
if ($failed.Count -gt 0) {
  Write-Host "Finished with failures: $($failed -join ', ')" -ForegroundColor Yellow
  Write-Host "Retry those users from GitHub → Settings → Collaborators."
  exit 1
}

Write-Host "Done. Ask reviewers to accept invites within 7 days." -ForegroundColor Green
Write-Host "Resend from Settings > Collaborators if expired."
