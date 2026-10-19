# Hearth — Alexa+ Family Concierge

Hearth is a hackathon demo for the **Alexa+** track: a real **MCP server** (specification **2025-11-25**, **Streamable HTTP**) plus an **Echo Show–style web simulation**. A family evening concierge personalizes plans for kids and grandma, suggests timelines, sets reminders, and logs gentle care check-ins.

**Tracks:** Alexa+ (primary) · AWS Builder mini-challenge (Amazon Bedrock)

**Pitch:** _Alexa+ that plans the whole living room evening — kids, captions, and an elder care check-in — through an open MCP server._

Full Devpost blurb: [docs/DEVPOST_DESCRIPTION.md](docs/DEVPOST_DESCRIPTION.md) · Bedrock setup: [docs/AWS_BUILDER.md](docs/AWS_BUILDER.md) · AWS clip: [docs/AWS_BUILDER_CLIP.md](docs/AWS_BUILDER_CLIP.md)

### Record the demo video

```powershell
npm run demo:prep
# Window A opens ?demo=1 — Window B: npm run demo:broll
```

Checklist + VO + frames: [docs/demo-assets/RECORDING_READY.md](docs/demo-assets/RECORDING_READY.md) · shot list: [docs/VIDEO_VOICEOVER.md](docs/VIDEO_VOICEOVER.md)

## Architecture

```
Browser (device UI + voice)
    → Simulator API (agent loop: Bedrock or offline)
        → Hearth MCP server  POST/GET /mcp  (Streamable HTTP JSON-RPC)
            → tools, resources (hearth://…), prompts (evening_briefing)
```

The repository **actually invokes** local MCP tools in code. External AWS calls are **virtual by default** so the whole project works offline as a self-contained demo.

## Quick start (PC only)

Prerequisites: **Node.js 20+** and npm. No AWS account required.

```bash
git clone <your-repo-url>
cd amazon-hakaton
npm install
npm run demo
```

Open **http://127.0.0.1:5173**. One command starts MCP (`:3100`) and the simulator (`:5173` + API `:8787`).

Or run separately:

```bash
npm run build -w @hearth/shared
npm run mcp    # http://127.0.0.1:3100/mcp
npm run sim    # http://127.0.0.1:5173
```

Try scenario chips, or:

> Plan a low-key evening for me, the kids, and grandma

The UI shows a **device frame**, **evening timeline**, **live MCP tool calls**, **latency**, and optional **voice input** (Chrome). Agent mode is **virtual Bedrock** (real local MCP + Bedrock-shaped AWS chips) with **CloudWatch dry-run** — no outbound AWS traffic.

### Optional: live Amazon Bedrock (AWS Builder)

Demo networking is the default. To hit real Bedrock / CloudWatch:

```bash
set HEARTH_LIVE_AWS=1
set AWS_REGION=us-east-1
set AWS_PROFILE=your-profile
set BEDROCK_MODEL_ID=anthropic.claude-3-haiku-20240307-v1:0
```

If live Bedrock fails, Hearth falls back to the offline MCP agent. Force the plain offline router (no Bedrock UI):

```bash
set HEARTH_FORCE_OFFLINE=1
```

## MCP surface

| Kind     | Name                     | Purpose                                   |
| -------- | ------------------------ | ----------------------------------------- |
| Tool     | `get_household_profile`  | Members, preferences, accessibility notes |
| Tool     | `suggest_evening_plan`   | Personalized options + why/chips/timeline |
| Tool     | `create_reminder`        | Reminder tied to a plan                   |
| Tool     | `log_care_checkin`       | Gentle elder / accessibility check-in     |
| Tool     | `confirm_plan`           | Lock in a chosen plan                     |
| Tool     | `get_evening_state`      | Tonight’s plan, reminders, check-ins      |
| Resource | `hearth://household`     | Live household JSON                       |
| Resource | `hearth://evening-state` | Tonight’s state                           |
| Resource | `hearth://scenarios`     | Demo scenario presets                     |
| Prompt   | `evening_briefing`       | Spoken Alexa+ briefing                    |
| Prompt   | `care_checkin_script`    | Elder care check-in script                |

Protocol: **Streamable HTTP** on `/mcp` · version **2025-11-25**. Tool latency is exposed on `/health` (Alexa+ target &lt; 500 ms).

