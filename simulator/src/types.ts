export type ChatMessage = {
  id: string;
  role: "user" | "assistant";
  text: string;
  mode?: "offline" | "bedrock";
};

export type ToolCall = {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

export type Scenario = {
  id: string;
  label: string;
  description: string;
  examplePrompt: string;
};

export type Household = {
  id: string;
  label: string;
  blurb: string;
  active?: boolean;
};

export type EveningState = {
  householdName?: string;
  reminders?: Array<{ title: string; when: string }>;
  checkins?: Array<{ memberName?: string; status: string; notes: string }>;
  turnLog?: Array<{ at: string; event: string; detail?: string }>;
  constraintWarnings?: string[];
  members?: Array<{ id: string; name: string; role: string }>;
};

export type VisualCard = {
  kind?: string;
  title?: string;
  subtitle?: string;
  durationMinutes?: number;
  chips?: string[];
  html?: string;
};

export type Health = {
  ok: boolean;
  agent?: string;
  tools?: string[];
  mcp?: { mcpUrl: string; protocolVersion: string; transport: string };
  latency?: { avgMs: number | null; maxMs: number | null; under500ms: boolean } | null;
  scenarios?: Scenario[];
  households?: Household[];
  error?: string;
};

export type PlanOption = {
  id: string;
  title: string;
  summary: string;
  durationMinutes?: number;
  activities?: string[];
  whyForMembers?: string[];
  chips?: string[];
  timeline?: Array<{ offsetMinutes: number; label: string; forMembers: string[] }>;
  constraintWarnings?: string[];
};

export type PlanCard = {
  planId?: string;
  option?: PlanOption & {
    visualCard?: { html?: string; chips?: string[] };
  };
};

export type KnowledgeHit = {
  id: string;
  title: string;
  source: string;
  text: string;
};

export type StatusPill = {
  label: string;
  value: string;
  kind: string;
};

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
