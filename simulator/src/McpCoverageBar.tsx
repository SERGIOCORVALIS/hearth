import type { McpCoverage, SurfaceCall, ToolCall } from "./types";

const FALLBACK_TOOLS = [
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

const FALLBACK_RESOURCES = [
  "hearth://protocol",
  "hearth://household",
  "hearth://evening-state",
  "hearth://scenarios",
  "hearth://schemas/plan-card",
  "hearth://plan-card",
];

const FALLBACK_PROMPTS = ["evening_briefing", "care_checkin_script"];

type Props = {
  coverage: McpCoverage | null;
  toolCalls: ToolCall[];
  surfaceCalls: SurfaceCall[];
};

export function McpCoverageBar({ coverage, toolCalls, surfaceCalls }: Props) {
  const toolsExpected = coverage?.toolsExpected ?? FALLBACK_TOOLS;
  const resourcesExpected = coverage?.resourcesExpected ?? FALLBACK_RESOURCES;
  const promptsExpected = coverage?.promptsExpected ?? FALLBACK_PROMPTS;

  const toolsHit = new Set([...(coverage?.toolsHit ?? []), ...toolCalls.map((t) => t.name)]);
  const resourcesHit = new Set([
    ...(coverage?.resourcesHit ?? []),
    ...surfaceCalls.filter((c) => c.kind === "resource").map((c) => c.name),
  ]);
  const promptsHit = new Set([
    ...(coverage?.promptsHit ?? []),
    ...surfaceCalls.filter((c) => c.kind === "prompt").map((c) => c.name),
  ]);
  const listsHit = new Set([
    ...(coverage?.listsHit ?? []),
    ...surfaceCalls.filter((c) => c.kind === "list").map((c) => c.name),
  ]);

  const toolScore = toolsExpected.filter((t) => toolsHit.has(t)).length;
  const resourceScore = resourcesExpected.filter((r) => resourcesHit.has(r)).length;
  const promptScore = promptsExpected.filter((p) => promptsHit.has(p)).length;
  const listScore = ["tools/list", "resources/list", "prompts/list"].filter((l) =>
    listsHit.has(l),
  ).length;
  const complete =
    toolScore === toolsExpected.length &&
    resourceScore === resourcesExpected.length &&
    promptScore === promptsExpected.length &&
    listScore === 3;

  return (
    <section className={`mcp-coverage ${complete ? "complete" : ""}`} aria-label="MCP coverage">
      <div className="mcp-coverage-head">
        <strong>MCP connections</strong>
        <span>
          {complete
            ? "All wires live"
            : `${toolScore + resourceScore + promptScore + listScore} / ${toolsExpected.length + resourcesExpected.length + promptsExpected.length + 3}`}
        </span>
      </div>
      <div className="mcp-coverage-grid">
        <div>
          <span className="row-label">
            Tools {toolScore}/{toolsExpected.length}
          </span>
          <div className="mcp-chips">
            {toolsExpected.map((name) => (
              <code key={name} className={toolsHit.has(name) ? "hit" : ""}>
                {name}
              </code>
            ))}
          </div>
        </div>
        <div>
          <span className="row-label">
            Resources {resourceScore}/{resourcesExpected.length}
          </span>
          <div className="mcp-chips">
            {resourcesExpected.map((name) => (
              <code key={name} className={resourcesHit.has(name) ? "hit" : ""}>
                {name}
              </code>
            ))}
          </div>
        </div>
        <div>
          <span className="row-label">
            Prompts {promptScore}/{promptsExpected.length} · lists {listScore}/3
          </span>
          <div className="mcp-chips">
            {promptsExpected.map((name) => (
              <code key={name} className={promptsHit.has(name) ? "hit" : ""}>
                {name}
              </code>
            ))}
            {["tools/list", "resources/list", "prompts/list"].map((name) => (
              <code key={name} className={listsHit.has(name) ? "hit" : ""}>
                {name}
              </code>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
