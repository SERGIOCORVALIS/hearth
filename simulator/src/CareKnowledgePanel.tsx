import type { KnowledgeHit } from "./types";

type Props = {
  knowledgeHits: KnowledgeHit[];
  awsServices: string[];
  lastMode: "offline" | "bedrock" | null;
};

export function CareKnowledgePanel({ knowledgeHits, awsServices, lastMode }: Props) {
  if (knowledgeHits.length === 0 && awsServices.length === 0) return null;

  return (
    <section className="panel">
      <div className="panel-header">
        Care knowledge
        <span className="hint">{lastMode === "bedrock" ? "Bedrock + KB retrieve" : "care KB"}</span>
      </div>
      <div className="plan-body">
        {awsServices.length > 0 && (
          <div className="chips">
            {awsServices.map((s) => (
              <span key={s} className="chip chip-aws">
                {s}
              </span>
            ))}
          </div>
        )}
        {knowledgeHits.map((hit) => (
          <div key={hit.id} className="kb-hit">
            <strong>{hit.title}</strong>
            <span>{hit.source}</span>
            <p>{hit.text}</p>
          </div>
        ))}
      </div>
    </section>
  );
}
