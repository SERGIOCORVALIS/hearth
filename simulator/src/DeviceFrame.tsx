import type { RefObject } from "react";
import type { ChatMessage } from "./types";

type Props = {
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
  agentHint: string | undefined;
  bottomRef: RefObject<HTMLDivElement | null>;
};

export function DeviceFrame({
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
  agentHint,
  bottomRef,
}: Props) {
  const orbClass = listening ? "listening" : busy || demoRunning ? "busy" : "";
  const statusLine = demoRunning
    ? "Autoplay demo for recording…"
    : listening
      ? "Listening…"
      : busy
        ? lastMode === "bedrock" || agentHint === "bedrock"
          ? "Reasoning on Amazon Bedrock…"
          : "Calling MCP tools…"
        : "Ask Hearth to care for the whole living room";

  return (
    <div className="device">
      <div className="device-top">
        <span>Alexa+ · Hearth</span>
        <span className={`device-orb ${orbClass}`} />
      </div>
      <div className="device-screen">
        <div className="screen-header">
          <h2>Good evening</h2>
          <p>{statusLine}</p>
          {lastMode === "bedrock" && (
            <div className="bedrock-strip">Reasoning on Amazon Bedrock · Converse + care KB</div>
          )}
          <div className={`wave ${listening || busy || demoRunning ? "on" : ""}`}>
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        </div>

        <div className="chat">
          {messages.map((m) => (
            <div key={m.id} className={`bubble ${m.role}`}>
              <span className="meta">
                {m.role === "user" ? "You" : `Hearth${m.mode ? ` · ${m.mode}` : ""}`}
              </span>
              {m.text}
            </div>
          ))}
          <div ref={bottomRef} />
        </div>

        <form
          className="composer"
          onSubmit={(e) => {
            e.preventDefault();
            onSend();
          }}
        >
          <button
            type="button"
            className={`btn-mic ${listening ? "active" : ""}`}
            onClick={onToggleVoice}
            disabled={busy || !voiceSupported || demoRunning}
            title={voiceSupported ? "Voice input" : "Voice not supported"}
          >
            mic
          </button>
          <textarea
            value={input}
            onChange={(e) => onInput(e.target.value)}
            placeholder="Ask Hearth to plan tonight…"
            disabled={busy || demoRunning}
          />
          <button
            className="btn-send"
            type="submit"
            disabled={busy || demoRunning || !input.trim()}
          >
            Send
          </button>
        </form>
      </div>
    </div>
  );
}
