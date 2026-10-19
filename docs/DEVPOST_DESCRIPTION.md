# Devpost — project description (draft)

## One-liner / pitch

**Hearth** is an Alexa+ living-room concierge that plans the whole family evening — kids, captions, and an elder care check-in — through a real Streamable HTTP MCP server (spec 2025-11-25).

## What it does

Hearth helps multi-generational households decide what to do tonight. It:

1. Loads a household profile (Rivera, Park, or Okonkwo presets)
2. Suggests personalized plans with member-fit notes, accessibility chips, and a timed timeline
3. Confirms a plan, sets a reminder, and logs a gentle elder care check-in
4. Returns an MCP Apps-style visual plan card for the display
5. Optionally reasons with **Amazon Bedrock** Converse (+ care-knowledge retrieve and a spoken briefing polish)

## How it works

- **MCP server** exposes tools, resources (`hearth://…`), and prompts over Streamable HTTP
- **Web simulator** mimics an Echo Show–style Alexa+ conversation and shows live tool calls
- **Offline MCP router** keeps the demo working without AWS; **Bedrock** upgrades the agent when credentials exist

## Why it matters

Family entertainment demos often ignore elders. Hearth treats **accessibility and care check-ins as first-class MCP outputs**, not afterthoughts in chat text — so the living room works for Grandma and the kids together.

## Tracks

- Primary: **Alexa+**
- Mini: **AWS Builder** (Bedrock)
- Optional mini: **Open Source** (`oss/streamable-http-mcp-starter`)

## Built during the hackathon

Greenfield project created in the submission window (not a pre-existing product).
