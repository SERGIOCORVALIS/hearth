/**
 * Terminal B-roll for the demo video: prints health + a live MCP tool sequence.
 * Run while recording window B: `npm run demo:broll`
 */
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const MCP_URL = process.env.MCP_URL ?? "http://127.0.0.1:3100/mcp";
const HEALTH = MCP_URL.replace(/\/mcp\/?$/, "/health");

function banner(title) {
  console.log("\n" + "═".repeat(56));
  console.log(` ${title}`);
  console.log("═".repeat(56));
}

async function sleep(ms) {
  await new Promise((r) => setTimeout(r, ms));
}

async function main() {
  banner("HEARTH MCP · Streamable HTTP · 2025-11-25");
  const health = await fetch(HEALTH).then((r) => r.json());
  console.log(JSON.stringify(health, null, 2));

  const client = new Client({ name: "demo-broll", version: "1.0.0" });
  const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
  await client.connect(transport);

  const preamble = [
    ["list_households", {}],
    ["set_active_household", { householdKey: "rivera" }],
    ["get_household_profile", {}],
    [
      "suggest_evening_plan",
      { mood: "cozy", durationMinutes: 90, includeKids: true, includeElder: true },
    ],
  ];

  let planId = "plan-cozy-classic";
  for (const [name, args] of preamble) {
    await sleep(800);
    banner(`tools/call → ${name}`);
    console.log("arguments:", JSON.stringify(args));
    const result = await client.callTool({ name, arguments: args });
    const text = Array.isArray(result.content)
      ? result.content.find((c) => c.type === "text")?.text
      : "";
    console.log((text ?? "").slice(0, 900));
    if (name === "suggest_evening_plan" && text) {
      try {
        const plans = JSON.parse(text);
        if (Array.isArray(plans) && plans[0]?.id) planId = plans[0].id;
      } catch {
        // keep fallback id
      }
    }
  }

  const rest = [
    ["confirm_plan", { planId, notes: "demo broll" }],
    ["create_reminder", { title: "Start cocoa", when: "in 15 minutes", relatedPlanId: planId }],
    ["log_care_checkin", { memberId: "elder", status: "ok", notes: "captions on" }],
    ["get_plan_visual", { planId }],
    ["get_evening_state", {}],
  ];

  for (const [name, args] of rest) {
    await sleep(800);
    banner(`tools/call → ${name}`);
    console.log("arguments:", JSON.stringify(args));
    const result = await client.callTool({ name, arguments: args });
    const text = Array.isArray(result.content)
      ? result.content.find((c) => c.type === "text")?.text
      : "";
    console.log((text ?? "").slice(0, 900));
  }

  banner("DONE — latency");
  const after = await fetch(HEALTH).then((r) => r.json());
  console.log(JSON.stringify(after.latency, null, 2));
  await transport.close().catch(() => undefined);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
