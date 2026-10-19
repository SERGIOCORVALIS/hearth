import { describe, expect, it } from "vitest";
import { latencySummary, recordLatency, timed } from "./metrics.js";

describe("latency metrics", () => {
  it("records samples and reports under Alexa+ 500ms target", async () => {
    recordLatency("get_household_profile", 2);
    recordLatency("suggest_evening_plan", 3);
    const result = await timed("confirm_plan", async () => "ok");
    expect(result).toBe("ok");

    const summary = latencySummary();
    expect(summary.samples).toBeGreaterThanOrEqual(3);
    expect(summary.avgMs).not.toBeNull();
    expect(summary.maxMs).toBeLessThan(500);
    expect(summary.under500ms).toBe(true);
  });
});
