import type { ToolCall } from "./types";

type Props = {
  toolCalls: ToolCall[];
};

export function ToolPanel({ toolCalls }: Props) {
  return (
    <section className="panel">
      <div className="panel-header">
        MCP tool calls
        <span className="hint">Streamable HTTP</span>
      </div>
      <div className="tool-list">
        {toolCalls.length === 0 ? (
          <p className="empty">Live JSON-RPC tool calls animate here.</p>
        ) : (
          toolCalls.map((call, index) => (
            <div key={`${call.name}-${index}`} className="tool-item">
              <code>{call.name}</code>
              <pre>{JSON.stringify(call.arguments, null, 2)}</pre>
              <pre>{JSON.stringify(call.result, null, 2)}</pre>
            </div>
          ))
        )}
      </div>
    </section>
  );
}
