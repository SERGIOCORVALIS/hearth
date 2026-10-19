import { describe, expect, it } from "vitest";
import { formatKnowledgeForPrompt, retrieveKnowledge } from "./knowledge.js";

describe("retrieveKnowledge", () => {
  it("returns caption/elder hits for an accessibility query", () => {
    const hits = retrieveKnowledge("elder captions accessible evening care", 3);
    expect(hits.length).toBeGreaterThan(0);
    expect(hits.some((h) => /caption|elder|care/i.test(`${h.title} ${h.text}`))).toBe(true);
  });

  it("falls back to corpus snippets when query has no tokens", () => {
    const hits = retrieveKnowledge("ok", 2);
    expect(hits).toHaveLength(2);
  });
});

describe("formatKnowledgeForPrompt", () => {
  it("formats hits for Bedrock system prompt", () => {
    const hits = retrieveKnowledge("school night captions", 1);
    const text = formatKnowledgeForPrompt(hits);
    expect(text).toMatch(/Care knowledge snippets/);
    expect(text).toContain(hits[0].title);
  });

  it("returns empty string for no hits", () => {
    expect(formatKnowledgeForPrompt([])).toBe("");
  });
});
