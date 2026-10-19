import { afterEach, describe, expect, it } from "vitest";
import { isDemoNetwork, virtualBedrockDelayMs } from "./demoNetwork.js";

describe("demoNetwork", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("defaults to demo / virtual networking", () => {
    delete process.env.HEARTH_LIVE_AWS;
    delete process.env.HEARTH_DEMO;
    expect(isDemoNetwork({})).toBe(true);
  });

  it("opts out with HEARTH_LIVE_AWS=1", () => {
    expect(isDemoNetwork({ HEARTH_LIVE_AWS: "1" })).toBe(false);
  });

  it("opts out with HEARTH_DEMO=0", () => {
    expect(isDemoNetwork({ HEARTH_DEMO: "0" })).toBe(false);
  });

  it("reads virtual Bedrock delay", () => {
    expect(virtualBedrockDelayMs({})).toBe(120);
    expect(virtualBedrockDelayMs({ HEARTH_VIRTUAL_BEDROCK_MS: "50" })).toBe(50);
  });
});
