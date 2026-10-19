# Submission checklist

## Tracks

- [x] Primary: **Alexa+** (MCP Streamable HTTP `2025-11-25` + web simulation)
- [x] Mini: **AWS Builder** (Bedrock Converse + care KB + briefing polish)
- [x] Open Source mini: https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter

Note: one main-track prize + one mini-contest prize max.

## Code / quality

- [x] MIT `LICENSE`
- [x] README + ARCHITECTURE
- [x] MCP imported/called in code (not README-only)
- [x] Bedrock path + offline fallback
- [x] Tests: `npm test` · `npm run test:e2e` · `npm run test:oss` · `npm run sanity`
- [x] Lint/format/CI: `npm run lint` · `npm run format:check` · `.github/workflows/ci.yml`
- [x] Demo autoplay: `/?demo=1` + `npm run demo:broll`
- [x] Bug journal + feedback + feature requests drafted

## Repo (do at submit time)

- [ ] Push private GitHub repo (or public with MIT)
- [ ] Dry-run invites: `.\scripts\add-amazon-collaborators.ps1 -Repo YOUR_USER/YOUR_REPO -WhatIf`
- [ ] Add collaborators **when submitting** (invites expire in 7 days):

```powershell
.\scripts\add-amazon-collaborators.ps1 -Repo YOUR_USER/YOUR_REPO
```

Users: `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`

## Devpost fields

**One paste pack:** [`DEVPOST_PASTE.md`](DEVPOST_PASTE.md)

| Field                 | Source                                                     |
| --------------------- | ---------------------------------------------------------- |
| Description           | [`DEVPOST_DESCRIPTION.md`](DEVPOST_DESCRIPTION.md)         |
| Tracks                | Alexa+ + AWS Builder (+ OSS if published)                  |
| Feedback              | [`FEEDBACK.md`](FEEDBACK.md)                               |
| Bug journal           | [`BUG_JOURNAL.md`](BUG_JOURNAL.md)                         |
| Feature requests      | [`FEATURE_REQUESTS.md`](FEATURE_REQUESTS.md)               |
| Demo video            | &lt; 3 min EN — [`VIDEO_VOICEOVER.md`](VIDEO_VOICEOVER.md) |
| OSS URLs              | [`OSS_MINI.md`](OSS_MINI.md) if entering                   |
| Pre-existing project? | N/A — built during hackathon                               |

## Demo video (day of)

```powershell
npm run demo:prep
# A: http://127.0.0.1:5173/?demo=1
# B: npm run demo:broll
# See docs/demo-assets/RECORDING_READY.md
```

- [ ] First 15s show tools + timeline
- [ ] Two scenarios / households
- [ ] Mention Bedrock or offline honestly
- [ ] Optional 10–15s tunnel insert (`npm run demo:tunnel-proof -- https://HOST`)
- [ ] No third-party trademarks / copyrighted music
- [ ] Public YouTube or Vimeo link

## Windows tip

If ports stick after a crash:

```powershell
Get-NetTCPConnection -LocalPort 3100,8787,5173 -ErrorAction SilentlyContinue |
  ForEach-Object { Stop-Process -Id $_.OwningProcess -Force -ErrorAction SilentlyContinue }
```
