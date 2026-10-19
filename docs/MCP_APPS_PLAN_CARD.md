# MCP Apps — Hearth plan card schema

Alexa+ multimodal demos (Echo Show–style) can render Hearth’s visual evening plan.

## Resource

```text
hearth://schemas/plan-card
```

Returns JSON Schema + a concrete example (`kind: "hearth.plan_card"`).

Runtime card HTML for the confirmed plan:

```text
hearth://plan-card
```

Tool: `get_plan_visual`.

## Member targeting

Tools `log_care_checkin` and `create_reminder` accept `memberId` as:

| Form         | Example                              |
| ------------ | ------------------------------------ |
| Member id    | `m-elena`                            |
| Role alias   | `elder`, `child`, `adult`, `grandma` |
| Display name | `Elena`                              |

Care check-ins soft-fallback to the household elder when the ref is unknown and an elder exists.
