# Devpost — copy/paste pack (submit day)

Fill Devpost fields from the blocks below. Do **not** invite collaborators until the moment you submit (invites expire in **7 days**).

---

## Project name

```
Hearth — Alexa+ Family Concierge
```

## Tagline / elevator pitch

```
Alexa+ that plans the whole living room evening — kids, captions, and an elder care check-in — through a real Streamable HTTP MCP server.
```

## Built with (suggested tags)

```
Model Context Protocol, Streamable HTTP, Alexa+, Amazon Bedrock, AWS, React, Vite, Express, TypeScript, Zod
```

## Tracks

```
Primary: Alexa+
Mini: AWS Builder
Mini: Open Source (optional — only one mini prize can win)
```

## Is this a pre-existing project?

```
No — greenfield, built during the hackathon window.
```

---

## Description (paste)

```
Hearth is an Alexa+ living-room concierge that plans the whole family evening — kids, captions, and an elder care check-in — through a real Streamable HTTP MCP server (spec 2025-11-25).

What it does
1. Loads a household profile (Rivera, Park, or Okonkwo presets)
2. Suggests personalized plans with member-fit notes, accessibility chips, and a timed timeline
3. Confirms a plan, sets a reminder, and logs a gentle elder care check-in
4. Returns an MCP Apps-style visual plan card for the display
5. Optionally reasons with Amazon Bedrock Converse (+ care-knowledge retrieve and a spoken briefing polish)

How it works
• MCP server exposes tools, resources (hearth://…), and prompts over Streamable HTTP
• Web simulator mimics an Echo Show–style Alexa+ conversation and shows live tool calls
• Offline MCP router keeps the demo working without AWS; Bedrock upgrades the agent when credentials exist

Why it matters
Family entertainment demos often ignore elders. Hearth treats accessibility and care check-ins as first-class MCP outputs, not afterthoughts in chat text — so the living room works for Grandma and the kids together.

Repo layout: mcp-server/ · simulator/ · packages/shared · oss/streamable-http-mcp-starter · ARCHITECTURE.md
```

---

## Demo video link

```
(paste YouTube/Vimeo public URL — English, under 3 minutes)
```

Recording guide: `docs/demo-assets/RECORDING_READY.md`

---

## GitHub repo URL (main project)

```
(paste after push — prefer private for judging)
```

### Collaborators — run ONLY at submit time

```powershell
.\scripts\add-amazon-collaborators.ps1 -Repo YOUR_USER/YOUR_REPO
# dry-run first:
.\scripts\add-amazon-collaborators.ps1 -Repo YOUR_USER/YOUR_REPO -WhatIf
```

Users (pull): `chris-trag`, `knmeiss`, `giolaq`, `anishamalde`, `mosesroth`, `emersonsklar`

---

## Open Source mini (if entering)

| Field                  | Paste                                                           |
| ---------------------- | --------------------------------------------------------------- |
| OSS / contribution URL | `https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter` |
| Main project repo URL  | _(same as GitHub above)_                                        |
| GitHub username        | `SERGIOCORVALIS`                                                |

**What / how / why:**

```
Created a new MIT-licensed Streamable HTTP MCP starter for Alexa+ (MCP spec 2025-11-25) during the hackathon, alongside the main Hearth submission. Most MCP samples are stdio-only; Alexa+ needs remote Streamable HTTP. The starter gives Express POST/GET/DELETE /mcp, session handling, a sample ping tool, a resource, and cloudflared / alexa-ai next steps so builders can connect a remote MCP server to Alexa+ faster.
```

---

## Feedback on tools / APIs / SDKs

Paste/adapt from `docs/FEEDBACK.md` (MCP SDK, Bedrock Converse, care KB, Vite/React/Express). Short version:

```
MCP SDK (@modelcontextprotocol/sdk): Used for Streamable HTTP MCP 2025-11-25 (tools, hearth:// resources, prompts). Worked well with Zod schemas; session header (Mcp-Session-Id) docs could be clearer for hackathons. Would use again.

Amazon Bedrock Converse: Tool-calling agent loop + spoken briefing polish + care-KB snippets in system prompt. Haiku is fast for demos; model enablement per region slows first setup. Offline MCP fallback keeps video working. Would use again.

Vite + React / Express: Echo Show–style simulator with live tool-call panel; credentials stay server-side. Strong DX for judging.
```

---

## Bug journal (bonus)

Point judges to `docs/BUG_JOURNAL.md` or paste highlights:

```
BUG-001: Missing Mcp-Session-Id after initialize → 400 (use SDK transport).
BUG-002: Bedrock without credentials used to hard-fail → offline MCP fallback.
BUG-003: Unstable plan ids → stable template ids + dynamic suggest→confirm.
BUG-004: Care check-in wrong member across households → elder alias / role resolve.
BUG-005: Demo autoplay skipped second household (stale busy) → busyRef + awaited send.
BUG-006: Windows port half-bound after kill → cleanup before npm run demo.
```

---

## Feature requests

Paste table summary from `docs/FEATURE_REQUESTS.md` (official Alexa+ MCP simulator, Streamable HTTP hello template, hackathon Bedrock sandbox, OAuth-lite/PRM scaffold, latency ping in alexa-ai CLI).

---

## Submit-day order

1. `npm run sanity`
2. Push GitHub repo
3. Upload demo video → paste URL
4. Paste this pack into Devpost
5. **Then** run collaborator invites
6. Double-check tracks + OSS URL if entering mini
