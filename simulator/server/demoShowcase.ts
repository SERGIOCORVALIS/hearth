import { HEARTH_TOOLS } from "@hearth/shared";
import type { HearthMcpClient, ToolCallRecord } from "./mcpClient.js";
import { retrieveKnowledge, type KnowledgeHit } from "./knowledge.js";

export type SurfaceCall = {
  kind: "resource" | "prompt" | "list";
  name: string;
  result: unknown;
};

export type McpCoverage = {
  toolsExpected: string[];
  toolsHit: string[];
  resourcesExpected: string[];
  resourcesHit: string[];
  promptsExpected: string[];
  promptsHit: string[];
  listsHit: string[];
  complete: boolean;
};

type ShowcaseResult = {
  reply: string;
  mode: "offline";
  toolCalls: ToolCallRecord[];
  planCard: unknown | null;
  eveningState: unknown | null;
  visualCard: unknown | null;
  planOptions?: Array<{
    id: string;
    title: string;
    summary: string;
    activities?: string[];
    durationMinutes?: number;
  }>;
  latencyMs: number;
  knowledgeHits?: KnowledgeHit[];
  awsServices?: string[];
  surfaceCalls: SurfaceCall[];
  mcpCoverage?: McpCoverage;
};

export const MCP_RESOURCE_URIS = [
  "hearth://protocol",
  "hearth://household",
  "hearth://evening-state",
  "hearth://scenarios",
  "hearth://schemas/plan-card",
  "hearth://plan-card",
] as const;

export const MCP_PROMPT_NAMES = ["evening_briefing", "care_checkin_script"] as const;

function buildCoverage(toolCalls: ToolCallRecord[], surfaceCalls: SurfaceCall[]): McpCoverage {
  const toolsHit = [...new Set(toolCalls.map((t) => t.name))];
  const resourcesHit = surfaceCalls
    .filter((c) => c.kind === "resource" && !(c.result as { error?: string })?.error)
    .map((c) => c.name);
  const promptsHit = surfaceCalls
    .filter((c) => c.kind === "prompt" && !(c.result as { error?: string })?.error)
    .map((c) => c.name);
  const listsHit = surfaceCalls.filter((c) => c.kind === "list").map((c) => c.name);
  const toolsExpected = [...HEARTH_TOOLS];
  const resourcesExpected = [...MCP_RESOURCE_URIS];
  const promptsExpected = [...MCP_PROMPT_NAMES];
  const complete =
    toolsExpected.every((t) => toolsHit.includes(t)) &&
    resourcesExpected.every((r) => resourcesHit.includes(r)) &&
    promptsExpected.every((p) => promptsHit.includes(p)) &&
    ["tools/list", "resources/list", "prompts/list"].every((l) => listsHit.includes(l));

  return {
    toolsExpected,
    toolsHit,
    resourcesExpected,
    resourcesHit,
    promptsExpected,
    promptsHit,
    listsHit,
    complete,
  };
}

export function isSurfaceShowcase(message: string): boolean {
  return /DEMO_SHOWCASE_SURFACE|list every (hearth )?mcp|mcp surface tour|show all hearth/i.test(
    message,
  );
}

export function isEveningBriefingDemo(message: string): boolean {
  return /DEMO_EVENING_BRIEFING|speak the alexa\+ evening briefing|evening briefing for tonight/i.test(
    message,
  );
}

export function isCareScriptDemo(message: string): boolean {
  return /DEMO_CARE_SCRIPT|care check-in spoken script|run the care check-in script/i.test(message);
}

export function isAlternatePlan(message: string): boolean {
  return /alternate evening plan|next suggested plan|try the alternate/i.test(message);
}

/**
 * Wires every MCP connection Hearth ships: tools/list, all 9 tools,
 * resources/list + every hearth:// URI, prompts/list + both prompts.
 * No Echo Show hardware — the simulator is the display for Alexa+ judges.
 */
