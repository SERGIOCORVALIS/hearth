import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  MCP_PROTOCOL_VERSION,
  PLAN_CARD_EXAMPLE,
  PLAN_CARD_SCHEMA,
  SCENARIOS,
} from "@hearth/shared";
import { store } from "./store.js";
import { timed } from "./metrics.js";

function textResult(data: unknown) {
  return {
    content: [
      {
        type: "text" as const,
        text: JSON.stringify(data, null, 2),
      },
    ],
  };
}

export function createHearthServer(): McpServer {
  const server = new McpServer({
    name: "hearth-family-concierge",
    version: "1.2.0",
  });

  server.tool(
    "get_household_profile",
    "Return the active household members, preferences, constraints, accessibility notes, and available presets.",
    {},
    async () => timed("get_household_profile", () => textResult(store.getHouseholdProfile())),
  );

  server.tool(
    "list_households",
    "List demo household presets (Rivera, Park, Okonkwo) and which one is active.",
    {},
    async () => timed("list_households", () => textResult(store.listHouseholds())),
  );

  server.tool(
    "set_active_household",
    "Switch the active household preset. Clears tonight's plan/reminders/check-ins.",
    {
      householdKey: z
        .enum(["rivera", "park", "okonkwo"])
        .describe("Preset key: rivera | park | okonkwo"),
    },
    async ({ householdKey }) =>
      timed("set_active_household", () => textResult(store.setActiveHousehold(householdKey))),
  );

  server.tool(
    "suggest_evening_plan",
    "Suggest personalized evening plans with why-for-member notes, chips, timeline, constraint warnings, and visualCard HTML payload.",
    {
      mood: z.string().optional(),
      durationMinutes: z.number().int().positive().optional(),
      includeKids: z.boolean().optional(),
      includeElder: z.boolean().optional(),
    },
    async (args) => timed("suggest_evening_plan", () => textResult(store.suggestEveningPlan(args))),
  );

  server.tool(
    "create_reminder",
    "Create a reminder or timer related to the evening plan. Optional memberId: member id, role (elder|child|adult), or display name.",
    {
      title: z.string(),
      when: z.string(),
      relatedPlanId: z.string().optional(),
      memberId: z
        .string()
        .optional()
        .describe("Target member: id, role alias (elder|child|adult|grandma), or name"),
    },
    async (args) => timed("create_reminder", () => textResult(store.createReminder(args))),
  );

  server.tool(
    "log_care_checkin",
    "Log a gentle accessibility / elder-care check-in. memberId: member id, role (elder|child|adult|grandma), or display name. Unknown refs soft-fallback to elder when present.",
    {
      memberId: z
        .string()
        .describe("Member id, role alias (elder|child|adult|grandma), or display name"),
      status: z.enum(["ok", "needs_attention", "resting"]),
      notes: z.string(),
    },
    async (args) => timed("log_care_checkin", () => textResult(store.logCareCheckin(args))),
  );

  server.tool(
    "confirm_plan",
    "Confirm a plan by id. Returns the plan including MCP Apps-style visualCard.",
    {
      planId: z.string(),
      notes: z.string().optional(),
    },
    async (args) => timed("confirm_plan", () => textResult(store.confirmPlan(args))),
  );

  server.tool(
    "get_evening_state",
    "Return tonight's confirmed plan, reminders, care check-ins, constraint warnings, and turn log.",
    {},
    async () => timed("get_evening_state", () => textResult(store.getEveningState())),
  );

  server.tool(
    "get_plan_visual",
    "Return the MCP Apps-style visual plan card (HTML + structured fields) for a plan id or the confirmed plan.",
    {
      planId: z.string().optional(),
    },
    async ({ planId }) => timed("get_plan_visual", () => textResult(store.getPlanVisual(planId))),
  );

  server.resource(
    "hearth-protocol",
    "hearth://protocol",
    {
      description: `Hearth MCP protocol metadata (${MCP_PROTOCOL_VERSION})`,
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              name: "Hearth Family Concierge",
              protocolVersion: MCP_PROTOCOL_VERSION,
              transport: "streamable-http",
              endpoint: "/mcp",
              alexaPlusLatencyTargetMs: 500,
              tools: [
                "get_household_profile",
                "list_households",
                "set_active_household",
                "suggest_evening_plan",
                "create_reminder",
                "log_care_checkin",
                "confirm_plan",
                "get_evening_state",
                "get_plan_visual",
              ],
              resources: [
                "hearth://protocol",
                "hearth://household",
                "hearth://evening-state",
                "hearth://scenarios",
                "hearth://plan-card",
                "hearth://schemas/plan-card",
              ],
              memberIdResolution: [
                "member id (e.g. m-elena)",
                "role alias (elder|child|adult|grandma)",
                "display name",
              ],
              prompts: ["evening_briefing", "care_checkin_script"],
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.resource(
    "hearth-household",
    "hearth://household",
    { description: "Active household profile", mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(store.getHouseholdProfile(), null, 2),
        },
      ],
    }),
  );

  server.resource(
    "hearth-evening-state",
    "hearth://evening-state",
    { description: "Tonight's state + turn log", mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(store.getEveningState(), null, 2),
        },
      ],
    }),
  );

  server.resource(
    "hearth-scenarios",
    "hearth://scenarios",
    { description: "Scenario presets", mimeType: "application/json" },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(SCENARIOS, null, 2),
        },
      ],
    }),
  );

  server.resource(
    "hearth-plan-card",
    "hearth://plan-card",
    {
      description: "MCP Apps-style visual plan card (HTML) for the confirmed plan",
      mimeType: "text/html",
    },
    async (uri) => {
      try {
        const card = store.getPlanVisual();
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/html",
              text: card.html,
            },
          ],
        };
      } catch {
        return {
          contents: [
            {
              uri: uri.href,
              mimeType: "text/html",
              text: "<p>No confirmed plan yet. Call confirm_plan first.</p>",
            },
          ],
        };
      }
    },
  );

  server.resource(
    "hearth-plan-card-schema",
    "hearth://schemas/plan-card",
    {
      description: "JSON Schema + example for MCP Apps-style Hearth plan cards (Echo Show demos)",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              schema: PLAN_CARD_SCHEMA,
              example: PLAN_CARD_EXAMPLE,
              notes: [
                "Prefer structured fields for native renderers; use html for WebView displays.",
                "HTML must be escaped (Hearth store uses escapeHtml before templating).",
              ],
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.prompt(
    "evening_briefing",
    "Draft a spoken Alexa+ briefing for tonight's family evening plan",
    {
      mood: z.string().optional(),
      includeKids: z.string().optional(),
    },
    async ({ mood, includeKids }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "You are Hearth on Alexa+. Create a warm 4–6 sentence evening briefing.",
              "Call get_household_profile and suggest_evening_plan first.",
              `Mood hint: ${mood ?? "low-key"}. Include kids: ${includeKids ?? "true"}.`,
              "Name members explicitly. Mention captions/accessibility.",
              "Confirm a plan, create a reminder, then fetch get_plan_visual for the display card.",
            ].join(" "),
          },
        },
      ],
    }),
  );

  server.prompt(
    "care_checkin_script",
    "Spoken script for a gentle elder-care check-in",
    {
      memberId: z.string().optional(),
    },
    async ({ memberId }) => ({
      messages: [
        {
          role: "user" as const,
          content: {
            type: "text" as const,
            text: [
              "You are Hearth on Alexa+. Perform a gentle care check-in.",
              `Use log_care_checkin for member ${memberId ?? "elder"}.`,
              "Keep language calm and accessibility-aware. Then call get_evening_state.",
            ].join(" "),
          },
        },
      ],
    }),
  );

  return server;
}
