import { describe, expect, it } from "vitest";
import {
  isAlternatePlan,
  isCareScriptDemo,
  isEveningBriefingDemo,
  isSurfaceShowcase,
  runSurfaceShowcase,
} from "./demoShowcase.js";
import { createMockMcp, mockCalls } from "./test/mockMcp.js";

describe("demo showcase detectors", () => {
  it("recognizes surface / briefing / care / alternate intents", () => {
    expect(isSurfaceShowcase("DEMO_SHOWCASE_SURFACE: List every Hearth MCP tool")).toBe(true);
    expect(isEveningBriefingDemo("DEMO_EVENING_BRIEFING: Speak the Alexa+ evening briefing")).toBe(
      true,
    );
    expect(isCareScriptDemo("DEMO_CARE_SCRIPT: Run the care check-in spoken script")).toBe(true);
    expect(isAlternatePlan("Try the alternate evening plan from the suggestions")).toBe(true);
  });
});

describe("runSurfaceShowcase", () => {
  it("wires every tool, resource, and prompt connection", async () => {
    const mcp = createMockMcp();
    const result = await runSurfaceShowcase(mcp, "rivera", performance.now());
    expect(result.mode).toBe("offline");
    expect(result.surfaceCalls.some((c) => c.name === "tools/list")).toBe(true);
    expect(result.surfaceCalls.some((c) => c.kind === "resource")).toBe(true);
    expect(result.surfaceCalls.some((c) => c.kind === "prompt")).toBe(true);
    const names = mockCalls(mcp).map((c) => c.name);
    expect(names).toEqual(
      expect.arrayContaining([
        "set_active_household",
        "list_households",
        "get_household_profile",
        "suggest_evening_plan",
        "confirm_plan",
        "create_reminder",
        "log_care_checkin",
        "get_plan_visual",
        "get_evening_state",
      ]),
    );
    expect(result.mcpCoverage?.toolsHit.length).toBeGreaterThanOrEqual(9);
    expect(result.reply).toMatch(/MCP connection/i);
  });
});
