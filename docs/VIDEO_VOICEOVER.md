# Demo video — shot list + English voiceover (&lt; 3:00)

Record with **two windows**: (A) http://127.0.0.1:5173/?demo=1 and (B) terminal running `npm run demo:broll` or MCP health.

## Setup before record

```powershell
npm run demo:prep
# opens http://127.0.0.1:5173/?demo=1 and verifies /health + /legal + /assets
# Window B: npm run demo:broll
# VO text: docs/demo-assets/VOICEOVER_EN.txt
# Full checklist: docs/demo-assets/RECORDING_READY.md
```

Click **Play demo** (or let `?demo=1` auto-start). Do not click around during takes.

---

## 0:00–0:15 — Hook (best material first)

**Show:** Device UI already mid-flow or start Play demo; timeline + tool calls appearing.

**Say:**  
“Meet Hearth — an Alexa+ living-room concierge. It plans the whole family evening through a real MCP server on Streamable HTTP.”

---

## 0:15–0:45 — Proof of MCP

**Show:** Status pills (MCP connected, protocol 2025-11-25, latency). Zoom tool-call panel.

**Say:**  
“Every action is a live JSON-RPC tool call — household profile, personalized plan, reminder, and a gentle care check-in.”

---

## 0:45–1:30 — Scenario 1 (Rivera / weekend)

**Show:** Weekend cozy autoplay completing; timeline chips for Elena captions.

**Say:**  
“For the Rivera household, Hearth builds a captioned classic night so Grandma Elena can follow every line — Maya and Leo get a calm wind-down.”

---

## 1:30–2:15 — Scenario 2 (switch household or elder focus)

**Show:** Switch to Okonkwo or Elder care scenario; care check-in + different names.

**Say:**  
“Switch households and the same MCP tools personalize again — care-first evenings for Ngozi, with accessibility notes baked into the plan card.”

---

## 2:15–2:40 — Visual card + AWS

**Show:** Plan hero visual / timeline; **AWS: Bedrock reasoning** pill or Care knowledge panel; agent strip.

**Say:**  
“The plan card is multimodal for the display. When AWS is enabled, Hearth reasons on Amazon Bedrock Converse, retrieves elder-care knowledge, and polishes a spoken briefing — and still falls back to an offline MCP router so the demo never breaks.”

---

## 2:40–2:55 — Close

**Say:**  
“Hearth: family entertainment plus elder care, on Alexa+ MCP — built for the living room.”

---

## Optional inserts (strong plus)

- **OSS:** flash https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter (2 sec)
- **Tunnel:** browser on public `/health` + `/legal/privacy.html` + `/assets/icon-72.png` ([`STRONG_PLUS.md`](STRONG_PLUS.md))
- **AWS:** `npm run proof:bedrock` (+ CloudWatch `/hearth/aws-builder`) then Bedrock console (5–15 sec) — see [`AWS_BUILDER_CLIP.md`](AWS_BUILDER_CLIP.md)

## Recording checklist

- [ ] English only, no copyrighted music
- [ ] First 15 seconds show wow (tools + timeline)
- [ ] Two scenarios visible
- [ ] Protocol version readable on screen
- [ ] Upload YouTube/Vimeo public &lt; 3 minutes
