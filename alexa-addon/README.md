# Alexa+ add-on packaging

Real assets live in-repo (not example.com):

- Legal: [`legal/privacy.html`](legal/privacy.html), [`legal/terms.html`](legal/terms.html)
- Icons/carousel: [`assets/`](assets/) (generated via `node scripts/generate-addon-assets.mjs`)
- Served by the MCP host at `/legal/*` and `/assets/*`

## Tunnel + fill addon.json

```powershell
npm run mcp
npm run tunnel
# copy https://xxxx.trycloudflare.com

node scripts/fill-addon-json.mjs https://xxxx.trycloudflare.com
# writes alexa-addon/addon.json with real HTTPS URLs

alexa-ai configure
alexa-ai new mcp --name "Hearth Family Concierge" --locale en-US --mcp-server-url "https://xxxx.trycloudflare.com/mcp"
# merge alexa-addon/addon.json into the generated package, then:
alexa-ai deploy
```

MCP surface: Streamable HTTP `/mcp` (2025-11-25), tools including `get_plan_visual`, resource `hearth://plan-card`, prompts `evening_briefing` / `care_checkin_script`.
