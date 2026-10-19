export type HouseholdMember = {
  id: string;
  name: string;
  role: "adult" | "child" | "elder";
  preferences: string[];
  constraints: string[];
};

export type HouseholdProfile = {
  householdId: string;
  name: string;
  timezone: string;
  members: HouseholdMember[];
  sharedPreferences: string[];
  accessibilityNotes: string[];
};

export {
  HouseholdMemberSchema,
  HouseholdProfileSchema,
  parseHouseholdProfile,
} from "./householdSchema.js";
export type { HouseholdProfileParsed } from "./householdSchema.js";

export type HouseholdPresetMeta = {
  id: string;
  label: string;
  blurb: string;
};

export type TimelineStep = {
  offsetMinutes: number;
  label: string;
  forMembers: string[];
};

export type VisualPlanCard = {
  kind: "hearth.plan_card";
  title: string;
  subtitle: string;
  durationMinutes: number;
  chips: string[];
  timeline: TimelineStep[];
  whyForMembers: string[];
  accessibilityNotes: string[];
  html: string;
};

export type EveningPlanOption = {
  id: string;
  title: string;
  summary: string;
  durationMinutes: number;
  mood: string;
  activities: string[];
  suitableFor: string[];
  accessibilityFriendly: boolean;
  whyForMembers?: string[];
  chips?: string[];
  timeline?: TimelineStep[];
  visualCard?: VisualPlanCard;
  constraintWarnings?: string[];
};

export type Reminder = {
  id: string;
  title: string;
  when: string;
  relatedPlanId?: string;
  /** Resolved household member id when the reminder targets someone specific. */
  memberId?: string;
  memberName?: string;
  createdAt: string;
};

export { resolveMember, resolveMemberOrThrow } from "./resolveMember.js";
export { PLAN_CARD_SCHEMA, PLAN_CARD_EXAMPLE } from "./planCardSchema.js";

export type CareCheckin = {
  id: string;
  memberId: string;
  memberName?: string;
  status: "ok" | "needs_attention" | "resting";
  notes: string;
  createdAt: string;
};

export type ConfirmedPlan = {
  planId: string;
  option: EveningPlanOption;
  confirmedAt: string;
  notes?: string;
};

export type ScenarioId = "busy-weeknight" | "weekend" | "elder-visiting";

export type ScenarioPreset = {
  id: ScenarioId;
  label: string;
  description: string;
  mood: string;
  durationMinutes: number;
  includeKids: boolean;
  includeElder: boolean;
  examplePrompt: string;
};

export const SCENARIOS: ScenarioPreset[] = [
  {
    id: "busy-weeknight",
    label: "Busy weeknight",
    description: "Short wind-down before school tomorrow",
    mood: "low-key",
    durationMinutes: 45,
    includeKids: true,
    includeElder: true,
    examplePrompt:
      "We only have 45 minutes on a school night — plan something calm for the kids and grandma",
  },
  {
    id: "weekend",
    label: "Weekend cozy",
    description: "Full family evening with snacks and a film",
    mood: "cozy",
    durationMinutes: 95,
    includeKids: true,
    includeElder: true,
    examplePrompt: "Plan a low-key evening for me, the kids, and grandma",
  },
  {
    id: "elder-visiting",
    label: "Elder care focus",
    description: "Accessibility-first evening with a care check-in",
    mood: "cozy",
    durationMinutes: 80,
    includeKids: true,
    includeElder: true,
    examplePrompt: "Plan an accessible evening and log a care check-in for our elder",
  },
];

export const HOUSEHOLD_PRESETS: HouseholdPresetMeta[] = [
  {
    id: "rivera",
    label: "Rivera family",
    blurb: "Two kids + grandma — captions & wind-down",
  },
  {
    id: "park",
    label: "Park apartment",
    blurb: "Two adults — quiet neighbors, early morning",
  },
  {
    id: "okonkwo",
    label: "Okonkwo home",
    blurb: "Care-first multi-gen with Ngozi",
  },
];

export const MCP_PROTOCOL_VERSION = "2025-11-25" as const;

export const HEARTH_TOOLS = [
  "get_household_profile",
  "list_households",
  "set_active_household",
  "suggest_evening_plan",
  "create_reminder",
  "log_care_checkin",
  "confirm_plan",
  "get_evening_state",
  "get_plan_visual",
] as const;

export type HearthToolName = (typeof HEARTH_TOOLS)[number];
