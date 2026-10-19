# Strong-plus status (OSS · Tunnel · AWS proof)

## 1) Open Source — DONE

| Field       | Value                                                             |
| ----------- | ----------------------------------------------------------------- |
| Public repo | **https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter** |
| GitHub user | `SERGIOCORVALIS`                                                  |
| License     | MIT                                                               |

Paste into Devpost Open Source mini (see [`OSS_MINI.md`](OSS_MINI.md)).

---

## 2) Tunnel + alexa-ai — PARTIAL (network / tooling limits on this PC)

### Ready in repo

- Real `/legal/privacy.html`, `/legal/terms.html` (light theme for video readability)
- Real PNG `/assets/icon-*.png`, `carousel-600x900.png`
- MCP serves them on `:3100`
- `node scripts/tunnel-proof.mjs` verifies health/legal/assets (local dry-run **PASS**)
- `node scripts/fill-addon-json.mjs https://YOUR_PUBLIC_HOST` writes `alexa-addon/addon.json`
- Frames + checklist: [`demo-assets/RECORDING_READY.md`](demo-assets/RECORDING_READY.md)

### Blocked here (re-checked 2026-10-16)

- **cloudflared**: quick URL issued, but edge **TCP/UDP 7844** still times out
- **ngrok**: config present but authtoken invalid (`ERR_NGROK_105`)
- **alexa-ai CLI**: not installed; Amazon docs prefer **macOS / Ubuntu** (+ CodeArtifact)

### What you do (15–30 min when network allows)

**Option A — ngrok (easiest on Windows)**

1. https://dashboard.ngrok.com/signup → copy authtoken
2. `ngrok config add-authtoken YOUR_TOKEN`
3. `npm run mcp`
4. `ngrok http 3100`
5. `node scripts/fill-addon-json.mjs https://xxxx.ngrok-free.app`
6. Open in browser (record for video):
   - `…/health`
   - `…/legal/privacy.html`
   - `…/assets/icon-72.png`
   - `…/mcp`

**Option B — phone hotspot + cloudflared**  
Often unblocks port 7844:  
`cloudflared tunnel --url http://127.0.0.1:3100`

**alexa-ai deploy** (needs Amazon developer + AWS IAM as in [setup docs](https://developer.amazon.com/docs/alexaplus/add-ons/set-up-your-development-environment.html)):  
prefer **WSL2 Ubuntu** on this machine, then:

```bash
# after AWS profiles alexa-ai-user + alexa-ai + codeartifact login
npm install -g @alexa-ai/cli
alexa-ai configure
alexa-ai new mcp --name "Hearth Family Concierge" --locale en-US \
  --mcp-server-url "https://YOUR_PUBLIC_HOST/mcp"
# merge alexa-addon/addon.json into addon-package/, then:
alexa-ai deploy
```

For the **demo video**, 10–15 seconds of browser on public `/health` + `/legal` + `/assets` already proves the Alexa+ HTTPS surface even before `alexa-ai deploy` succeeds.

---

## 3) CloudWatch / Bedrock console — READY (dry-run anytime; live when keys exist)

CloudWatch Logs helper ships in `simulator/server/cloudwatch.ts`. Full shot list: [`AWS_BUILDER_CLIP.md`](AWS_BUILDER_CLIP.md).

```powershell
# Rehearse without credentials
$env:HEARTH_CLOUDWATCH_DRY_RUN="1"
npm run proof:bedrock

# Live (keys + Bedrock model access)
Remove-Item Env:HEARTH_CLOUDWATCH_DRY_RUN -ErrorAction SilentlyContinue
$env:AWS_REGION="us-east-1"
$env:AWS_PROFILE="your-profile"
$env:BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
$env:HEARTH_CLOUDWATCH_LOG_GROUP="/hearth/aws-builder"
# unset HEARTH_FORCE_OFFLINE
npm run proof:bedrock
npm run demo
```

**Video clip (5–15 sec):**

1. Terminal: `npm run proof:bedrock` → Converse OK + CloudWatch put
2. Browser: AWS Console → **Amazon Bedrock** → Model access / Chat (Haiku)
3. Browser: CloudWatch → Log groups → `/hearth/aws-builder`
4. Cut to Hearth UI pill **AWS: Bedrock reasoning**

---

## Devpost tracks suggestion

- Primary: **Alexa+**
- Mini: **AWS Builder** (Bedrock path in code + console clip when available)
- Mini: **Open Source** → URL above (you can only win one mini prize)
