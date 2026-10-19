import { MCP_PROTOCOL_VERSION } from "@hearth/shared";
import type { HearthMcpClient, ListedTool, ToolCallRecord } from "../mcpClient.js";

const RIVERA_PROFILE = {
  householdId: "hh-rivera",
  name: "Rivera Household",
  members: [
    { id: "m-maya", name: "Maya", role: "adult" },
    { id: "m-sofia", name: "Sofia", role: "child" },
    { id: "m-elena", name: "Elena", role: "elder" },
  ],
};

const PLAN = {
  id: "plan-cozy-classic",
  title: "Cozy captioned film night",
  summary: "A calm evening with captions for Elena.",
  activities: ["film", "snacks"],
  durationMinutes: 95,
  whyForMembers: ["Elena: large captions", "Sofia: early wind-down"],
  chips: ["captions", "low-stimulus"],
  timeline: [{ offsetMinutes: 0, label: "Settle in", forMembers: ["Maya", "Elena"] }],
  constraintWarnings: ["Sofia: school night — keep timeline tight"],
};

export function createMockMcp(
  overrides: Partial<{
    profile: typeof RIVERA_PROFILE;
    plans: (typeof PLAN)[];
    failTools: boolean;
  }> = {},
): HearthMcpClient {
  const profile = overrides.profile ?? RIVERA_PROFILE;
  const plans = overrides.plans ?? [PLAN];
  const calls: ToolCallRecord[] = [];

  const client = {
    mcpUrl: "http://127.0.0.1:3100/mcp",
    calls,
    async connect() {},
    async close() {},
    info() {
      return {
        mcpUrl: this.mcpUrl,
        protocolVersion: MCP_PROTOCOL_VERSION,
        transport: "streamable-http",
      };
    },
    async listTools(): Promise<ListedTool[]> {
      if (overrides.failTools) throw new Error("MCP down");
      return [
        { name: "get_household_profile" },
        { name: "suggest_evening_plan" },
        { name: "confirm_plan" },
      ];
    },
    async callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolCallRecord> {
      let result: unknown;
      switch (name) {
        case "set_active_household":
          result = { active: args.householdKey, ok: true };
          break;
        case "get_household_profile":
          result = profile;
          break;
        case "list_households":
          result = [
            { id: "rivera", label: "Rivera family", blurb: "Kids + grandma", active: true },
            { id: "park", label: "Park apartment", blurb: "Two adults", active: false },
            { id: "okonkwo", label: "Okonkwo home", blurb: "Care-first", active: false },
          ];
          break;
        case "suggest_evening_plan":
          result = plans;
          break;
        case "confirm_plan":
          result = {
            planId: args.planId,
            option: plans.find((p) => p.id === args.planId) ?? plans[0],
            notes: args.notes,
          };
          break;
        case "create_reminder":
          result = { id: "rem-1", ...args };
          break;
        case "log_care_checkin":
          result = {
            id: "chk-1",
            memberId: args.memberId,
            memberName: profile.members.find((m) => m.role === "elder")?.name ?? "Elder",
            status: args.status,
            notes: args.notes,
          };
          break;
        case "get_plan_visual":
          result = {
            kind: "hearth.plan_card",
            title: PLAN.title,
            html: "<article>plan</article>",
          };
          break;
        case "get_evening_state":
          result = {
            householdName: profile.name,
            confirmedPlan: { planId: PLAN.id },
            reminders: [{ title: "Start", when: "in 15 minutes" }],
            checkins: [],
            turnLog: [],
          };
          break;
        default:
          result = {};
      }
      const record = { name, arguments: args, result };
      calls.push(record);
      return record;
    },
    async listResources() {
      return [
        { uri: "hearth://protocol", name: "hearth-protocol" },
        { uri: "hearth://household", name: "hearth-household" },
      ];
    },
    async readResource(uri: string) {
      return { uri, result: { mock: true, uri } };
    },
    async listPrompts() {
      return [
        { name: "evening_briefing", description: "Spoken briefing" },
        { name: "care_checkin_script", description: "Care script" },
      ];
    },
    async getPrompt(name: string, args: Record<string, string> = {}) {
      return {
        name,
        result: {
          messages: [
            { role: "user", content: { type: "text", text: `${name} ${JSON.stringify(args)}` } },
          ],
        },
      };
    },
  };

  return client as unknown as HearthMcpClient & { calls: ToolCallRecord[] };
}

export function mockCalls(mcp: HearthMcpClient): ToolCallRecord[] {
  return (mcp as unknown as { calls: ToolCallRecord[] }).calls;
}
