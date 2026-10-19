import { useEffect, useState } from "react";
import { CareKnowledgePanel } from "./CareKnowledgePanel";
import { EveningStatePanel } from "./EveningStatePanel";
import { SurfacePanel } from "./SurfacePanel";
import { ToolPanel } from "./ToolPanel";
import type { EveningState, KnowledgeHit, SurfaceCall, ToolCall } from "./types";

type Props = {
  toolCalls: ToolCall[];
  surfaceCalls: SurfaceCall[];
  eveningState: EveningState | null;
  knowledgeHits: KnowledgeHit[];
  awsServices: string[];
  lastMode: "offline" | "bedrock" | null;
  forceOpen?: boolean;
};

export function JudgeDrawer({
  toolCalls,
  surfaceCalls,
  eveningState,
  knowledgeHits,
  awsServices,
  lastMode,
  forceOpen = false,
}: Props) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    if (forceOpen) setOpen(true);
  }, [forceOpen]);

  return (
    <section className={`judge-drawer ${open ? "open" : ""}`}>
      <button type="button" className="judge-toggle" onClick={() => setOpen((v) => !v)}>
        <span>Judge toolkit</span>
        <strong>
          {toolCalls.length} tools · {surfaceCalls.length} surface
          {open ? " · hide" : " · show MCP proof"}
        </strong>
      </button>
      {open && (
        <div className="judge-grid">
          <ToolPanel toolCalls={toolCalls} />
          <SurfacePanel surfaceCalls={surfaceCalls} />
          <CareKnowledgePanel
            knowledgeHits={knowledgeHits}
            awsServices={awsServices}
            lastMode={lastMode}
          />
          <EveningStatePanel eveningState={eveningState} />
        </div>
      )}
    </section>
  );
}