## Demo script

See [docs/DEMO_SCRIPT.md](docs/DEMO_SCRIPT.md) — two scenarios, timeline, tools, optional voice/Bedrock.

## Connecting to real Alexa+ (optional)

1. Expose the MCP server with a tunnel (`cloudflared tunnel --url http://127.0.0.1:3100`).
2. Follow the [Alexa+ MCP QuickStart](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html) (`alexa-ai configure` / add-on deploy).
3. Production Alexa+ also expects OAuth/PRM; this repo includes a hackathon PRM + PKCE S256 scaffold (`/.well-known/*`, `/oauth/*`). The web simulator path can stay local/open per hackathon rules.

## Tests, Docker, architecture

```bash
npm test                 # mcp-server + simulator vitest suites
npm run test:e2e         # Playwright: /?demo=1&fast=1 (Rivera → Okonkwo)
npm run test:oss         # OSS starter: build dist/ + Streamable HTTP smoke
npm run lint             # ESLint
npm run format:check     # Prettier
npm run typecheck
npm run build
docker compose up --build   # MCP :3100 + UI/API :8787
```

CI (GitHub Actions): `.github/workflows/ci.yml` — lint → format → typecheck → test → Playwright → OSS smoke → build.

Simulator coverage: offline agent, Bedrock→offline fallback, knowledge retrieve, `/api/chat` + demo-script, demo autoplay sequencer (`/?demo=1`).

Tunnel hardening (optional): `HEARTH_API_KEY`, `HEARTH_CORS_ORIGINS`, `HEARTH_RATE_LIMIT_RPM`, OAuth/PRM scaffold, session TTL — see `.env.example` and [docs/ALEXA_PLUS_TUNNEL.md](docs/ALEXA_PLUS_TUNNEL.md).

See [ARCHITECTURE.md](ARCHITECTURE.md).

## Alexa+ tunnel (optional P3)

```bash
npm run mcp
npm run tunnel           # cloudflared → then alexa-ai deploy
```

Details: [docs/ALEXA_PLUS_TUNNEL.md](docs/ALEXA_PLUS_TUNNEL.md).

## Open Source mini

Standalone MIT starter: [`oss/streamable-http-mcp-starter`](oss/streamable-http-mcp-starter)

**Published:** https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter

Details: [docs/OSS_MINI.md](docs/OSS_MINI.md) · Strong-plus status: [docs/STRONG_PLUS.md](docs/STRONG_PLUS.md)

## Before you submit

```powershell
npm run sanity
# record video per docs/VIDEO_VOICEOVER.md
# push private repo, then AT SUBMIT TIME:
.\scripts\add-amazon-collaborators.ps1 -Repo YOUR_USER/YOUR_REPO
```

Checklist: [docs/SUBMISSION_CHECKLIST.md](docs/SUBMISSION_CHECKLIST.md) · Devpost paste: [docs/DEVPOST_PASTE.md](docs/DEVPOST_PASTE.md) · Bugs: [docs/BUG_JOURNAL.md](docs/BUG_JOURNAL.md) · Features: [docs/FEATURE_REQUESTS.md](docs/FEATURE_REQUESTS.md) · Deps: [docs/DEPENDENCY_AUDIT.md](docs/DEPENDENCY_AUDIT.md) · Plan card: [docs/MCP_APPS_PLAN_CARD.md](docs/MCP_APPS_PLAN_CARD.md)

## Repository layout

```text
mcp-server/     Streamable HTTP MCP server + Hearth tools
simulator/      React UI + agent API (Bedrock / offline) + MCP client
packages/shared Shared types + protocol constant
oss/            Additional OSS starter (Streamable HTTP MCP)
docs/           Devpost feedback, bug journal, tunnel, OSS notes
ARCHITECTURE.md System design for reviewers
```

## GitHub submission notes

- Prefer a **private** repo for judging; add Amazon reviewers as collaborators **when you submit** (invites expire in 7 days):
  - `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`
- Include an MIT `LICENSE` (already present) if you open-source later.
- Demo video: **&lt; 3 minutes**, public YouTube/Vimeo, **English**.

## License

MIT — see [LICENSE](LICENSE).
