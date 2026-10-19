import { PLAN_VISUALS } from "./constants";
import type { PlanCard, PlanOption } from "./types";

type Props = {
  planCard: PlanCard | null;
  planOptions: PlanOption[];
  busy: boolean;
  demoRunning: boolean;
  onSwitchPlan: (planId: string) => void;
  onCareCheckin: () => void;
  onReminder: () => void;
};

export function TimelinePanel({
  planCard,
  planOptions,
  busy,
  demoRunning,
  onSwitchPlan,
  onCareCheckin,
  onReminder,
}: Props) {
  const option = planCard?.option;
  const visual = PLAN_VISUALS[option?.id ?? ""] ?? { icon: "film", mood: "Evening plan" };
  const locked = busy || demoRunning;
  const alternates = planOptions.filter((o) => o.id !== option?.id);

  return (
    <section className="panel">
      <div className="panel-header">
        Evening timeline
        <span className="hint">
          {option?.durationMinutes ? `${option.durationMinutes} min` : "awaiting confirm_plan"}
        </span>
      </div>
      <div className="plan-body">
        {option ? (
          <>
            <div className={`plan-hero visual-${visual.icon}`}>
              <div className="plan-hero-icon" aria-hidden />
              <div>
                <div className="plan-hero-mood">{visual.mood}</div>
                <h3>{option.title}</h3>
              </div>
            </div>
            <p>{option.summary}</p>
            {option.chips && option.chips.length > 0 && (
              <div className="chips">
                {option.chips.map((c) => (
                  <span key={c} className="chip">
                    {c}
                  </span>
                ))}
              </div>
            )}
            {option.constraintWarnings && option.constraintWarnings.length > 0 && (
              <ul className="why-list warn">
                {option.constraintWarnings.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            {option.whyForMembers && option.whyForMembers.length > 0 && (
              <ul className="why-list">
                {option.whyForMembers.map((w) => (
                  <li key={w}>{w}</li>
                ))}
              </ul>
            )}
            {option.timeline && option.timeline.length > 0 && (
              <div className="timeline">
                {option.timeline.map((step, idx) => (
                  <div
                    key={`${step.offsetMinutes}-${step.label}`}
                    className="timeline-item"
                    style={{ animationDelay: `${idx * 80}ms` }}
                  >
                    <div className="t">T+{step.offsetMinutes}m</div>
                    <div>
                      <div className="l">{step.label}</div>
                      <div className="m">{step.forMembers.join(" · ")}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            <div className="plan-actions">
              <button
                type="button"
                className="action-chip"
                disabled={locked}
                onClick={onCareCheckin}
              >
                Care check-in
              </button>
              <button type="button" className="action-chip" disabled={locked} onClick={onReminder}>
                Set reminder
              </button>
            </div>
            {alternates.length > 0 && (
              <div className="alt-plans">
                <span className="row-label">Switch plan</span>
                {alternates.map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    className="alt-plan-btn"
                    disabled={locked}
                    onClick={() => onSwitchPlan(alt.id)}
                    title={alt.summary}
                  >
                    <strong>{alt.title}</strong>
                    <span>{alt.durationMinutes ? `${alt.durationMinutes} min` : alt.id}</span>
                  </button>
                ))}
              </div>
            )}
          </>
        ) : (
          <p className="empty">
            Tap a household or scenario above — Hearth will confirm a plan and fill this timeline.
          </p>
        )}
      </div>
    </section>
  );
}
