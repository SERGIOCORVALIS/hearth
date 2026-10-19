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
  demoStepLabel: string | null;
  demoStepIndex: number;
  demoStepTotal: number;
};

export function TopChrome({
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
  demoStepLabel,
  demoStepIndex,
  demoStepTotal,
}: Props) {
  const locked = busy || demoRunning;

  return (
    <header className="chrome">
      <div className="chrome-brand">
        <p className="chrome-eyebrow">Alexa+ · living room MCP</p>
        <h1>Hearth</h1>
      </div>

      <button type="button" className="btn-demo" onClick={onPlayDemo} disabled={locked}>
        {demoRunning ? "Recording demo…" : "Play full demo"}
      </button>

      <div className="chrome-pills">
        {statusPills.map((pill) => (
          <span key={pill.label} className={`pill ${pill.kind}`}>
            {pill.label}: <strong>{pill.value}</strong>
          </span>
        ))}
        {lastMode === "bedrock" && (
          <span className="pill ok aws-badge">
            AWS: <strong>Bedrock</strong>
          </span>
        )}
      </div>

      {(demoRunning || demoStepLabel) && (
        <div className="demo-progress chrome-demo" role="status">
          <span className="demo-progress-badge">
            {demoStepTotal > 0 ? `${demoStepIndex}/${demoStepTotal}` : "Demo"}
          </span>
          <strong>{demoStepLabel ?? "Full surface"}</strong>
        </div>
      )}

      <div className="chrome-rows">
        <div className="scenario-row">
          <span className="row-label">Home</span>
          {households.map((h) => (
            <button
              key={h.id}
              type="button"
              className={`scenario-chip ${householdId === h.id ? "active" : ""}`}
              onClick={() => onHousehold(h.id)}
              disabled={locked}
              title={h.blurb}
            >
              {h.label}
            </button>
          ))}
        </div>
        <div className="scenario-row">
          <span className="row-label">Tonight</span>
          {scenarios.map((s) => (
            <button
              key={s.id}
              type="button"
              className={`scenario-chip ${scenarioId === s.id ? "active" : ""}`}
              onClick={() => onScenario(s.id)}
              disabled={locked}
              title={s.description}
            >
              {s.label}
            </button>
          ))}
        </div>
      </div>
    </header>
  );
}
