import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { spawn, type ChildProcess } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PORT = 3211;
const BASE = `http://127.0.0.1:${PORT}`;

async function waitForHealth(timeoutMs = 15000): Promise<void> {
  const started = Date.now();
  while (Date.now() - started < timeoutMs) {
    try {
      const res = await fetch(`${BASE}/health`);
      if (res.ok) return;
    } catch {
      // retry
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error("OSS starter health check timed out");
}

describe("streamable-http-mcp-starter smoke", () => {
  let child: ChildProcess | null = null;

  beforeAll(async () => {
    const entry = join(__dirname, "..", "dist", "index.js");
    child = spawn(process.execPath, [entry], {
      cwd: join(__dirname, ".."),
      env: {
        ...process.env,
        PORT: String(PORT),
        HOST: "127.0.0.1",
      },
      stdio: "pipe",
    });
    await waitForHealth();
  }, 20000);

  afterAll(() => {
    if (child?.pid) child.kill("SIGTERM");
  });

  it("serves health and initializes MCP with ping", async () => {
    const health = await fetch(`${BASE}/health`).then((r) => r.json());
    expect(health.protocolVersion).toBe("2025-11-25");
    expect(health.transport).toBe("streamable-http");

    const client = new Client({ name: "oss-smoke", version: "1.0.0" });
    const transport = new StreamableHTTPClientTransport(new URL(`${BASE}/mcp`));
    await client.connect(transport);

    const tools = await client.listTools();
    expect(tools.tools.map((t) => t.name)).toContain("ping");

    const pinged = await client.callTool({
      name: "ping",
      arguments: { message: "hearth-oss" },
    });
    const text = Array.isArray(pinged.content)
      ? pinged.content.find((c) => "text" in c && c.type === "text")
      : null;
    expect(text && "text" in text ? text.text : "").toMatch(/hearth-oss|pong/);

    await transport.close().catch(() => undefined);
  }, 20000);
});
