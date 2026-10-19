import { readFileSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import type {
  CareCheckin,
  ConfirmedPlan,
  EveningPlanOption,
  HouseholdMember,
  HouseholdProfile,
  Reminder,
  TimelineStep,
  VisualPlanCard,
} from "@hearth/shared";
import {
  HOUSEHOLD_PRESETS,
  parseHouseholdProfile,
  resolveMemberOrThrow,
} from "@hearth/shared";
import { escapeHtml } from "./html.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const HOUSEHOLDS_DIR = join(__dirname, "data", "households");

export function loadHouseholdFromJson(raw: string, source: string): HouseholdProfile {
  return parseHouseholdProfile(JSON.parse(raw) as unknown, source);
}

function loadAllHouseholds(): Map<string, HouseholdProfile> {
  const map = new Map<string, HouseholdProfile>();
  for (const file of readdirSync(HOUSEHOLDS_DIR).filter((f) => f.endsWith(".json"))) {
    const id = file.replace(/\.json$/, "");
    const raw = readFileSync(join(HOUSEHOLDS_DIR, file), "utf8");
    map.set(id, loadHouseholdFromJson(raw, file));
  }
  return map;
}

function byRole(members: HouseholdMember[], role: HouseholdMember["role"]) {
  return members.filter((m) => m.role === role);
}

function names(members: HouseholdMember[]) {
  return members.map((m) => m.name);
}

function firstName(members: HouseholdMember[], fallback: string) {
  return members[0]?.name ?? fallback;
}

function buildVisualCard(option: EveningPlanOption, household: HouseholdProfile): VisualPlanCard {
  const chips = option.chips ?? [];
  const timeline = option.timeline ?? [];
  const why = option.whyForMembers ?? [];
  const html = `<article class="hearth-plan-card" data-plan-id="${escapeHtml(option.id)}">
  <header><h1>${escapeHtml(option.title)}</h1><p>${option.durationMinutes} min · ${escapeHtml(household.name)}</p></header>
  <p>${escapeHtml(option.summary)}</p>
  <ul class="chips">${chips.map((c) => `<li>${escapeHtml(c)}</li>`).join("")}</ul>
  <ol class="timeline">${timeline
    .map(
      (t) =>
        `<li><strong>T+${t.offsetMinutes}m</strong> ${escapeHtml(t.label)} <em>${escapeHtml(t.forMembers.join(", "))}</em></li>`,
    )
    .join("")}</ol>
  <ul class="why">${why.map((w) => `<li>${escapeHtml(w)}</li>`).join("")}</ul>
</article>`;

  return {
    kind: "hearth.plan_card",
    title: option.title,
    subtitle: `${household.name} · ${option.durationMinutes} min`,
    durationMinutes: option.durationMinutes,
    chips,
    timeline,
    whyForMembers: why,
    accessibilityNotes: household.accessibilityNotes,
    html,
  };
}

function constraintWarnings(option: EveningPlanOption, household: HouseholdProfile): string[] {
  const warnings: string[] = [];
  const kids = byRole(household.members, "child");
  for (const kid of kids) {
    for (const c of kid.constraints) {
      if (/screen|8:00|8:30|bedtime|school/i.test(c) && option.durationMinutes > 60) {
        warnings.push(`${kid.name}: ${c} — keep timeline tight`);
      }
    }
  }
  for (const adult of byRole(household.members, "adult")) {
    for (const c of adult.constraints) {
      if (/standup|night shift|10:30|wrap/i.test(c) && option.durationMinutes > 70) {
        warnings.push(`${adult.name}: ${c}`);
      }
      if (/bass|neighbors|loud/i.test(c)) {
        warnings.push(`${adult.name}: ${c}`);
      }
    }
  }
  return [...new Set(warnings)].slice(0, 3);
}

type PlanTemplate = {
  id: string;
  title: string;
  durationMinutes: number;
  mood: string;
  suitableFor: Array<"adult" | "child" | "elder">;
  accessibilityFriendly: boolean;
  personalize: (members: HouseholdMember[]) => {
    summary: string;
    activities: string[];
    whyForMembers: string[];
    chips: string[];
    timeline: TimelineStep[];
  };
};

const PLAN_TEMPLATES: PlanTemplate[] = [
  {
    id: "plan-cozy-classic",
    title: "Captioned Classic + Cocoa",
    durationMinutes: 95,
    mood: "cozy",
    suitableFor: ["adult", "child", "elder"],
    accessibilityFriendly: true,
    personalize(members) {
      const elders = byRole(members, "elder");
      const kids = byRole(members, "child");
      const adults = byRole(members, "adult");
      const elder = firstName(elders, "Grandma");
      const kidA = firstName(kids, "the kids");
      const kidB = kids[1]?.name;
      return {
        summary: `Cocoa first, then a captioned classic so ${elder} can follow every line. Soft volume; ${
          kidB ? `${kidA} and ${kidB}` : kidA
        } share one memory before wind-down.`,
        activities: [
          `${names(adults).slice(0, 2).join("/") || "Adults"}: warm lights + large captions for ${elder}`,
          "Everyone: cocoa and a family-friendly classic",
          kids.length
            ? `${names(kids).join(" & ")}: one favorite memory each`
            : "Adults: short story share",
        ],
        whyForMembers: [
          ...elders.map((e) => `${e.name}: large captions, no sudden loud audio`),
          ...kids.map((k) => `${k.name}: ${k.constraints[0] ?? "wind-down friendly"}`),
          ...adults.slice(0, 1).map((a) => `${a.name}: low-noise evening preference`),
        ],
        chips: ["Captions on", "Warm lighting", "Low volume", "Family stories"],
        timeline: [
          {
            offsetMinutes: 0,
            label: "Cocoa + captions setup",
            forMembers: [...names(adults).slice(0, 2), elder],
          },
          { offsetMinutes: 15, label: "Classic film (captioned)", forMembers: ["Everyone"] },
          {
            offsetMinutes: 75,
            label: "Memory share",
            forMembers: kids.length ? names(kids) : names(adults),
          },
          {
            offsetMinutes: 90,
            label: kids.length ? "Kids wind-down" : "Quiet wrap",
            forMembers: kids.length ? names(kids) : names(adults),
          },
        ],
      };
    },
  },
  {
    id: "plan-active-lite",
    title: "Living-Room Stretch & Dance",
    durationMinutes: 45,
    mood: "active",
    suitableFor: ["adult", "child", "elder"],
    accessibilityFriendly: true,
    personalize(members) {
      const elders = byRole(members, "elder");
      const kids = byRole(members, "child");
      const elder = firstName(elders, "elder");
      const dancer =
        kids.find((k) => k.preferences.some((p) => /dance|soccer|yoga/i.test(p)))?.name ??
        firstName(kids, firstName(byRole(members, "adult"), "you"));
      return {
        summary: `Seated stretches with ${elder}, a short movement burst led by ${dancer}, then calm breathing.`,
        activities: [
          `With ${elder}: 5-minute gentle / seated stretches`,
          `${dancer} leads a 10-minute movement break`,
          "Wind-down breathing for everyone",
        ],
        whyForMembers: [
          ...elders.map((e) => `${e.name}: seated stretch options`),
          ...kids.map((k) => `${k.name}: ${k.preferences[0] ?? "active break"}`),
        ],
        chips: ["Low impact", "Seated options", "Short runtime", "Wind-down"],
        timeline: [
          { offsetMinutes: 0, label: "Gentle stretches", forMembers: [elder, "Adults"] },
          {
            offsetMinutes: 10,
            label: "Movement break",
            forMembers: kids.length ? names(kids) : ["Adults"],
          },
          { offsetMinutes: 25, label: "Breathing wind-down", forMembers: ["Everyone"] },
          { offsetMinutes: 40, label: "Quiet transition", forMembers: ["Everyone"] },
        ],
      };
    },
  },
  {
    id: "plan-creative",
    title: "Build & Draw Night",
    durationMinutes: 75,
    mood: "creative",
    suitableFor: ["adult", "child"],
    accessibilityFriendly: true,
    personalize(members) {
      const kids = byRole(members, "child");
      const adults = byRole(members, "adult");
      const builder =
        kids.find((k) => k.preferences.some((p) => /lego|build|soccer/i.test(p)))?.name ??
        firstName(kids, firstName(adults, "you"));
      const artist =
        kids.find((k) => k.preferences.some((p) => /draw|art/i.test(p)))?.name ??
        kids[1]?.name ??
        firstName(adults, "partner");
      return {
        summary: `Screen-light creativity: ${builder} builds, ${artist} draws, adults coach from the floor. Soft music; keep pathways clear.`,
        activities: [
          "Clear a safe pathway beside the make zone",
          `${builder}: build / make station`,
          `${artist}: drawing / craft corner`,
          "Show-and-tell round",
        ],
        whyForMembers: [
          `${builder}: hands-on make time`,
          `${artist}: creative preference`,
          ...adults.slice(0, 1).map((a) => `${a.name}: laptop-off coaching`),
        ],
        chips: ["Low screens", "Clear pathways", "Parallel play", "Soft audio"],
        timeline: [
          { offsetMinutes: 0, label: "Set stations", forMembers: names(adults).slice(0, 2) },
          {
            offsetMinutes: 10,
            label: "Build & draw",
            forMembers: kids.length ? names(kids) : names(adults),
          },
          { offsetMinutes: 55, label: "Show-and-tell", forMembers: ["Everyone"] },
          { offsetMinutes: 70, label: "Cleanup", forMembers: ["Everyone"] },
        ],
      };
    },
  },
  {
    id: "plan-game-night",
    title: "Quiet Board-Game Hour",
    durationMinutes: 60,
    mood: "playful",
    suitableFor: ["adult", "child", "elder"],
    accessibilityFriendly: true,
    personalize(members) {
      const elders = byRole(members, "elder");
      const adults = byRole(members, "adult");
      const gamer =
        adults.find((a) => a.preferences.some((p) => /board|game/i.test(p)))?.name ??
        firstName(adults, "Host");
      const elder = firstName(elders, "everyone");
      return {
        summary: `Table-side cooperative game led by ${gamer}. No buzzers — easy on ${elder}'s ears and great for mixed ages.`,
        activities: [
          `${gamer}: pick a cooperative (quiet) game`,
          "Snack prep at the table",
          elders.length ? `Seat ${elder} with good light` : "Keep volume apartment-friendly",
          "Play one full round",
        ],
        whyForMembers: [
          `${gamer}: board-game vibe`,
          ...elders.map((e) => `${e.name}: avoid sudden loud audio`),
          ...byRole(members, "child").map((k) => `${k.name}: shared table time`),
        ],
        chips: ["No loud FX", "Table seating", "Cooperative", "Snacks"],
        timeline: [
          { offsetMinutes: 0, label: "Snacks + setup", forMembers: names(adults).slice(0, 2) },
          { offsetMinutes: 10, label: "Cooperative round", forMembers: ["Everyone"] },
          { offsetMinutes: 50, label: "Quiet wrap", forMembers: ["Everyone"] },
        ],
      };
    },
  },
  {
    id: "plan-adults-late",
    title: "After-Kids Wind-Down",
    durationMinutes: 40,
    mood: "quiet",
    suitableFor: ["adult", "elder"],
    accessibilityFriendly: true,
    personalize(members) {
      const elders = byRole(members, "elder");
      const adults = byRole(members, "adult");
      const kids = byRole(members, "child");
      const elder = firstName(elders, "elder");
      return {
        summary: kids.length
          ? `Kids asleep — short comedy for ${names(adults).slice(0, 2).join(" & ")}, tea, and a gentle care check-in for ${elder}.`
          : `Quiet wind-down for ${names(adults).slice(0, 2).join(" & ")} with soft volume and an early wrap.`,
        activities: [
          kids.length
            ? `Confirm ${names(kids).join(" & ")} wind-down done`
            : "Dim lights, soft volume",
          "Short comedy / calm episode + tea",
          elders.length ? `Care check-in note for ${elder}` : "Lights out on time",
        ],
        whyForMembers: [
          ...adults.slice(0, 2).map((a) => `${a.name}: ${a.preferences[0] ?? "quiet evening"}`),
          ...elders.map((e) => `${e.name}: evening care check-in`),
        ],
        chips: kids.length
          ? ["After kids", "Quiet volume", "Care check-in", "Short"]
          : ["Quiet volume", "Short", "Early wrap"],
        timeline: [
          {
            offsetMinutes: 0,
            label: kids.length ? "Kids confirmed asleep" : "Settle in",
            forMembers: names(adults),
          },
          { offsetMinutes: 5, label: "Calm episode + tea", forMembers: names(adults) },
          {
            offsetMinutes: 30,
            label: elders.length ? `${elder} care check-in` : "Wrap for morning",
            forMembers: elders.length ? [elder] : names(adults),
          },
        ],
      };
    },
  },
];

function moodMatches(optionMood: string, requested: string): boolean {
  const mood = requested.toLowerCase();
  if (mood === "any" || mood === "") return true;
  if (optionMood.includes(mood) || mood.includes(optionMood)) return true;
  if (["low-key", "relaxed", "calm"].includes(mood)) {
    return ["cozy", "quiet", "playful"].includes(optionMood);
  }
  return false;
}

function materialize(template: PlanTemplate, household: HouseholdProfile): EveningPlanOption {
  const personal = template.personalize(household.members);
  const base: EveningPlanOption = {
    id: template.id,
    title: template.title,
    durationMinutes: template.durationMinutes,
    mood: template.mood,
    suitableFor: template.suitableFor,
    accessibilityFriendly: template.accessibilityFriendly,
    summary: personal.summary,
    activities: personal.activities,
    whyForMembers: personal.whyForMembers,
    chips: personal.chips,
    timeline: personal.timeline,
  };
  base.constraintWarnings = constraintWarnings(base, household);
  base.visualCard = buildVisualCard(base, household);
  return base;
}

export function getPlanCatalog(household: HouseholdProfile): EveningPlanOption[] {
  return PLAN_TEMPLATES.map((t) => materialize(t, household));
}

export class HearthStore {
  private households: Map<string, HouseholdProfile>;
  activeHouseholdKey: string;
  reminders: Reminder[] = [];
  checkins: CareCheckin[] = [];
  confirmedPlan: ConfirmedPlan | null = null;
  activeScenario: string | null = null;
  turnLog: Array<{ at: string; event: string; detail?: string }> = [];

  constructor() {
    this.households = loadAllHouseholds();
    this.activeHouseholdKey = this.households.has("rivera")
      ? "rivera"
      : [...this.households.keys()][0];
  }

  get household(): HouseholdProfile {
    return this.households.get(this.activeHouseholdKey)!;
  }

  listHouseholds() {
    return HOUSEHOLD_PRESETS.filter((p) => this.households.has(p.id)).map((p) => ({
      ...p,
      active: p.id === this.activeHouseholdKey,
      memberCount: this.households.get(p.id)!.members.length,
    }));
  }

  setActiveHousehold(householdKey: string) {
    if (!this.households.has(householdKey)) {
      throw new Error(`Unknown household: ${householdKey}`);
    }
    this.activeHouseholdKey = householdKey;
    this.reminders = [];
    this.checkins = [];
    this.confirmedPlan = null;
    this.activeScenario = null;
    this.turnLog = [
      {
        at: new Date().toISOString(),
        event: "household_switched",
        detail: householdKey,
      },
    ];
    return this.getHouseholdProfile();
  }

  getHouseholdProfile() {
    return {
      ...this.household,
      presetKey: this.activeHouseholdKey,
      activeScenario: this.activeScenario,
      availableHouseholds: this.listHouseholds(),
    };
  }

  setScenario(scenarioId: string | null) {
    this.activeScenario = scenarioId;
  }

  suggestEveningPlan(input: {
    mood?: string;
    durationMinutes?: number;
    includeKids?: boolean;
    includeElder?: boolean;
  }): EveningPlanOption[] {
    const mood = input.mood ?? "cozy";
    const duration = input.durationMinutes ?? 90;
    const hasKids = byRole(this.household.members, "child").length > 0;
    const hasElder = byRole(this.household.members, "elder").length > 0;
    const includeKids = input.includeKids ?? hasKids;
    const includeElder = input.includeElder ?? hasElder;
    const catalog = getPlanCatalog(this.household);

    const plans = catalog
      .filter((option) => {
        if (includeKids && option.id === "plan-adults-late") return false;
        if (
          !includeKids &&
          option.suitableFor.includes("child") &&
          option.id !== "plan-adults-late"
        ) {
          return !option.suitableFor.includes("child");
        }
        if (!includeKids) {
          return !option.suitableFor.includes("child") || option.id === "plan-adults-late";
        }
        if (includeElder && !option.suitableFor.includes("elder") && hasElder) return false;
        if (!moodMatches(option.mood, mood)) return false;
        return option.durationMinutes <= duration + 20;
      })
      .slice(0, 3);

    this.turnLog.push({
      at: new Date().toISOString(),
      event: "suggest_evening_plan",
      detail: plans.map((p) => p.id).join(","),
    });
    return plans;
  }

  createReminder(input: {
    title: string;
    when: string;
    relatedPlanId?: string;
    memberId?: string;
  }): Reminder {
    const member = input.memberId
      ? resolveMemberOrThrow(this.household.members, input.memberId)
      : undefined;
    const reminder: Reminder = {
      id: `rem-${Date.now()}`,
      title: input.title,
      when: input.when,
      relatedPlanId: input.relatedPlanId,
      memberId: member?.id,
      memberName: member?.name,
      createdAt: new Date().toISOString(),
    };
    this.reminders.push(reminder);
    this.turnLog.push({
      at: reminder.createdAt,
      event: "reminder",
      detail: member ? `${reminder.title} → ${member.name}` : reminder.title,
    });
    return reminder;
  }

  logCareCheckin(input: {
    memberId: string;
    status: CareCheckin["status"];
    notes: string;
  }): CareCheckin {
    // Care check-ins default soft-fallback to elder when the ref is unknown
    // (demo-friendly: Alexa often says "grandma" / omits an id).
    const member = resolveMemberOrThrow(this.household.members, input.memberId, {
      fallbackRole: "elder",
    });
    const checkin: CareCheckin = {
      id: `chk-${Date.now()}`,
      memberId: member.id,
      memberName: member.name,
      status: input.status,
      notes: input.notes,
      createdAt: new Date().toISOString(),
    };
    this.checkins.push(checkin);
    this.turnLog.push({
      at: checkin.createdAt,
      event: "care_checkin",
      detail: `${member.name}:${input.status}`,
    });
    return checkin;
  }

  confirmPlan(input: { planId: string; notes?: string }): ConfirmedPlan {
    const option = getPlanCatalog(this.household).find((o) => o.id === input.planId);
    if (!option) {
      throw new Error(`Unknown planId: ${input.planId}`);
    }
    const confirmed: ConfirmedPlan = {
      planId: input.planId,
      option,
      confirmedAt: new Date().toISOString(),
      notes: input.notes,
    };
    this.confirmedPlan = confirmed;
    this.turnLog.push({
      at: confirmed.confirmedAt,
      event: "confirm_plan",
      detail: input.planId,
    });
    return confirmed;
  }

  getPlanVisual(planId?: string) {
    const id = planId ?? this.confirmedPlan?.planId;
    if (!id) {
      throw new Error("No planId provided and no confirmed plan");
    }
    const option =
      this.confirmedPlan?.planId === id
        ? this.confirmedPlan.option
        : getPlanCatalog(this.household).find((o) => o.id === id);
    if (!option?.visualCard) {
      throw new Error(`No visual card for plan ${id}`);
    }
    return option.visualCard;
  }

  getEveningState() {
    return {
      householdKey: this.activeHouseholdKey,
      householdName: this.household.name,
      activeScenario: this.activeScenario,
      confirmedPlan: this.confirmedPlan,
      reminders: this.reminders,
      checkins: this.checkins,
      accessibilityNotes: this.household.accessibilityNotes,
      constraintWarnings: this.confirmedPlan?.option.constraintWarnings ?? [],
      turnLog: this.turnLog.slice(-12),
      members: this.household.members.map((m) => ({
        id: m.id,
        name: m.name,
        role: m.role,
      })),
    };
  }

  snapshot() {
    return {
      householdKey: this.activeHouseholdKey,
      householdId: this.household.householdId,
      activeScenario: this.activeScenario,
      reminders: this.reminders,
      checkins: this.checkins,
      confirmedPlan: this.confirmedPlan,
      turnLogCount: this.turnLog.length,
    };
  }
}

export const store = new HearthStore();
