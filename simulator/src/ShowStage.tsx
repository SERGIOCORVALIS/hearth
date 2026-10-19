import type { RefObject } from "react";
import { PLAN_VISUALS } from "./constants";
import type { ChatMessage, EveningState, PlanCard, PlanOption, VisualCard } from "./types";

type Props = {
  planCard: PlanCard | null;
  visualCard: VisualCard | null;
  planOptions: PlanOption[];
  eveningState: EveningState | null;
  latestReply: string | null;
  messages: ChatMessage[];
  input: string;
  onInput: (value: string) => void;
  onSend: () => void;
  onToggleVoice: () => void;
  busy: boolean;
  demoRunning: boolean;
  listening: boolean;
  voiceSupported: boolean;
  lastMode: "offline" | "bedrock" | null;
  householdLabel: string;
  onSwitchPlan: (planId: string) => void;
  onCareCheckin: () => void;
  onReminder: () => void;
  bottomRef: RefObject<HTMLDivElement | null>;
};

function stripMarkdown(text: string): string {
  return text
    .replace(/\*\*([^*]+)\*\*/g, "$1")
    .replace(/^•\s*/gm, "")
    .replace(/\n{2,}/g, " · ")
    .replace(/\n/g, " ")
    .trim();
}

export function ShowStage({
  planCard,
  visualCard,
  planOptions,
  eveningState,
  latestReply,
  messages,
  input,
  onInput,
  onSend,
  onToggleVoice,
  busy,
  demoRunning,
  listening,
  voiceSupported,
  lastMode,
  householdLabel,
  onSwitchPlan,
  onCareCheckin,
  onReminder,
  bottomRef,
}: Props) {
  const option = planCard?.option;
  const visual = PLAN_VISUALS[option?.id ?? ""] ?? { icon: "film", mood: "Living room" };
  const members = eveningState?.members ?? [];
  const checkins = eveningState?.checkins ?? [];
  const reminders = eveningState?.reminders ?? [];
  const locked = busy || demoRunning;
  const caption = latestReply ? stripMarkdown(latestReply).slice(0, 280) : null;
  const alternates = planOptions.filter((o) => o.id !== option?.id);
  const html = visualCard?.html ?? option?.visualCard?.html;

  const orbClass = listening ? "listening" : locked ? "busy" : option ? "ready" : "";

  return (
    <div className="room">
      <div className="room-glow" aria-hidden />
      <div className="room-lamp" aria-hidden />
      <div className="room-sofa" aria-hidden />

      <div className="show">
        <div className="show-bezel">
          <div className="show-chin">
            <span>Alexa+</span>
            <span className={`show-orb ${orbClass}`} />
            <span>Hearth</span>
          </div>

          <div className={`show-screen ${option ? "has-plan" : "idle"}`}>
            <div className="show-ambient" aria-hidden />

            <header className="show-top">
              <div>
                <p className="show-kicker">{householdLabel || "Family evening"}</p>
                <h2>{option ? visual.mood : "Good evening"}</h2>
              </div>
              <div className="show-status">
                {lastMode === "bedrock" && <span className="show-pill aws">Bedrock</span>}
                {listening && <span className="show-pill live">Listening</span>}
                {locked && !listening && <span className="show-pill live">Thinking</span>}
                {reminders[0] && <span className="show-pill">⏱ {reminders[0].when}</span>}
              </div>
            </header>

            {option ? (
              <div className="show-plan">
                <div className={`show-plan-hero visual-${visual.icon}`}>
                  <div className="show-plan-mark" aria-hidden />
                  <div>
                    <h3>{option.title}</h3>
                    <p>
                      {option.durationMinutes ? `${option.durationMinutes} min` : "Tonight"} ·{" "}
                      {option.summary}
                    </p>
                  </div>
                </div>

                {option.chips && option.chips.length > 0 && (
                  <div className="show-chips">
                    {option.chips.map((c) => (
                      <span key={c}>{c}</span>
                    ))}
                  </div>
                )}

                {option.timeline && option.timeline.length > 0 && (
                  <div className="show-timeline">
                    {option.timeline.map((step, idx) => (
                      <div
                        key={`${step.offsetMinutes}-${step.label}`}
                        className="show-beat"
                        style={{ animationDelay: `${idx * 90}ms` }}
                      >
                        <span className="show-beat-t">T+{step.offsetMinutes}</span>
                        <strong>{step.label}</strong>
                        <em>{step.forMembers.join(" · ")}</em>
                      </div>
                    ))}
                  </div>
                )}

                {html && (
                  <div className="show-html-card" dangerouslySetInnerHTML={{ __html: html }} />
                )}
              </div>
            ) : (
              <div className="show-idle">
                <div className="show-idle-ring" aria-hidden />
                <p>
                  Ask Hearth to plan the living room — kids, captions, and a gentle elder check-in —
                  through a live MCP server.
                </p>
                <div className="show-wave idle-wave">
                  <span />
                  <span />
                  <span />
                  <span />
                  <span />
                </div>
              </div>
            )}

            {members.length > 0 && (
              <div className="show-members">
                {members.map((m) => {
                  const check = checkins.find((c) => c.memberName === m.name);
                  return (
                    <div key={m.id} className={`show-member role-${m.role}`}>
                      <span className="show-avatar">{m.name.slice(0, 1)}</span>
                      <div>
                        <strong>{m.name}</strong>
                        <span>
                          {m.role}
                          {check ? ` · ${check.status}` : ""}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {caption && (
              <div className="show-caption">
                <span className="show-caption-label">Alexa+</span>
                <p>
                  {caption}
                  {latestReply && latestReply.length > 280 ? "…" : ""}
                </p>
              </div>
            )}

            {(option || alternates.length > 0) && (
              <div className="show-actions">
                <button type="button" disabled={locked} onClick={onCareCheckin}>
                  Care check-in
                </button>
                <button type="button" disabled={locked} onClick={onReminder}>
                  Reminder
                </button>
                {alternates.slice(0, 2).map((alt) => (
                  <button
                    key={alt.id}
                    type="button"
                    disabled={locked}
                    onClick={() => onSwitchPlan(alt.id)}
                  >
                    Try: {alt.title}
                  </button>
                ))}
              </div>
            )}

            <form
              className="show-composer"
              onSubmit={(e) => {
                e.preventDefault();
                onSend();
              }}
            >
              <button
                type="button"
                className={`show-mic ${listening ? "active" : ""}`}
                onClick={onToggleVoice}
                disabled={locked || !voiceSupported}
                title={voiceSupported ? "Talk to Hearth" : "Voice unavailable"}
              >
                mic
              </button>
              <input
                value={input}
                onChange={(e) => onInput(e.target.value)}
                placeholder="Alexa, plan tonight for the family…"
                disabled={locked}
              />
              <button type="submit" disabled={locked || !input.trim()}>
                Ask
              </button>
            </form>

            <div className="show-transcript" aria-live="polite">
              {messages.slice(-2).map((m) => (
                <div key={m.id} className={`show-line ${m.role}`}>
                  <span>{m.role === "user" ? "You" : "Hearth"}</span>
                  {stripMarkdown(m.text).slice(0, 140)}
                  {m.text.length > 140 ? "…" : ""}
                </div>
              ))}
              <div ref={bottomRef} />
            </div>
          </div>
        </div>
        <div className="show-stand" aria-hidden />
      </div>
    </div>
  );
}
