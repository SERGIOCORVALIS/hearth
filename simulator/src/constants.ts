import type { Household, Scenario } from "./types";

export const PLAN_VISUALS: Record<string, { icon: string; mood: string }> = {
  "plan-cozy-classic": { icon: "film", mood: "Cozy film night" },
  "plan-active-lite": { icon: "stretch", mood: "Gentle movement" },
  "plan-creative": { icon: "craft", mood: "Make & draw" },
  "plan-game-night": { icon: "game", mood: "Quiet games" },
  "plan-adults-late": { icon: "tea", mood: "Calm wind-down" },
};

export const FALLBACK_SCENARIOS: Scenario[] = [
  {
    id: "weekend",
    label: "Weekend cozy",
    description: "Full family evening",
    examplePrompt: "Plan a low-key evening for me, the kids, and grandma",
  },
  {
    id: "busy-weeknight",
    label: "Busy weeknight",
    description: "45-minute calm plan",
    examplePrompt:
      "We only have 45 minutes on a school night — plan something calm for the kids and grandma",
  },
  {
    id: "elder-visiting",
    label: "Elder care focus",
    description: "Accessible evening + check-in",
    examplePrompt: "Plan an accessible evening and log a care check-in for our elder",
  },
];

export const FALLBACK_HOUSEHOLDS: Household[] = [
  { id: "rivera", label: "Rivera family", blurb: "Kids + grandma" },
  { id: "park", label: "Park apartment", blurb: "Two adults" },
  { id: "okonkwo", label: "Okonkwo home", blurb: "Care-first multi-gen" },
];
