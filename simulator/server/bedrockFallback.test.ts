import { afterAll, beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import type { Server } from "node:http";

vi.mock("@aws-sdk/client-bedrock-runtime", () => {
  class ConverseCommand {
    input: unknown;
    constructor(input: unknown) {
      this.input = input;
    }
  }
  class BedrockRuntimeClient {
    send() {
      return Promise.reject(new Error("Simulated Bedrock AccessDeniedException"));
    }
  }
  return { BedrockRuntimeClient, ConverseCommand };
});

import { createSimulatorApp } from "./app.js";
import { bedrockEnabled } from "./bedrockAgent.js";
import { createMockMcp } from "./test/mockMcp.js";

describe("bedrockEnabled", () => {
  const prev = { ...process.env };

  afterAll(() => {
    process.env = { ...prev };
  });

  it("is false when HEARTH_FORCE_OFFLINE=1 even in demo mode", () => {
    process.env.HEARTH_FORCE_OFFLINE = "1";
    delete process.env.HEARTH_LIVE_AWS;
    process.env.AWS_ACCESS_KEY_ID = "AKIAEXAMPLE";
    expect(bedrockEnabled()).toBe(false);
  });

  it("is true in demo mode without AWS credentials", () => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    delete process.env.HEARTH_LIVE_AWS;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_PROFILE;
    expect(bedrockEnabled()).toBe(true);
  });

  it("is true in live mode when credentials exist", () => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    process.env.HEARTH_LIVE_AWS = "1";
    process.env.AWS_ACCESS_KEY_ID = "AKIAEXAMPLE";
    expect(bedrockEnabled()).toBe(true);
  });

  it("is false in live mode without credentials", () => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    process.env.HEARTH_LIVE_AWS = "1";
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_PROFILE;
    delete process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI;
    delete process.env.AWS_WEB_IDENTITY_TOKEN_FILE;
    expect(bedrockEnabled()).toBe(false);
  });
});

describe("POST /api/chat Bedrock → offline fallback", () => {
  let server: Server;
  let baseUrl: string;
  const prev = {
    force: process.env.HEARTH_FORCE_OFFLINE,
    live: process.env.HEARTH_LIVE_AWS,
    key: process.env.AWS_ACCESS_KEY_ID,
    apiKey: process.env.HEARTH_API_KEY,
  };

  beforeAll(async () => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    delete process.env.HEARTH_API_KEY;
    // Force live Bedrock path so the mocked Converse failure exercises fallback
    process.env.HEARTH_LIVE_AWS = "1";
    process.env.AWS_ACCESS_KEY_ID = "AKIA_TEST_FALLBACK";

    const app = createSimulatorApp({
      mcp: createMockMcp(),
      serveStatic: false,
    });
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    if (prev.force === undefined) delete process.env.HEARTH_FORCE_OFFLINE;
    else process.env.HEARTH_FORCE_OFFLINE = prev.force;
    if (prev.live === undefined) delete process.env.HEARTH_LIVE_AWS;
    else process.env.HEARTH_LIVE_AWS = prev.live;
    if (prev.key === undefined) delete process.env.AWS_ACCESS_KEY_ID;
    else process.env.AWS_ACCESS_KEY_ID = prev.key;
    if (prev.apiKey === undefined) delete process.env.HEARTH_API_KEY;
    else process.env.HEARTH_API_KEY = prev.apiKey;

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    process.env.HEARTH_LIVE_AWS = "1";
    process.env.AWS_ACCESS_KEY_ID = "AKIA_TEST_FALLBACK";
  });

  it("falls back to offline MCP agent when Converse fails", async () => {
    expect(bedrockEnabled()).toBe(true);

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Plan a low-key evening for me, the kids, and grandma",
        scenario: "weekend",
        household: "rivera",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("offline");
    expect(body.reply).toMatch(/Bedrock unavailable|offline MCP/i);
    expect(body.planCard).toBeTruthy();
    expect(Array.isArray(body.toolCalls)).toBe(true);
    expect(body.toolCalls.length).toBeGreaterThanOrEqual(4);
  });
});

describe("POST /api/chat virtual Bedrock demo", () => {
  let server: Server;
  let baseUrl: string;
  const prev = {
    force: process.env.HEARTH_FORCE_OFFLINE,
    live: process.env.HEARTH_LIVE_AWS,
    apiKey: process.env.HEARTH_API_KEY,
    delay: process.env.HEARTH_VIRTUAL_BEDROCK_MS,
  };

  beforeAll(async () => {
    delete process.env.HEARTH_FORCE_OFFLINE;
    delete process.env.HEARTH_LIVE_AWS;
    delete process.env.HEARTH_API_KEY;
    process.env.HEARTH_VIRTUAL_BEDROCK_MS = "0";

    const app = createSimulatorApp({
      mcp: createMockMcp(),
      serveStatic: false,
    });
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    baseUrl = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    if (prev.force === undefined) delete process.env.HEARTH_FORCE_OFFLINE;
    else process.env.HEARTH_FORCE_OFFLINE = prev.force;
    if (prev.live === undefined) delete process.env.HEARTH_LIVE_AWS;
    else process.env.HEARTH_LIVE_AWS = prev.live;
    if (prev.apiKey === undefined) delete process.env.HEARTH_API_KEY;
    else process.env.HEARTH_API_KEY = prev.apiKey;
    if (prev.delay === undefined) delete process.env.HEARTH_VIRTUAL_BEDROCK_MS;
    else process.env.HEARTH_VIRTUAL_BEDROCK_MS = prev.delay;

    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("returns Bedrock-shaped demo response without AWS", async () => {
    expect(bedrockEnabled()).toBe(true);

    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        message: "Plan a low-key evening for me, the kids, and grandma",
        scenario: "weekend",
        household: "rivera",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.mode).toBe("bedrock");
    expect(body.planCard).toBeTruthy();
    expect(body.awsServices).toEqual(
      expect.arrayContaining(["bedrock-runtime:Converse", "logs:PutLogEvents"]),
    );
    expect(body.reply).not.toMatch(/Bedrock unavailable/i);
  });
});
