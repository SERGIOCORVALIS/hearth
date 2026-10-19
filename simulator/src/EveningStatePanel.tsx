import type { EveningState } from "./types";

type Props = {
  eveningState: EveningState | null;
};

export function EveningStatePanel({ eveningState }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        Tonight&apos;s state
        <span className="hint">{eveningState?.householdName ?? "persistent"}</span>
      </div>
      <div className="plan-body">
        {eveningState ? (
          <>
            {eveningState.checkins && eveningState.checkins.length > 0 && (
              <p>
                Care:{" "}
                {eveningState.checkins
                  .map((c) => `${c.memberName ?? "member"} (${c.status})`)
                  .join(", ")}
              </p>
            )}
            {eveningState.reminders && eveningState.reminders.length > 0 && (
              <p>
                Reminders: {eveningState.reminders.map((r) => `${r.title} @ ${r.when}`).join("; ")}
              </p>
            )}
            {eveningState.turnLog && eveningState.turnLog.length > 0 && (
              <ul className="why-list">
                {eveningState.turnLog.slice(-6).map((t, i) => (
                  <li key={`${t.at}-${i}`}>
                    {t.event}
                    {t.detail ? ` — ${t.detail}` : ""}
                  </li>
                ))}
              </ul>
            )}
          </>
        ) : (
          <p className="empty">Turn log, reminders, and check-ins accumulate here.</p>
        )}
      </div>
    </section>
  );
}
