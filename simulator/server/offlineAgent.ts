import { SCENARIOS, type ScenarioId } from "@hearth/shared";
import type { HearthMcpClient, ToolCallRecord } from "./mcpClient.js";
import { retrieveKnowledge, type KnowledgeHit } from "./knowledge.js";
import {
  isAlternatePlan,
  isCareScriptDemo,
  isEveningBriefingDemo,
  isSurfaceShowcase,
  runCareScriptDemo,
  runEveningBriefingDemo,
  runSurfaceShowcase,
  type McpCoverage,
  type SurfaceCall,
} from "./demoShowcase.js";

type PlanOption = {
  id: string;
  title: string;
  summary: string;
  activities?: string[];
  whyForMembers?: string[];
  chips?: string[];
  timeline?: Array<{ offsetMinutes: number; label: string; forMembers: string[] }>;
  durationMinutes?: number;
  constraintWarnings?: string[];
  visualCard?: unknown;
};

export type AgentTurnResult = {
  reply: string;
  mode: "offline" | "bedrock";
  toolCalls: ToolCallRecord[];
  planCard: unknown | null;
  eveningState: unknown | null;
  visualCard: unknown | null;
  planOptions?: PlanOption[];
  latencyMs: number;
  knowledgeHits?: KnowledgeHit[];
  awsServices?: string[];
  surfaceCalls?: SurfaceCall[];
  mcpCoverage?: McpCoverage;
};

function wantsPlan(message: string): boolean {
  return /plan|evening|tonight|family|kids|grandma|watch|activity|low-key|cozy|what should|creative|weeknight|weekend|accessible|stretch|film|wind-down|no screens|adults-only|adults only/i.test(
    message,
  );
}

function wantsCheckin(message: string): boolean {
  return /check[- ]?in|care check|how is (she|elena|ngozi)|wellbeing/i.test(message);
}

function checkinStatus(message: string): "ok" | "needs_attention" | "resting" {
  if (/needs[_ ]?attention|not (ok|well)/i.test(message)) return "needs_attention";
  if (/resting|tired|sleepy/i.test(message)) return "resting";
  return "ok";
}

function checkinMemberRef(message: string, elderId?: string): string {
  if (/grandma|elena|ngozi|elder/i.test(message)) {
    const named = message.match(/\b(elena|ngozi|grandma|elder)\b/i);
    return named?.[1] ?? elderId ?? "elder";
  }
  return elderId ?? "elder";
}

function wantsReminder(message: string): boolean {
  return /set (a )?reminder|remind (me|us)|create reminder/i.test(message);
}

function switchPlanId(message: string): string | null {
  const match = message.match(/\b(plan-[\w-]+)\b/i);
  if (!match) return null;
  if (/use plan|switch to|try plan|confirm plan|pick plan|choose plan/i.test(message)) {
    return match[1].toLowerCase();
  }
  return null;
}

function resolveScenario(
  message: string,
  scenarioId?: ScenarioId | null,
): (typeof SCENARIOS)[number] | null {
  if (scenarioId) {
    return SCENARIOS.find((s) => s.id === scenarioId) ?? null;
  }
  if (/weeknight|school night|45 minute|only have/i.test(message)) {
    return SCENARIOS.find((s) => s.id === "busy-weeknight") ?? null;
  }
  if (/grandma is visiting|elder|care focus|accessible evening|ngozi/i.test(message)) {
    return SCENARIOS.find((s) => s.id === "elder-visiting") ?? null;
  }
  if (/weekend/i.test(message)) {
    return SCENARIOS.find((s) => s.id === "weekend") ?? null;
  }
  return null;
}

