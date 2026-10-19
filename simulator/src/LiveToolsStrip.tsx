import type { ToolCall } from "./types";

type Props = {
  toolCalls: ToolCall[];
  latencyMs: number | null;
};

export function LiveToolsStrip({ toolCalls, latencyMs }: Props) {
  if (toolCalls.length === 0) {
    return (
      <div className="live-tools empty-strip">
        <span>MCP tools</span>
        <em>Waiting for a live call…</em>
      </div>
    );
  }

  return (
    <div className="live-tools" aria-label="Live MCP tool calls">
      <span>MCP live</span>
      {latencyMs != null && <strong className="live-latency">{latencyMs}ms</strong>}
      <div className="live-tools-track">
        {toolCalls.slice(-6).map((call, index) => (
          <code key={`${call.name}-${index}`} className="tool-item-mini">
            {call.name}
          </code>
        ))}
      </div>
    </div>
  );
}
