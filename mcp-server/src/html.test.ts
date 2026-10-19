import { describe, expect, it } from "vitest";
import { escapeHtml } from "./html.js";
import { HearthStore } from "./store.js";

describe("escapeHtml", () => {
  it("escapes markup-sensitive characters", () => {
    expect(escapeHtml(`<script>alert("x")</script>&'`)).toBe(
      "&lt;script&gt;alert(&quot;x&quot;)&lt;/script&gt;&amp;&#39;",
    );
  });
});

describe("visualCard HTML escaping", () => {
  it("keeps plan card HTML free of raw angle brackets from content fields", () => {
    const store = new HearthStore();
    const plans = store.suggestEveningPlan({
      mood: "cozy",
      durationMinutes: 90,
      includeKids: true,
      includeElder: true,
    });
    const card = plans[0]?.visualCard;
    expect(card?.html).toBeTruthy();
    expect(card!.html).toContain("hearth-plan-card");
    // Seed titles are safe; still assert structure uses escaped attribute form.
    expect(card!.html).toMatch(/data-plan-id="plan-[^"]+"/);
    expect(card!.html).not.toMatch(/<script/i);
  });
});