export async function runSurfaceShowcase(
  mcp: HearthMcpClient,
  householdKey: string | null | undefined,
  started: number,
): Promise<ShowcaseResult> {
  const toolCalls: ToolCallRecord[] = [];
  const surfaceCalls: SurfaceCall[] = [];
  const knowledgeHits = retrieveKnowledge("elder care captions accessibility Alexa+", 3);
  const activeKey = householdKey ?? "rivera";

  const tools = await mcp.listTools();
  surfaceCalls.push({
    kind: "list",
    name: "tools/list",
    result: tools.map((t) => t.name),
  });

  toolCalls.push(await mcp.callTool("set_active_household", { householdKey: activeKey }));
  toolCalls.push(await mcp.callTool("list_households", {}));
  const profile = await mcp.callTool("get_household_profile", {});
  toolCalls.push(profile);
  const elder = (
    profile.result as { members?: Array<{ id: string; name: string; role: string }> }
  ).members?.find((m) => m.role === "elder");

  const suggestions = await mcp.callTool("suggest_evening_plan", {
    mood: "cozy",
    durationMinutes: 90,
    includeKids: true,
    includeElder: true,
  });
  toolCalls.push(suggestions);
  const options = Array.isArray(suggestions.result)
    ? (suggestions.result as Array<{ id: string; title: string; summary: string }>)
    : [];
  const chosen = options[0];

  let planCard: unknown | null = null;
  let visualCard: unknown | null = null;
  if (chosen) {
    const confirmed = await mcp.callTool("confirm_plan", {
      planId: chosen.id,
      notes: "Wired during full MCP connection demo",
    });
    toolCalls.push(confirmed);
    planCard = confirmed.result;

    toolCalls.push(
      await mcp.callTool("create_reminder", {
        title: `Start: ${chosen.title}`,
        when: "in 15 minutes",
        relatedPlanId: chosen.id,
        memberId: elder?.id ?? "elder",
      }),
    );

    toolCalls.push(
      await mcp.callTool("log_care_checkin", {
        memberId: elder?.name ?? "elder",
        status: "ok",
        notes: "Full MCP wire demo — care path connected.",
      }),
    );

    const visual = await mcp.callTool("get_plan_visual", { planId: chosen.id });
    toolCalls.push(visual);
    visualCard = visual.result;
  }

  const state = await mcp.callTool("get_evening_state", {});
  toolCalls.push(state);

  try {
    const resources = await mcp.listResources();
    surfaceCalls.push({ kind: "list", name: "resources/list", result: resources });
  } catch (error) {
    surfaceCalls.push({
      kind: "list",
      name: "resources/list",
      result: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  for (const uri of MCP_RESOURCE_URIS) {
    try {
      const read = await mcp.readResource(uri);
      surfaceCalls.push({ kind: "resource", name: uri, result: read.result });
    } catch (error) {
      surfaceCalls.push({
        kind: "resource",
        name: uri,
        result: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  try {
    const prompts = await mcp.listPrompts();
    surfaceCalls.push({ kind: "list", name: "prompts/list", result: prompts });
  } catch (error) {
    surfaceCalls.push({
      kind: "list",
      name: "prompts/list",
      result: { error: error instanceof Error ? error.message : String(error) },
    });
  }

  for (const promptName of MCP_PROMPT_NAMES) {
    try {
      const prompt = await mcp.getPrompt(promptName, {
        mood: "cozy",
        includeKids: "true",
        memberId: "elder",
      });
      surfaceCalls.push({ kind: "prompt", name: promptName, result: prompt.result });
    } catch (error) {
      surfaceCalls.push({
        kind: "prompt",
        name: promptName,
        result: { error: error instanceof Error ? error.message : String(error) },
      });
    }
  }

  const coverage = buildCoverage(toolCalls, surfaceCalls);
  const missingTools = coverage.toolsExpected.filter((t) => !coverage.toolsHit.includes(t));

  return {
    mode: "offline",
    toolCalls,
    planCard,
    visualCard,
    eveningState: state.result,
    planOptions: options,
    knowledgeHits,
    awsServices: ["hearth-care-kb:retrieve"],
    surfaceCalls,
    mcpCoverage: coverage,
    latencyMs: Math.round(performance.now() - started),
    reply: [
      "Full MCP connection demo — every Hearth wire live (no Echo Show required).",
      ``,
      `Tools hit: ${coverage.toolsHit.length}/${coverage.toolsExpected.length}` +
        (missingTools.length ? ` (missing: ${missingTools.join(", ")})` : " ✓"),
      `Resources: ${coverage.resourcesHit.length}/${coverage.resourcesExpected.length} · Prompts: ${coverage.promptsHit.length}/${coverage.promptsExpected.length}`,
      `Lists: ${coverage.listsHit.join(", ") || "—"}`,
      chosen ? `Plan card on display: ${chosen.title}` : "",
      coverage.complete
        ? "Coverage complete — Streamable HTTP tools + resources + prompts all connected."
        : "Partial coverage — check Judge toolkit for failed reads.",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function runEveningBriefingDemo(
  mcp: HearthMcpClient,
  householdKey: string | null | undefined,
  knowledgeHits: KnowledgeHit[],
  started: number,
): Promise<ShowcaseResult> {
  const toolCalls: ToolCallRecord[] = [];
  const surfaceCalls: SurfaceCall[] = [];

  if (householdKey) {
    toolCalls.push(await mcp.callTool("set_active_household", { householdKey }));
  }

  const prompt = await mcp.getPrompt("evening_briefing", {
    mood: "cozy",
    includeKids: "true",
  });
  surfaceCalls.push({ kind: "prompt", name: "evening_briefing", result: prompt.result });

  const profile = await mcp.callTool("get_household_profile", {});
  toolCalls.push(profile);
  const profileData = profile.result as {
    name?: string;
    members?: Array<{ name: string; role: string }>;
  };

  const suggestions = await mcp.callTool("suggest_evening_plan", {
    mood: "cozy",
    durationMinutes: 80,
    includeKids: true,
    includeElder: true,
  });
  toolCalls.push(suggestions);
  const options = Array.isArray(suggestions.result)
    ? (suggestions.result as Array<{
        id: string;
        title: string;
        summary: string;
        activities?: string[];
        durationMinutes?: number;
      }>)
    : [];
  const chosen = options[0];

  let planCard: unknown | null = null;
  let visualCard: unknown | null = null;
  if (chosen) {
    const confirmed = await mcp.callTool("confirm_plan", {
      planId: chosen.id,
      notes: "Confirmed during evening_briefing demo beat",
    });
    toolCalls.push(confirmed);
    planCard = confirmed.result;
    toolCalls.push(
      await mcp.callTool("create_reminder", {
        title: `Start: ${chosen.title}`,
        when: "in 10 minutes",
        relatedPlanId: chosen.id,
      }),
    );
    const visual = await mcp.callTool("get_plan_visual", { planId: chosen.id });
    toolCalls.push(visual);
    visualCard = visual.result;
  }

  const state = await mcp.callTool("get_evening_state", {});
  toolCalls.push(state);

  const names = (profileData.members ?? []).map((m) => m.name).join(", ");
  const tip = knowledgeHits[0]?.text;

  return {
    mode: "offline",
    toolCalls,
    planCard,
    visualCard,
    eveningState: state.result,
    planOptions: options,
    knowledgeHits,
    awsServices: ["hearth-care-kb:retrieve"],
    surfaceCalls,
    latencyMs: Math.round(performance.now() - started),
    reply: [
      `Evening briefing for ${profileData.name ?? "your household"} (${names}).`,
      chosen
        ? `Tonight we're doing **${chosen.title}** — ${chosen.summary}`
        : "I'll hold the room calm until we pick a plan.",
      tip ? `Care tip: ${tip}` : "",
      "Captions and warm lighting stay on for shared screens. I'll ping you when it's time to start.",
      "(Fetched MCP prompt evening_briefing, then ran the tool cascade the prompt describes.)",
    ]
      .filter(Boolean)
      .join("\n"),
  };
}

export async function runCareScriptDemo(
  mcp: HearthMcpClient,
  householdKey: string | null | undefined,
  knowledgeHits: KnowledgeHit[],
  started: number,
): Promise<ShowcaseResult> {
  const toolCalls: ToolCallRecord[] = [];
  const surfaceCalls: SurfaceCall[] = [];

  if (householdKey) {
    toolCalls.push(await mcp.callTool("set_active_household", { householdKey }));
  }

  const prompt = await mcp.getPrompt("care_checkin_script", { memberId: "elder" });
  surfaceCalls.push({ kind: "prompt", name: "care_checkin_script", result: prompt.result });

  const profile = await mcp.callTool("get_household_profile", {});
  toolCalls.push(profile);
  const elder = (
    profile.result as { members?: Array<{ id: string; name: string; role: string }> }
  ).members?.find((m) => m.role === "elder");

  const checkin = await mcp.callTool("log_care_checkin", {
    memberId: elder?.name ?? "elder",
    status: "ok",
    notes: "Spoken care script demo — calm tone, accessibility-aware.",
  });
  toolCalls.push(checkin);

  const state = await mcp.callTool("get_evening_state", {});
  toolCalls.push(state);

  return {
    mode: "offline",
    toolCalls,
    planCard: null,
    visualCard: null,
    eveningState: state.result,
    knowledgeHits,
    awsServices: ["hearth-care-kb:retrieve"],
    surfaceCalls,
    latencyMs: Math.round(performance.now() - started),
    reply: [
      `Care check-in script for ${elder?.name ?? "your elder"}.`,
      "Hi — just checking in. Are you comfortable? Captions and warm lighting are ready whenever we start.",
      "Logged status: okay. (MCP prompt care_checkin_script → log_care_checkin → get_evening_state.)",
    ].join(" "),
  };
}
