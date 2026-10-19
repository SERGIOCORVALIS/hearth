# Demo video + tunnel proof — ready checklist

Generated for the Hearth hackathon submission. You still need to **screen-record** and upload YouTube/Vimeo (agents cannot publish the final video).

## 1) Demo video (&lt; 3:00 English)

### One-command prep

```powershell
npm run demo:prep
# or manually:
#   $env:HEARTH_FORCE_OFFLINE=1; npm run demo
```

### Record these two windows

| Window | What                                                                 |
| ------ | -------------------------------------------------------------------- |
| A      | http://127.0.0.1:5173/?demo=1 — wait for autoplay (Rivera → Okonkwo) |
| B      | `npm run demo:broll` — live MCP tool stream                          |

### Voiceover

- Plain text for TTS / reading: [`VOICEOVER_EN.txt`](VOICEOVER_EN.txt)
- Timed shot list: [`../VIDEO_VOICEOVER.md`](../VIDEO_VOICEOVER.md)
- Gemini B-roll prompts (optional): [`../GEMINI_VIDEO_PROMPT.md`](../GEMINI_VIDEO_PROMPT.md)

### Storyboard frames captured in-repo

| File                                            | Use                                        |
| ----------------------------------------------- | ------------------------------------------ |
| `frames/02-okonkwo-plan.png`                    | Scenario 2 / plan card + timeline          |
| `frames/03-health.json.png`                     | MCP proof — protocol `2025-11-25`, latency |
| `frames/04-privacy.png`                         | Tunnel surface — legal page                |
| (re-open UI and grab Rivera mid-demo if needed) | Scenario 1                                 |

**Suggested stitch:** 15s hook (tools) → Rivera → Okonkwo → health JSON flash → privacy/icon → close VO.

YouTube title: `Hearth — Alexa+ Family Concierge (MCP Demo)`

---

## 2) Tunnel proof (Alexa+ HTTPS surface)

### Local dry-run — DONE ✓

```bash
node scripts/tunnel-proof.mjs http://127.0.0.1:3100
```

See [`tunnel-proof.json`](tunnel-proof.json) / [`TUNNEL_PROOF.md`](TUNNEL_PROOF.md) — all of `/health`, `/legal/*`, `/assets/*` returned **200**.

### Public HTTPS — blocked on this network

| Tool        | Result (2026-10-16)                                                  |
| ----------- | -------------------------------------------------------------------- |
| cloudflared | URL issued (`*.trycloudflare.com`) but edge **TCP/UDP 7844** timeout |
| ngrok       | **ERR_NGROK_105** — invalid/missing authtoken                        |

### What you do for the 10–15s public insert

1. Phone hotspot (often unblocks 7844) **or** fix ngrok: https://dashboard.ngrok.com/get-started/your-authtoken  
   `ngrok config add-authtoken YOUR_TOKEN`
2. `$env:HEARTH_API_KEY="change-me"; npm run mcp`
3. `.\scripts\tunnel-mcp.ps1`
4. `node scripts/tunnel-proof.mjs https://YOUR_PUBLIC_HOST`
5. `node scripts/fill-addon-json.mjs https://YOUR_PUBLIC_HOST`
6. Record browser: `/health` → `/legal/privacy.html` → `/assets/icon-72.png`

Until public tunnel works, use the **local** health/privacy/icon frames above in the video and say: “same surface exposed via HTTPS tunnel for Alexa+.”

---

## npm scripts

| Script                      | Purpose                                            |
| --------------------------- | -------------------------------------------------- |
| `npm run demo:prep`         | Start stack, verify local surface, open `/?demo=1` |
| `npm run demo:broll`        | Terminal MCP tool sequence for Window B            |
| `npm run demo:tunnel-proof` | Alias for `node scripts/tunnel-proof.mjs`          |
