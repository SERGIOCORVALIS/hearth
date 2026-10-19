# P3 — Expose Hearth MCP to Alexa+ (cloudflared + alexa-ai)

This path is **optional** for judging (the web simulator already satisfies the Alexa+ simulation rule). Use it when you have an Amazon developer account and want a real add-on link.

## Prerequisites

1. Hearth MCP running locally: `npm run mcp` → `http://127.0.0.1:3100/mcp`
2. [cloudflared](https://developers.cloudflare.com/cloudflare-one/connections/connect-apps/install-and-setup/installation/) installed
3. Alexa AI CLI (`alexa-ai`) installed and authenticated — see [MCP Toolkit QuickStart](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html)

## 1. Start MCP

```bash
npm run build -w @hearth/shared
npm run mcp
```

Verify: open `http://127.0.0.1:3100/health` — should show `protocolVersion: 2025-11-25`.

## 2. Tunnel

PowerShell helper:

```powershell
.\scripts\tunnel-mcp.ps1
```

Or manually:

```bash
cloudflared tunnel --url http://127.0.0.1:3100
```

Copy the `https://….trycloudflare.com` URL. Endpoints:

```text
https://YOU.trycloudflare.com/mcp
https://YOU.trycloudflare.com/legal/privacy.html
https://YOU.trycloudflare.com/legal/terms.html
https://YOU.trycloudflare.com/assets/icon-72.png
https://YOU.trycloudflare.com/.well-known/oauth-protected-resource
https://YOU.trycloudflare.com/.well-known/oauth-authorization-server
```

Fill add-on JSON with those real URLs (no example.com):

```powershell
node scripts/fill-addon-json.mjs https://YOU.trycloudflare.com
```

## 3. Create / deploy Alexa+ MCP add-on

```bash
alexa-ai configure
alexa-ai new mcp --name "Hearth Family Concierge" --locale en-US --mcp-server-url "https://YOU.trycloudflare.com/mcp"
```

Merge [`alexa-addon/addon.json`](../alexa-addon/addon.json) (generated) into the package, then:

```bash
alexa-ai deploy
```

Test in Amazon’s web simulator for the add-on.

## Auth note (production vs hackathon)

Alexa+ production onboarding expects OAuth 2.1 + Protected Resource Metadata. Local demo stays **open by default**. Before tunneling, set a shared key so random internet clients cannot call tools:

```powershell
$env:HEARTH_API_KEY="change-me-before-tunneling"
$env:HEARTH_CORS_ORIGINS="https://YOU.trycloudflare.com,http://127.0.0.1:5173"
$env:HEARTH_PUBLIC_BASE_URL="https://YOU.trycloudflare.com"
$env:HEARTH_RATE_LIMIT_RPM="60"
npm run mcp
```

- `/mcp` requires `Authorization: Bearer <HEARTH_API_KEY>` or `X-Hearth-Api-Key`
- Unauthenticated `/mcp` returns **401 without `WWW-Authenticate`** (Alexa+ account-linking preference; discovery uses PRM instead)
- `/health`, `/legal`, `/assets`, and `/.well-known/*` stay public for probes and add-on packaging
- Simulator `POST /api/chat` uses the same key; the MCP client forwards it automatically
- Sessions expire via `HEARTH_SESSION_TTL_MS` (default 30m) and `HEARTH_MAX_SESSIONS` (default 100)
- Optional `HEARTH_RATE_LIMIT_RPM` applies a sliding window to `/mcp` and `POST /api/chat`

### OAuth / PRM scaffold (hackathon stub)

Enabled by default (`HEARTH_OAUTH_SCAFFOLD=0` to disable):

| Endpoint                                  | Purpose                                                          |
| ----------------------------------------- | ---------------------------------------------------------------- |
| `/.well-known/oauth-protected-resource`   | RFC 9728 PRM pointing at `/mcp`                                  |
| `/.well-known/oauth-authorization-server` | AS metadata with **PKCE S256 only**                              |
| `/oauth/authorize` · `/oauth/token`       | Minimal code+PKCE stub; access token = `HEARTH_API_KEY` when set |

This is enough for discovery demos and local PKCE smoke tests — not a production IdP. Prefer a shared `HEARTH_API_KEY` for short tunnel sessions.

## Demo talking point

“We ship a local Streamable HTTP MCP that the Alexa+ web sim uses today; the same `/mcp` endpoint can be tunneled with cloudflared, with PRM + PKCE S256 stubs and optional API-key + rate limits for the public URL.”
