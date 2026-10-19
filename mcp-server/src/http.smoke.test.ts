import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawn, type ChildProcess } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3111;
const MCP_URL = `http://127.0.0.1:${PORT}/mcp`;

async function waitForHealth(timeoutMs = 15000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`http://127.0.0.1:${PORT}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("MCP server health check timed out");
}

describe("Streamable HTTP MCP smoke", () => {
  let child: ChildProcess | null = null;

  beforeAll(async () => {
    const tsxCli = join(__dirname, "..", "..", "node_modules", "tsx", "dist", "cli.mjs");
    child = spawn(process.execPath, [tsxCli, join(__dirname, "index.ts")], {
      cwd: join(__dirname, ".."),
      env: {
        ...process.env,
        MCP_PORT: String(PORT),
        MCP_HOST: "127.0.0.1",
        HEARTH_API_KEY: "",
        HEARTH_CORS_ORIGINS: "*",
        HEARTH_RATE_LIMIT_RPM: "",
      },
      stdio: "pipe",
    });
    await waitForHealth();
  }, 20000);

  afterAll(async () => {
    if (child?.pid) {
      child.kill("SIGTERM");
    }
  });

  it("lists tools and calls suggest + confirm over Streamable HTTP", async () => {
    const client = new Client({ name: "vitest-smoke", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(MCP_URL));
    await client.connect(transport);

    const tools = await client.listTools();
    const names = tools.tools.map((t) => t.name);
    expect(names).toContain("suggest_evening_plan");
    expect(names).toContain("get_evening_state");

    const suggested = await client.callTool({
      name: "suggest_evening_plan",
      arguments: {
        mood: "cozy",
        durationMinutes: 90,
        includeKids: true,
        includeElder: true,
      },
    });
    expect(suggested.content).toBeTruthy();

    const sugText = Array.isArray(suggested.content)
      ? suggested.content.find((c) => "text" in c && c.type === "text")
      : null;
    const sugBody = sugText && "text" in sugText ? sugText.text : "";
    const plans = JSON.parse(sugBody) as Array<{ id: string }>;
    expect(plans.length).toBeGreaterThan(0);
    const planId = plans[0]!.id;
    expect(planId).toMatch(/^plan-/);

    const confirmed = await client.callTool({
      name: "confirm_plan",
      arguments: { planId },
    });
    const text = Array.isArray(confirmed.content)
      ? confirmed.content.find((c) => "text" in c && c.type === "text")
      : null;
    expect(text && "text" in text ? text.text : "").toContain(planId);

    await transport.close().catch(() => undefined);
  }, 20000);
});