async function finalizePlan(
  mcp: HearthMcpClient,
  toolCalls: ToolCallRecord[],
  chosen: PlanOption,
  options: PlanOption[],
  opts: {
    householdName: string;
    scenario: (typeof SCENARIOS)[number] | null;
    durationMinutes: number;
    includeElder: boolean;
    hasElder: boolean;
    elderId?: string;
    knowledgeHits: KnowledgeHit[];
    started: number;
    notes: string;
  },
): Promise<AgentTurnResult> {
  const confirmed = await mcp.callTool("confirm_plan", {
    planId: chosen.id,
    notes: opts.notes,
  });
  toolCalls.push(confirmed);
  const planCard = confirmed.result as { option?: PlanOption; planId?: string };
  const active = planCard.option ?? chosen;

  const reminder = await mcp.callTool("create_reminder", {
    title: `Start: ${active.title}`,
    when: opts.scenario?.id === "busy-weeknight" ? "in 5 minutes" : "in 15 minutes",
    relatedPlanId: active.id,
  });
  toolCalls.push(reminder);

  if (opts.includeElder || opts.hasElder) {
    toolCalls.push(
      await mcp.callTool("log_care_checkin", {
        memberId: opts.elderId ?? "elder",
        status: "ok",
        notes: "Included in family evening; captions and warm lighting enabled.",
      }),
    );
  }

  const visual = await mcp.callTool("get_plan_visual", { planId: active.id });
  toolCalls.push(visual);
  const visualCard = visual.result;

  const state = await mcp.callTool("get_evening_state", {});
  toolCalls.push(state);
  const eveningState = state.result;

  const why = (active.whyForMembers ?? []).map((w) => `• ${w}`).join("\n");
  const warnings = (active.constraintWarnings ?? []).map((w) => `⚠ ${w}`).join("\n");
  const timeline = (active.timeline ?? [])
    .map((t) => `• T+${t.offsetMinutes}m — ${t.label}`)
    .join("\n");

  const careTip = opts.knowledgeHits
    .slice(0, 2)
    .map((h) => `• ${h.title}: ${h.text}`)
    .join("\n");

  const alternates = options
    .filter((o) => o.id !== active.id)
    .map((o) => `• ${o.title} (${o.id})`)
    .join("\n");

  const reply = [
    opts.scenario
      ? `Got it — “${opts.scenario.label}” for ${opts.householdName}.`
      : `Sure — planned tonight for ${opts.householdName}.`,
    ``,
    `**${active.title}** (${active.durationMinutes ?? opts.durationMinutes} min)`,
    active.summary,
    why ? `\nWhy this fits:\n${why}` : "",
    warnings ? `\nWatch-outs:\n${warnings}` : "",
    timeline ? `\nTimeline:\n${timeline}` : "",
    careTip ? `\nCare guidance:\n${careTip}` : "",
    alternates ? `\nOther options you can switch to:\n${alternates}` : "",
    ``,
    `I confirmed the plan, set a reminder, updated the visual plan card, and logged a care check-in where needed.`,
  ]
    .filter(Boolean)
    .join("\n");

  return {
    mode: "offline",
    toolCalls,
    planCard,
    visualCard,
    eveningState,
    planOptions: options,
    knowledgeHits: opts.knowledgeHits,
    awsServices: ["hearth-care-kb:retrieve"],
    reply,
    latencyMs: Math.round(performance.now() - opts.started),
  };
}

