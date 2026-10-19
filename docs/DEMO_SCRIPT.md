# Demo script (&lt; 3 minutes, English)

Full voiceover + shot list: **[VIDEO_VOICEOVER.md](VIDEO_VOICEOVER.md)**

## One-command record setup

```bash
npm run demo
```

- Window A: **http://127.0.0.1:5173/?demo=1** (auto Play demo)
- Window B (optional): `npm run demo:broll` for MCP JSON-RPC terminal footage

Or click **Play demo** in the UI.

## Flow the autoplay runs (full MCP surface)

Play demo walks **10 beats** — every household, every scenario family, every tool class, plus resources and prompts. No Echo Show hardware required; the web simulator is the living-room display.

1. **MCP surface tour** — `list_households`, `tools/list`, read `hearth://*` resources, fetch `evening_briefing` + `care_checkin_script`
2. **Rivera · Weekend cozy** — full plan cascade (suggest → confirm → reminder → care → visual → state)
3. **Switch alternate plan** — second suggestion confirmed live
4. **Rivera · Busy weeknight** — 45-minute school-night constraints
5. **Park · Adults wind-down** — household switch + adults-only mood
6. **Reminder only** — `create_reminder` without re-planning
7. **Okonkwo · Elder care** — accessible plan + Ngozi check-in
8. **Care check-in (grandma)** — role-alias `memberId` resolution + resting status
9. **Evening briefing prompt** — MCP prompt + tool cascade the prompt describes
10. **Care script prompt** — spoken check-in script → `log_care_checkin` → state

CI uses `/?demo=1&fast=1` (short pauses). Recording uses normal pacing.

## Manual fallback

1. Show MCP connected + protocol `2025-11-25` + latency
2. Tap households / scenarios / Try chips to explore interactively
3. Mention Bedrock or offline honestly
