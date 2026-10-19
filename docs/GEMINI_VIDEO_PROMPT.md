# Gemini / Veo — prompts for Hearth demo video

Use in **Gemini** (Veo video) or paste into a storyboard tool.  
Language of the **finished YouTube video must be English** (hackathon rule).  
No copyrighted music, no Amazon trademark logos as 3D product replicas if unsure — use generic “smart display” + on-screen UI look.

**Better path for winning:** record the real UI (`/?demo=1`) and only use Gemini for B-roll / title cards. Pure AI video alone may not prove MCP runs.

---

## A) One master prompt (copy-paste into Gemini)

```text
Create an 8-second cinematic product demo clip in 16:9 for a hackathon project called "Hearth".

Scene: a warm modern living room at dusk, soft amber lamp light, multi-generational family vibe (adults, kids, grandmother on the sofa). In the foreground, a sleek smart display tablet on a stand shows a dark UI branded "Hearth" with status text "MCP connected · 2025-11-25", a chat bubble planning a family evening, and a side panel listing tool calls: get_household_profile, suggest_evening_plan, confirm_plan, log_care_checkin. The plan card reads "Captioned Classic + Cocoa" with chips Captions on, Warm lighting.

Camera: slow push-in toward the display, shallow depth of field, premium tech-commercial look, no logos of real brands, no readable third-party trademarks, no copyrighted posters on walls.

Motion: subtle UI glow, timeline steps animating in, calm atmosphere. Photorealistic, high detail, film grain light.

Style: cozy + premium, not sci-fi purple neon, not cyberpunk.
```

---

## B) Shot list — generate 6 clips (~8s each), then stitch to &lt;3 min

### Clip 1 — Hook (0:00–0:15 look)

```text
8-second 16:9 cinematic shot. Smart home display on a wooden table in a cozy living room evening. Screen shows app title "Hearth" large, subtitle "Alexa+ family concierge", MCP connected badge, and a glowing conversation starting. Slow dolly-in. Warm tungsten light, soft bokeh. No brand logos. Photoreal commercial.
```

### Clip 2 — MCP proof

```text
8-second 16:9 close-up of a dark developer UI on a smart display. Side panel animates JSON-RPC style tool call cards appearing one by one: get_household_profile, suggest_evening_plan, create_reminder, log_care_checkin. Green latency badge "42ms". Terminal-like elegance, readable English labels, warm ambient room reflection on the glass bezel. No copyrighted UI skins.
```

### Clip 3 — Rivera family evening

```text
8-second 16:9 living room: grandmother with large TV captions visible on a classic film, two kids nearby with cocoa mugs, parents dimming warm lights. Cutaway insert of a tablet plan card titled "Captioned Classic + Cocoa" with timeline T+0 Cocoa, T+15 Film, T+90 Wind-down. Soft emotional lighting, inclusive, calm, photoreal.
```

### Clip 4 — Household switch / elder care

```text
8-second 16:9. Same Hearth display UI switches household label from "Rivera family" to "Okonkwo home". Plan updates; care check-in card shows elder name and status "ok", chips Large captions, Seated options. Gentle camera pan. Warm home interior, respectful elder-care mood, no medical equipment drama.
```

### Clip 5 — AWS / Bedrock hint (abstract, no fake AWS logos required)

```text
8-second 16:9. Smart display shows strip text "Reasoning on Amazon Bedrock" and a "Care knowledge" panel with short accessibility tips about captions and clear pathways. Soft orange accent lights. Premium product demo, photoreal, no official corporate logos stamped on the device.
```

### Clip 6 — Closing card

```text
8-second 16:9 end card. Dark warm gradient background. Large elegant serif title "Hearth". Subtitle: "Family evenings. Captions. Care check-ins. MCP for Alexa+." Small line: "Streamable HTTP · 2025-11-25". Slow fade, minimal motion, premium. No music required.
```

---

## C) English voiceover (for Gemini TTS / ElevenLabs / record yourself)

Generate speech, **English**, clear, warm, medium pace, no music bed with vocals.

```text
Meet Hearth — an Alexa+ living-room concierge. It plans the whole family evening through a real MCP server on Streamable HTTP.

Every action is a live JSON-RPC tool call — household profile, personalized plan, reminder, and a gentle care check-in.

For the Rivera household, Hearth builds a captioned classic night so Grandma Elena can follow every line — Maya and Leo get a calm wind-down.

Switch households and the same MCP tools personalize again — care-first evenings, with accessibility notes baked into the plan card.

The plan card is multimodal for the display. When AWS is enabled, Hearth reasons on Amazon Bedrock, retrieves elder-care knowledge, and polishes a spoken briefing — and still falls back to an offline MCP router so the demo never breaks.

Hearth: family entertainment plus elder care, on Alexa+ MCP — built for the living room.
```

**Gemini TTS prompt:**

```text
Read the following script in natural American English, warm and confident product-demo narrator, clear diction, moderate pace, no music, no sound effects:
[paste voiceover above]
```

---

## D) Stitching instructions (CapCut / Premiere / DaVinci)

1. Order clips 1→6; trim to total **under 3:00** (aim 2:20–2:50).
2. Lay voiceover under clips; cut picture to match sentences.
3. **Insert 20–40 seconds of REAL screen recording** from `http://127.0.0.1:5173/?demo=1` after Clip 2 (judges need proof).
4. Optional: 10s of `npm run demo:broll` terminal.
5. Export 1080p, YouTube public, English title: `Hearth — Alexa+ Family Concierge (MCP Demo)`.

---

## E) If Gemini asks for “negative prompt”

```text
No Amazon logo 3D models, no Echo device exact replica branding, no Netflix/Disney posters, no copyrighted characters, no purple neon cyberpunk, no unreadable lorem ipsum, no horror, no medical emergency, no watermark, no subtitles burned in (we'll add VO separately)
```