export async function runOfflineAgent(
  mcp: HearthMcpClient,
  userMessage: string,
  scenarioId?: ScenarioId | null,
  householdKey?: string | null,
): Promise<AgentTurnResult> {
  const started = performance.now();
  const toolCalls: ToolCallRecord[] = [];
  const knowledgeHits = retrieveKnowledge(userMessage, 3);
  const scenario = resolveScenario(userMessage, scenarioId);

  if (isSurfaceShowcase(userMessage)) {
    return (await runSurfaceShowcase(mcp, householdKey, started)) as AgentTurnResult;
  }
  if (isEveningBriefingDemo(userMessage)) {
    return (await runEveningBriefingDemo(
      mcp,
      householdKey,
      knowledgeHits,
      started,
    )) as AgentTurnResult;
  }
  if (isCareScriptDemo(userMessage)) {
    return (await runCareScriptDemo(mcp, householdKey, knowledgeHits, started)) as AgentTurnResult;
  }

  if (householdKey) {
    toolCalls.push(await mcp.callTool("set_active_household", { householdKey }));
  }

  const profile = await mcp.callTool("get_household_profile", {});
  toolCalls.push(profile);
  const profileData = profile.result as {
    name?: string;
    members?: Array<{ id: string; name: string; role: string }>;
  };
  const householdName = profileData.name ?? "your household";
  const elder = profileData.members?.find((m) => m.role === "elder");

  if (isAlternatePlan(userMessage)) {
    const hasKids = (profileData.members ?? []).some((m) => m.role === "child");
    const hasElder = Boolean(elder);
    const suggestions = await mcp.callTool("suggest_evening_plan", {
      mood: scenario?.mood ?? "cozy",
      durationMinutes: scenario?.durationMinutes ?? 90,
      includeKids: scenario?.includeKids ?? hasKids,
      includeElder: scenario?.includeElder ?? hasElder,
    });
    toolCalls.push(suggestions);
    const options = Array.isArray(suggestions.result) ? (suggestions.result as PlanOption[]) : [];
    const chosen = options[1] ?? options[0];
    if (!chosen) {
      return {
        mode: "offline",
        toolCalls,
        planCard: null,
        visualCard: null,
        eveningState: null,
        knowledgeHits,
        awsServices: ["hearth-care-kb:retrieve"],
        latencyMs: Math.round(performance.now() - started),
        reply: `No alternate plan available for ${householdName} right now.`,
      };
    }
    return finalizePlan(mcp, toolCalls, chosen, options, {
      householdName,
      scenario,
      durationMinutes: scenario?.durationMinutes ?? 90,
      includeElder: hasElder,
      hasElder,
      elderId: elder?.id,
      knowledgeHits,
      started,
      notes: `Switched to alternate plan ${chosen.id}`,
    });
  }

  const pickedId = switchPlanId(userMessage);
  if (pickedId) {
    return finalizePlan(
      mcp,
      toolCalls,
      {
        id: pickedId,
        title: pickedId,
        summary: "Switched from the alternate plan picker.",
        activities: [],
      },
      [],
      {
        householdName,
        scenario,
        durationMinutes: scenario?.durationMinutes ?? 90,
        includeElder: Boolean(elder),
        hasElder: Boolean(elder),
        elderId: elder?.id,
        knowledgeHits,
        started,
        notes: `Switched to ${pickedId} from UI`,
      },
    );
  }

  if (wantsCheckin(userMessage) && !wantsPlan(userMessage)) {
    const status = checkinStatus(userMessage);
    const memberRef = checkinMemberRef(userMessage, elder?.id);
    const checkin = await mcp.callTool("log_care_checkin", {
      memberId: memberRef,
      status,
      notes: "Gentle evening check-in; captions and warm lighting ready.",
    });
    toolCalls.push(checkin);
    const checkinResult = checkin.result as { memberName?: string; status?: string };
    const state = await mcp.callTool("get_evening_state", {});
    toolCalls.push(state);

    const tip = knowledgeHits[0]?.text;
    return {
      mode: "offline",
      toolCalls,
      planCard: null,
      visualCard: null,
      eveningState: state.result,
      knowledgeHits,
      awsServices: ["hearth-care-kb:retrieve"],
      latencyMs: Math.round(performance.now() - started),
      reply: [
        `I've logged a care check-in for ${checkinResult.memberName ?? elder?.name ?? "your elder"}.`,
        `Status: ${checkinResult.status ?? status}.`,
        tip ?? "I'll keep large captions and warm lighting on for any shared activity.",
        "Want me to build a calm family plan around that?",
      ].join(" "),
    };
  }

  if (wantsReminder(userMessage) && !/\bplan\b/i.test(userMessage)) {
    const reminder = await mcp.callTool("create_reminder", {
      title: "Evening wind-down",
      when: "in 20 minutes",
    });
    toolCalls.push(reminder);
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
      latencyMs: Math.round(performance.now() - started),
      reply: `Reminder set for ${householdName}: Evening wind-down in 20 minutes.`,
    };
  }

  const hasKids = (profileData.members ?? []).some((m) => m.role === "child");
  const hasElder = Boolean(elder);
  let includeKids = scenario?.includeKids ?? hasKids;
  let includeElder = scenario?.includeElder ?? hasElder;
  let mood = scenario?.mood ?? "low-key";
  const durationMinutes = scenario?.durationMinutes ?? 90;

  if (/no kids|after kids|adults only|adults-only|wind-down/i.test(userMessage)) {
    includeKids = false;
  }
  if (/without grandma|no elder/i.test(userMessage)) includeElder = false;
  if (/active|dance|stretch/i.test(userMessage)) mood = "active";
  else if (/creative|lego|draw|without screens|no screens/i.test(userMessage)) mood = "creative";
  else if (/game|play/i.test(userMessage)) mood = "playful";
  else if (/quiet|calm|cozy|low-key|relaxed|accessible|film/i.test(userMessage)) mood = "cozy";

  if (!hasKids) includeKids = false;
  if (!hasElder) includeElder = false;

  const suggestions = await mcp.callTool("suggest_evening_plan", {
    mood,
    durationMinutes,
    includeKids,
    includeElder,
  });
  toolCalls.push(suggestions);

  const options = Array.isArray(suggestions.result) ? (suggestions.result as PlanOption[]) : [];
  const chosen = options[0];
  if (!chosen) {
    return {
      mode: "offline",
      toolCalls,
      planCard: null,
      visualCard: null,
      eveningState: null,
      knowledgeHits,
      awsServices: ["hearth-care-kb:retrieve"],
      latencyMs: Math.round(performance.now() - started),
      reply: `I checked ${householdName}, but couldn't find a matching plan. Try another scenario or household.`,
    };
  }

  return finalizePlan(mcp, toolCalls, chosen, options, {
    householdName,
    scenario,
    durationMinutes,
    includeElder,
    hasElder,
    elderId: elder?.id,
    knowledgeHits,
    started,
    notes: scenario
      ? `Confirmed via scenario ${scenario.id}`
      : "Confirmed by Hearth offline Alexa+ simulator",
  });
}
