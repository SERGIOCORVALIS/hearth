import type { SurfaceCall } from "./types";

type Props = {
  surfaceCalls: SurfaceCall[];
};

export function SurfacePanel({ surfaceCalls }: Props) {
  if (surfaceCalls.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-header">
        MCP resources &amp; prompts
        <span className="hint">full Alexa+ surface</span>
      </div>
      <div className="tool-list">
        {surfaceCalls.map((call, index) => (
          <div key={`${call.kind}-${call.name}-${index}`} className="tool-item">
            <code>
              {call.kind}:{call.name}
            </code>
            <pre>{JSON.stringify(call.result, null, 2)}</pre>
          </div>
        ))}
      </div>
    </section>
  );
}
