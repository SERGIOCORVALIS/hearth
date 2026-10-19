import { describe, expect, it, beforeEach } from "vitest";
import { parseHouseholdProfile } from "@hearth/shared";
import { HearthStore, loadHouseholdFromJson } from "./store.js";

describe("household JSON validation", () => {
  it("accepts a well-formed profile", () => {
    const profile = parseHouseholdProfile({
      householdId: "hh-test",
      name: "Test Home",
      timezone: "UTC",
      members: [
        {
          id: "m-1",
          name: "Ada",
          role: "adult",
          preferences: ["tea"],
          constraints: [],
        },
      ],
      sharedPreferences: [],
      accessibilityNotes: ["captions"],
    });
    expect(profile.name).toBe("Test Home");
  });

  it("rejects missing members and invalid roles", () => {
    expect(() =>
      parseHouseholdProfile({
        householdId: "hh-bad",
        name: "Bad",
        timezone: "UTC",
        members: [],
        sharedPreferences: [],
        accessibilityNotes: [],
      }),
    ).toThrow(/Invalid household profile/);

    expect(() =>
      loadHouseholdFromJson(
        JSON.stringify({
          householdId: "hh-bad",
          name: "Bad",
          timezone: "UTC",
          members: [
            {
              id: "m-1",
              name: "Ada",
              role: "pet",
              preferences: [],
              constraints: [],
            },
          ],
          sharedPreferences: [],
          accessibilityNotes: [],
        }),
        "bad.json",
      ),
    ).toThrow(/bad\.json|Invalid household/);
  });
});

describe("HearthStore", () => {
  let store: HearthStore;

  beforeEach(() => {
    store = new HearthStore();
  });

  it("loads Rivera household with elder accessibility notes", () => {
    const profile = store.getHouseholdProfile();
    expect(profile.name).toBe("Rivera Household");
    expect(profile.members.some((m) => m.id === "m-elena")).toBe(true);
    expect(profile.accessibilityNotes.length).toBeGreaterThan(0);
  });

  it("suggests personalized plans with why/chips/timeline", () => {
    const plans = store.suggestEveningPlan({
      mood: "low-key",
      durationMinutes: 95,
      includeKids: true,
      includeElder: true,
    });
    expect(plans.length).toBeGreaterThan(0);
    const first = plans[0];
    expect(first.whyForMembers?.length).toBeGreaterThan(0);
    expect(first.chips?.length).toBeGreaterThan(0);
    expect(first.timeline?.length).toBeGreaterThan(0);
    expect(first.summary).toMatch(/Elena|Grandma|captions/i);
  });

  it("excludes kids plans when includeKids is false", () => {
    const plans = store.suggestEveningPlan({
      mood: "quiet",
      durationMinutes: 60,
      includeKids: false,
      includeElder: true,
    });
    expect(plans.every((p) => !p.suitableFor.includes("child"))).toBe(true);
  });

  it("confirms a plan and exposes evening state", () => {
    const confirmed = store.confirmPlan({
      planId: "plan-cozy-classic",
      notes: "test",
    });
    expect(confirmed.planId).toBe("plan-cozy-classic");
    expect(confirmed.option.timeline?.length).toBeGreaterThan(0);

    store.createReminder({
      title: "Start film",
      when: "in 15 minutes",
      relatedPlanId: "plan-cozy-classic",
    });
    store.logCareCheckin({
      memberId: "m-elena",
      status: "ok",
      notes: "captions on",
    });

    const state = store.getEveningState();
    expect(state.confirmedPlan?.planId).toBe("plan-cozy-classic");
    expect(state.reminders).toHaveLength(1);
    expect(state.checkins[0]?.memberName).toMatch(/Elena/);
  });

  it("resolves care check-in by role alias and display name", () => {
    const byRole = store.logCareCheckin({
      memberId: "elder",
      status: "ok",
      notes: "role alias",
    });
    expect(byRole.memberId).toBe("m-elena");

    const byName = store.logCareCheckin({
      memberId: "Elena",
      status: "resting",
      notes: "name",
    });
    expect(byName.memberId).toBe("m-elena");
    expect(byName.memberName).toMatch(/Elena/);
  });

  it("falls back to elder for unknown care check-in ids", () => {
    const checkin = store.logCareCheckin({
      memberId: "m-nobody",
      status: "ok",
      notes: "x",
    });
    expect(checkin.memberName).toMatch(/Elena/);
  });

  it("rejects care check-in when household has no elder", () => {
    store.setActiveHousehold("park");
    expect(() =>
      store.logCareCheckin({
        memberId: "m-nobody",
        status: "ok",
        notes: "x",
      }),
    ).toThrow(/Unknown memberId/);
  });

  it("attaches role-resolved member to reminders", () => {
    const reminder = store.createReminder({
      title: "Cocoa for grandma",
      when: "in 5 minutes",
      memberId: "grandma",
    });
    expect(reminder.memberId).toBe("m-elena");
    expect(reminder.memberName).toMatch(/Elena/);
  });

  it("switches households and clears evening state", () => {
    store.confirmPlan({ planId: "plan-cozy-classic" });
    store.setActiveHousehold("okonkwo");
    const profile = store.getHouseholdProfile();
    expect(profile.name).toMatch(/Okonkwo/);
    expect(store.getEveningState().confirmedPlan).toBeNull();
  });
});
