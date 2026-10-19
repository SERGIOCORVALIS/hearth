import { afterEach, describe, expect, it } from "vitest";
import { cloudWatchEnabled, cloudWatchLogGroup, putHearthCloudWatchEvent } from "./cloudwatch.js";

describe("cloudWatch helpers", () => {
  const prev = { ...process.env };

  afterEach(() => {
    process.env = { ...prev };
  });

  it("enabled by default in demo network mode", () => {
    expect(cloudWatchEnabled({})).toBe(true);
  });

  it("in live mode requires log group or dry-run", () => {
    const live = { HEARTH_LIVE_AWS: "1" };
    expect(cloudWatchEnabled(live)).toBe(false);
    expect(cloudWatchEnabled({ ...live, HEARTH_CLOUDWATCH_LOG_GROUP: "/hearth/aws-builder" })).toBe(
      true,
    );
    expect(cloudWatchEnabled({ ...live, HEARTH_CLOUDWATCH_DRY_RUN: "1" })).toBe(true);
  });

  it("defaults log group name", () => {
    expect(cloudWatchLogGroup({})).toBe("/hearth/aws-builder");
    expect(cloudWatchLogGroup({ HEARTH_CLOUDWATCH_LOG_GROUP: " /custom " })).toBe("/custom");
  });

  it("demo / dry-run put returns ok without AWS calls", async () => {
    delete process.env.HEARTH_LIVE_AWS;
    delete process.env.HEARTH_CLOUDWATCH_LOG_GROUP;
    const result = await putHearthCloudWatchEvent({
      service: "hearth",
      kind: "bedrock_proof",
      region: "us-east-1",
      modelId: "anthropic.claude-3-haiku-20240307-v1:0",
      latencyMs: 12,
      awsServices: ["bedrock-runtime:Converse"],
    });
    expect(result.ok).toBe(true);
    expect(result.dryRun).toBe(true);
    expect(result.group).toBe("/hearth/aws-builder");
  });
});
