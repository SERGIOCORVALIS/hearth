import type { Household, Scenario, StatusPill } from "./types";

type Props = {
  statusPills: StatusPill[];
  lastMode: "offline" | "bedrock" | null;
  households: Household[];
  householdId: string;
  onHousehold: (id: string) => void;
  scenarios: Scenario[];
  scenarioId: string;
  onScenario: (id: string) => void;
  demoRunning: boolean;
  busy: boolean;
  onPlayDemo: () => void;
};

export function HeroHeader({
  statusPills,
  lastMode,
  households,
  householdId,
  onHousehold,
  scenarios,
  scenarioId,
  onScenario,
  demoRunning,
  busy,
  onPlayDemo,
}: Props) {
  const locked = busy || demoRunning;

  return (
    <header className="hero">
      <div className="hero-row">
        <h1 className="brand">Hearth</h1>
        <button type="button" className="btn-demo" onClick={onPlayDemo} disabled={locked}>
          {demoRunning ? "Recording demo…" : "Play demo"}
        </button>
      </div>
      <p className="pitch">
        Alexa+ that plans the whole living room evening — kids, captions, and an elder care check-in
        — through an open MCP server.
      </p>
      <p className="tagline">
        Tap a household or scenario to run it live. Play demo walks the full MCP surface for judges
        — tools, resources, prompts, all three homes.
      </p>
      <div className="status-row">
        {statusPills.map((pill) => (
          <span key={pill.label} className={`pill ${pill.kind}`}>
            {pill.label}: <strong>{pill.value}</strong>
          </span>
        ))}
        {lastMode === "bedrock" && (
          <span className="pill ok aws-badge">
            AWS: <strong>Bedrock reasoning</strong>
          </span>
        )}
        {lastMode === "offline" && (
          <span className="pill">
            Agent: <strong>offline MCP + care KB</strong>
          </span>
        )}
      </div>
      <div className="scenario-row">
        <span className="row-label">Household</span>
        {households.map((h) => (
          <button
            key={h.id}
            type="button"
            className={`scenario-chip ${householdId === h.id ? "active" : ""}`}
            onClick={() => onHousehold(h.id)}
            disabled={locked}
            title={`${h.blurb} — click to plan for this home`}
          >
            {h.label}
          </button>
        ))}
      </div>
      <div className="scenario-row">
        <span className="row-label">Scenario</span>
        {scenarios.map((s) => (
          <button
            key={s.id}
            type="button"
            className={`scenario-chip ${scenarioId === s.id ? "active" : ""}`}
            onClick={() => onScenario(s.id)}
            disabled={locked}
            title={`${s.description} — click to run`}
          >
            {s.label}
          </button>
        ))}
      </div>
    </header>
  );
}
