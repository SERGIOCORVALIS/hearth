import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import type { Server } from "node:http";
import { createSimulatorApp } from "./app.js";
import { createMockMcp } from "./test/mockMcp.js";

describe("simulator API /api/chat", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.HEARTH_FORCE_OFFLINE = "1";
    delete process.env.HEARTH_API_KEY;
    delete process.env.HEARTH_RATE_LIMIT_RPM;
    delete process.env.AWS_ACCESS_KEY_ID;
    delete process.env.AWS_PROFILE;
    delete process.env.AWS_REGION;

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
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  beforeEach(() => {
    process.env.HEARTH_FORCE_OFFLINE = "1";
  });

  it("rejects empty chat messages", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "   " }),
    });
    expect(res.status).toBe(400);
    const body = await res.json();
    expect(body.error).toMatch(/message is required/i);
  });

  it("returns offline agent plan for a family evening prompt", async () => {
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
    expect(body.reply).toBeTruthy();
    expect(Array.isArray(body.toolCalls)).toBe(true);
    expect(body.toolCalls.length).toBeGreaterThanOrEqual(4);
    expect(body.planCard?.planId ?? body.planCard?.option?.id).toBeTruthy();
    expect(body.knowledgeHits?.length).toBeGreaterThan(0);
  });

  it("exposes full-surface demo script across households", async () => {
    const res = await fetch(`${baseUrl}/api/demo-script`);
    expect(res.ok).toBe(true);
    const body = await res.json();
    expect(body.steps.length).toBeGreaterThanOrEqual(8);
    expect(body.steps[0].household).toBe("rivera");
    expect(body.steps.some((s: { household: string }) => s.household === "park")).toBe(true);
    expect(body.steps.some((s: { household: string }) => s.household === "okonkwo")).toBe(true);
    expect(
      body.steps.some((s: { message: string }) => /DEMO_SHOWCASE_SURFACE/i.test(s.message)),
    ).toBe(true);
    expect(
      body.steps.some((s: { message: string }) => /DEMO_EVENING_BRIEFING/i.test(s.message)),
    ).toBe(true);
  });

  it("reports health with offline agent when MCP tools list", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.ok).toBe(true);
    expect(body.agent).toBe("offline");
    expect(body.tools).toContain("suggest_evening_plan");
  });
});

describe("simulator API auth gate", () => {
  let server: Server;
  let baseUrl: string;

  beforeAll(async () => {
    process.env.HEARTH_FORCE_OFFLINE = "1";
    process.env.HEARTH_API_KEY = "test-tunnel-key";

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
    delete process.env.HEARTH_API_KEY;
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("rejects chat without API key when HEARTH_API_KEY is set", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message: "Plan tonight" }),
    });
    expect(res.status).toBe(401);
  });

  it("accepts chat with Bearer token", async () => {
    const res = await fetch(`${baseUrl}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: "Bearer test-tunnel-key",
      },
      body: JSON.stringify({
        message: "Plan a low-key evening for me, the kids, and grandma",
        scenario: "weekend",
        household: "rivera",
      }),
    });
    expect(res.status).toBe(200);
    const body = await res.json();
    expect(body.reply).toBeTruthy();
  });

  it("keeps /api/health public", async () => {
    const res = await fetch(`${baseUrl}/api/health`);
    expect(res.status).toBe(200);
  });
});
