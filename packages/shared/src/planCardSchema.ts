/**
 * MCP Apps–style visual plan card schema (hackathon example).
 * Echo Show / multimodal demos can render `html` or the structured fields.
 */
export const PLAN_CARD_SCHEMA = {
  $schema: "https://json-schema.org/draft/2020-12/schema",
  $id: "hearth://schemas/plan-card",
  title: "HearthPlanCard",
  type: "object",
  required: ["kind", "title", "durationMinutes", "html"],
  properties: {
    kind: { const: "hearth.plan_card" },
    title: { type: "string" },
    subtitle: { type: "string" },
    durationMinutes: { type: "integer", minimum: 1 },
    chips: { type: "array", items: { type: "string" } },
    timeline: {
      type: "array",
      items: {
        type: "object",
        required: ["offsetMinutes", "label", "forMembers"],
        properties: {
          offsetMinutes: { type: "integer", minimum: 0 },
          label: { type: "string" },
          forMembers: { type: "array", items: { type: "string" } },
        },
      },
    },
    whyForMembers: { type: "array", items: { type: "string" } },
    accessibilityNotes: { type: "array", items: { type: "string" } },
    html: {
      type: "string",
      description: "Escaped HTML snippet safe for a display WebView",
    },
  },
  additionalProperties: false,
} as const;

export const PLAN_CARD_EXAMPLE = {
  kind: "hearth.plan_card",
  title: "Captioned Classic + Cocoa",
  subtitle: "Rivera · cozy · 95m",
  durationMinutes: 95,
  chips: ["Large captions", "Low stimulus", "Wind-down"],
  timeline: [
    { offsetMinutes: 0, label: "Cocoa", forMembers: ["Maya", "Elena"] },
    { offsetMinutes: 15, label: "Classic film (captioned)", forMembers: ["Everyone"] },
    { offsetMinutes: 90, label: "Wind-down", forMembers: ["Sofia"] },
  ],
  whyForMembers: [
    "Elena: large captions, no sudden loud audio",
    "Sofia: early wind-down before school",
  ],
  accessibilityNotes: ["Prefer seated seating near the screen", "Captions on by default"],
  html: '<article class="hearth-plan-card"><h2>Captioned Classic + Cocoa</h2></article>',
} as const;
