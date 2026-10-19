import { beforeEach, describe, expect, it } from "vitest";
import { runOfflineAgent } from "./offlineAgent.js";
import { createMockMcp, mockCalls } from "./test/mockMcp.js";

describe("runOfflineAgent", () => {
  beforeEach(() => {
    process.env.HEARTH_FORCE_OFFLINE = "1";
  });

  it("plans an evening via MCP tools and returns a plan card", async () => {
    const mcp = createMockMcp();
    const result = await runOfflineAgent(
      mcp,
      "Plan a low-key evening for me, the kids, and grandma",
      "weekend",
      "rivera",
    );

    expect(result.mode).toBe("offline");
    expect(result.reply).toMatch(/Cozy captioned film night|Rivera/i);
    expect(result.planCard).toMatchObject({ planId: "plan-cozy-classic" });
    expect(result.visualCard).toMatchObject({ kind: "hearth.plan_card" });
    expect(result.eveningState).toBeTruthy();
    expect(result.knowledgeHits?.length).toBeGreaterThan(0);

    const names = mockCalls(mcp).map((c) => c.name);
    expect(names[0]).toBe("set_active_household");
    expect(names).toContain("suggest_evening_plan");
    expect(names).toContain("confirm_plan");
    expect(names).toContain("create_reminder");
    expect(names).toContain("log_care_checkin");
    expect(names).toContain("get_plan_visual");
    expect(names).toContain("get_evening_state");
  });

  it("logs a care check-in without planning when message is check-in only", async () => {
    const mcp = createMockMcp();
    const result = await runOfflineAgent(mcp, "How is Elena — care check-in please?");

    expect(result.planCard).toBeNull();
    expect(result.reply).toMatch(/care check-in|Elena/i);
    expect(mockCalls(mcp).map((c) => c.name)).toEqual([
      "get_household_profile",
      "log_care_checkin",
      "get_evening_state",
    ]);
  });

  it("handles empty suggestions gracefully", async () => {
    const mcp = createMockMcp({ plans: [] });
    const result = await runOfflineAgent(mcp, "Plan tonight for the family");

    expect(result.planCard).toBeNull();
    expect(result.reply).toMatch(/couldn't find a matching plan/i);
  });

  it("applies busy-weeknight duration from scenario id", async () => {
    const mcp = createMockMcp();
    await runOfflineAgent(mcp, "Plan something calm", "busy-weeknight");

    const suggest = mockCalls(mcp).find((c) => c.name === "suggest_evening_plan");
    expect(suggest?.arguments).toMatchObject({
      durationMinutes: 45,
      includeKids: true,
      includeElder: true,
    });
  });
});
