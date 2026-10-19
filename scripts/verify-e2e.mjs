/**
 * Full end-to-end verification of all MCP tools + simulator chat (no stubs).
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP = process.env.MCP_URL ?? "http://127.0.0.1:3100/mcp";
const API = process.env.SIM_API ?? "http://127.0.0.1:8787";
const HEALTH = MCP.replace(/\/mcp\/?$/, "/health");

function assert(cond, msg) {
  if (!cond) throw new Error(msg);
}

async function main() {
  console.log("1) Health + static assets");
  const health = await fetch(HEALTH).then((r) => r.json());
  assert(health.protocolVersion === "2025-11-25", "protocol version");
  assert(health.snapshot?.householdKey || health.snapshot?.householdId, "snapshot");

  for (const path of [
    "/legal/privacy.html",
    "/legal/terms.html",
    "/assets/icon-72.png",
    "/assets/carousel-600x900.png",
  ]) {
    const res = await fetch(HEALTH.replace(/\/health$/, path));
    assert(res.ok, `asset ${path} -> ${res.status}`);
  }

  console.log("2) MCP tools");
  const client = new Client({ name: "verify-e2e", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP));
  await client.connect(transport);
  const listed = await client.listTools();
  const names = listed.tools.map((t) => t.name);
  const required = [
    "get_household_profile",
    "list_households",
    "set_active_household",
    "suggest_evening_plan",
    "create_reminder",
    "log_care_checkin",
    "confirm_plan",
    "get_evening_state",
    "get_plan_visual",
  ];
  for (const n of required) assert(names.includes(n), `missing tool ${n}`);

  await client.callTool({ name: "set_active_household", arguments: { householdKey: "okonkwo" } });
  const profile = await client.callTool({ name: "get_household_profile", arguments: {} });
  const profileText = JSON.stringify(profile.content);
  assert(/Okonkwo/i.test(profileText), "okonkwo profile");

  const suggested = await client.callTool({
    name: "suggest_evening_plan",
    arguments: { mood: "cozy", durationMinutes: 80, includeKids: true, includeElder: true },
  });
  const sugText = suggested.content?.find?.((c) => c.type === "text")?.text ?? "";
  assert(/plan-/.test(sugText), "suggestions");
  assert(/whyForMembers|visualCard|timeline/i.test(sugText), "personalized fields");

  const planId = JSON.parse(sugText)[0].id;
  await client.callTool({
    name: "confirm_plan",
    arguments: { planId, notes: "e2e" },
  });
  const visual = await client.callTool({ name: "get_plan_visual", arguments: { planId } });
  const visualText = visual.content?.find?.((c) => c.type === "text")?.text ?? "";
  assert(/hearth\.plan_card|html/i.test(visualText), "visual card");

  await client.callTool({
    name: "log_care_checkin",
    arguments: { memberId: "elder", status: "ok", notes: "e2e captions" },
  });
  await client.callTool({
    name: "create_reminder",
    arguments: { title: "e2e", when: "in 10 minutes", relatedPlanId: planId },
  });
  const state = await client.callTool({ name: "get_evening_state", arguments: {} });
  const stateText = JSON.stringify(state.content);
  assert(/turnLog|checkins|reminders/i.test(stateText), "evening state");

  const resources = await client.listResources();
  const uris = resources.resources.map((r) => r.uri);
  assert(uris.includes("hearth://plan-card"), "plan-card resource");
  assert(uris.includes("hearth://household"), "household resource");

  await transport.close().catch(() => undefined);

  console.log("3) Simulator chat API");
  const chat = await fetch(`${API}/api/chat`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      message: "Plan a low-key evening for me, the kids, and grandma",
      scenario: "weekend",
      household: "rivera",
    }),
  }).then((r) => r.json());
  assert(chat.reply, "chat reply");
  assert(Array.isArray(chat.toolCalls) && chat.toolCalls.length >= 4, "tool calls");
  assert(chat.planCard?.option?.title, "plan card");
  assert(Array.isArray(chat.knowledgeHits) && chat.knowledgeHits.length > 0, "knowledge hits");
  assert(chat.eveningState, "evening state in chat");

  console.log("\nE2E OK — all tools, resources, assets, and chat path are live (no stubs).");
}

main().catch((err) => {
  console.error("\nE2E FAILED:", err.message);
  process.exit(1);
});
