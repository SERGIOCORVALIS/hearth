export type DemoStep = {
  household: string;
  scenario: string;
  message: string;
  pauseMs: number;
  label?: string;
};

export type DemoSend = (
  message: string,
  opts: { scenario: string; household: string },
) => Promise<void>;

/**
 * Runs demo steps sequentially. Callers must await `send` so a busyRef lock
 * cannot skip the second household (BUG-005).
 */
export async function runDemoSteps(
  steps: DemoStep[],
  send: DemoSend,
  options: {
    sleep?: (ms: number) => Promise<void>;
    betweenStepsMs?: number;
    onStep?: (step: DemoStep, index: number) => void;
  } = {},
): Promise<number> {
  const sleep = options.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
  const betweenStepsMs = options.betweenStepsMs ?? 1800;
  let sent = 0;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    options.onStep?.(step, i);
    await sleep(step.pauseMs);
    await send(step.message, {
      household: step.household,
      scenario: step.scenario,
    });
    sent += 1;
    if (i < steps.length - 1) {
      await sleep(betweenStepsMs);
    }
  }

  return sent;
}

export function shouldAutoStartDemo(search: string): boolean {
  return new URLSearchParams(search).get("demo") === "1";
}

export function isDemoFast(search: string): boolean {
  const params = new URLSearchParams(search);
  return params.get("fast") === "1" || params.get("demoFast") === "1";
}
