import { describe, expect, it, vi } from "vitest";
import { isDemoFast, runDemoSteps, shouldAutoStartDemo, type DemoStep } from "./demoPlayer";

const STEPS: DemoStep[] = [
  {
    household: "rivera",
    scenario: "weekend",
    message: "Plan a low-key evening for me, the kids, and grandma",
    pauseMs: 10,
  },
  {
    household: "okonkwo",
    scenario: "elder-visiting",
    message: "Plan an accessible evening and log a care check-in for our elder",
    pauseMs: 10,
  },
];

describe("shouldAutoStartDemo", () => {
  it("starts only when demo=1 is present", () => {
    expect(shouldAutoStartDemo("?demo=1")).toBe(true);
    expect(shouldAutoStartDemo("?foo=1&demo=1")).toBe(true);
    expect(shouldAutoStartDemo("?demo=0")).toBe(false);
    expect(shouldAutoStartDemo("")).toBe(false);
  });
});

describe("isDemoFast", () => {
  it("detects fast mode query flags", () => {
    expect(isDemoFast("?demo=1&fast=1")).toBe(true);
    expect(isDemoFast("?demoFast=1")).toBe(true);
    expect(isDemoFast("?demo=1")).toBe(false);
  });
});

describe("runDemoSteps", () => {
  it("sends every step even when a busyRef would have been true mid-flight", async () => {
    const busyRef = { current: false };
    const sent: Array<{ message: string; household: string }> = [];

    const send = vi.fn(async (message: string, opts: { household: string; scenario: string }) => {
      // Mimic App.send: ignore if busy — but runDemoSteps awaits, so second step waits.
      if (busyRef.current) return;
      busyRef.current = true;
      sent.push({ message, household: opts.household });
      await Promise.resolve();
      busyRef.current = false;
    });

    const sleep = vi.fn(async () => undefined);
    const count = await runDemoSteps(STEPS, send, {
      sleep,
      betweenStepsMs: 5,
    });

    expect(count).toBe(2);
    expect(sent).toHaveLength(2);
    expect(sent[0].household).toBe("rivera");
    expect(sent[1].household).toBe("okonkwo");
    expect(send).toHaveBeenCalledTimes(2);
  });

  it("invokes onStep before each send for UI sync", async () => {
    const onStep = vi.fn();
    const send = vi.fn(async () => undefined);
    await runDemoSteps(STEPS, send, {
      sleep: async () => undefined,
      betweenStepsMs: 0,
      onStep,
    });
    expect(onStep).toHaveBeenCalledTimes(2);
    expect(onStep.mock.calls[0][0].household).toBe("rivera");
  });
});
