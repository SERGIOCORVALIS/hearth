export type DemoStep = {
  household: string;
  scenario: string;
  message: string;
  pauseMs: number;
  /** Short label shown in the UI progress strip during Play demo. */
  label?: string;
};

/**
 * Full-surface demo for Play demo / ?demo=1.
 * Exercises every household, scenario, MCP tool, plus resources + prompts
 * (no Echo Show hardware required — the simulator is the living-room display).
 */
export const DEMO_SCRIPT_STEPS: DemoStep[] = [
  {
    household: "rivera",
    scenario: "weekend",
    label: "All MCP connections",
    message:
      "DEMO_SHOWCASE_SURFACE: Wire every Hearth MCP tool, resource, and prompt for Alexa+ judges",
    pauseMs: 700,
  },
  {
    household: "rivera",
    scenario: "weekend",
    label: "Rivera · Weekend cozy",
    message: "Plan a low-key evening for me, the kids, and grandma",
    pauseMs: 1000,
  },
  {
    household: "rivera",
    scenario: "weekend",
    label: "Switch alternate plan",
    message: "Try the alternate evening plan from the suggestions",
    pauseMs: 800,
  },
  {
    household: "rivera",
    scenario: "busy-weeknight",
    label: "Rivera · Busy weeknight",
    message:
      "We only have 45 minutes on a school night — plan something calm for the kids and grandma",
    pauseMs: 900,
  },
  {
    household: "park",
    scenario: "busy-weeknight",
    label: "Park · Adults wind-down",
    message: "Plan a quiet adults-only wind-down after the kids are in bed",
    pauseMs: 900,
  },
  {
    household: "park",
    scenario: "weekend",
    label: "Reminder only",
    message: "Set a reminder for wind-down in 20 minutes",
    pauseMs: 600,
  },
  {
    household: "okonkwo",
    scenario: "elder-visiting",
    label: "Okonkwo · Elder care",
    message: "Plan an accessible evening and log a care check-in for our elder",
    pauseMs: 1100,
  },
  {
    household: "okonkwo",
    scenario: "elder-visiting",
    label: "Care check-in (grandma)",
    message: "Log a care check-in for grandma with status resting",
    pauseMs: 700,
  },
  {
    household: "okonkwo",
    scenario: "elder-visiting",
    label: "Evening briefing prompt",
    message: "DEMO_EVENING_BRIEFING: Speak the Alexa+ evening briefing for tonight",
    pauseMs: 800,
  },
  {
    household: "okonkwo",
    scenario: "elder-visiting",
    label: "Care script prompt",
    message: "DEMO_CARE_SCRIPT: Run the care check-in spoken script for Ngozi",
    pauseMs: 700,
  },
];

/** Short pauses for Playwright / CI (`?fast=1` or HEARTH_DEMO_FAST=1). */
export function getDemoScriptSteps(fast = false): DemoStep[] {
  if (!fast) return DEMO_SCRIPT_STEPS;
  return DEMO_SCRIPT_STEPS.map((step) => ({ ...step, pauseMs: 40 }));
}
