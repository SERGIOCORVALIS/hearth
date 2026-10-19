/**
 * Lightweight "knowledge base" for the AWS Builder mini-challenge.
 * Snippets are retrieved locally and injected into Bedrock Converse
 * (same pattern as Bedrock Knowledge Bases / RAG, without requiring
 * a provisioned KB resource for the hackathon demo).
 */

export type KnowledgeHit = {
  id: string;
  title: string;
  source: string;
  text: string;
  score: number;
};

const CORPUS: Array<Omit<KnowledgeHit, "score">> = [
  {
    id: "kb-captions",
    title: "Captions & low-stimulus media",
    source: "hearth-care-kb/accessibility",
    text: "For elders with hearing or cognitive load concerns, enable large closed captions by default, keep volume moderate, and avoid sudden loud effects or jump-scare media.",
  },
  {
    id: "kb-pathways",
    title: "Clear living-room pathways",
    source: "hearth-care-kb/mobility",
    text: "Keep walker and cane pathways clear to the primary seat. Prefer table or sofa activities over floor play when an elder is present.",
  },
  {
    id: "kb-seated",
    title: "Seated movement options",
    source: "hearth-care-kb/fitness",
    text: "Offer seated stretches and low-impact options. Never require getting up quickly; pair movement with a calm wind-down breathing minute.",
  },
  {
    id: "kb-school-night",
    title: "School-night screen boundaries",
    source: "hearth-care-kb/family",
    text: "On school nights, prefer plans under 60–75 minutes and end kids' screens early enough for a wind-down routine before bed.",
  },
  {
    id: "kb-checkin",
    title: "Gentle care check-ins",
    source: "hearth-care-kb/elder-care",
    text: "A care check-in should be calm and respectful: confirm comfort, lighting, captions, and whether the elder wants to join or rest nearby.",
  },
  {
    id: "kb-apartment",
    title: "Apartment-friendly evenings",
    source: "hearth-care-kb/neighbors",
    text: "In apartments, keep bass low after 9pm, prefer cooperative games or captioned films, and wrap earlier when someone has an early morning.",
  },
];

export function retrieveKnowledge(query: string, limit = 3): KnowledgeHit[] {
  const q = query.toLowerCase();
  const scored = CORPUS.map((doc) => {
    const hay = `${doc.title} ${doc.text} ${doc.source}`.toLowerCase();
    let score = 0;
    for (const token of q.split(/[^a-z0-9]+/).filter((t) => t.length > 3)) {
      if (hay.includes(token)) score += 1;
    }
    if (/caption|elder|grandma|access|care|quiet|school|apartment/.test(q)) {
      if (doc.id.startsWith("kb-")) score += 0.2;
    }
    return { ...doc, score };
  })
    .filter((d) => d.score > 0)
    .sort((a, b) => b.score - a.score);

  const hits = (scored.length ? scored : CORPUS.map((d) => ({ ...d, score: 0.1 }))).slice(0, limit);
  return hits;
}

export function formatKnowledgeForPrompt(hits: KnowledgeHit[]): string {
  if (!hits.length) return "";
  return [
    "Care knowledge snippets (retrieved for this request):",
    ...hits.map((h, i) => `${i + 1}. [${h.source}] ${h.title}: ${h.text}`),
  ].join("\n");
}
