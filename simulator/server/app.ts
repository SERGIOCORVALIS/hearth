import express, { type Express } from "express";
import cors from "cors";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { HOUSEHOLD_PRESETS, SCENARIOS, type ScenarioId } from "@hearth/shared";
import type { HearthMcpClient } from "./mcpClient.js";
import { runOfflineAgent } from "./offlineAgent.js";
import { bedrockEnabled, runBedrockAgent } from "./bedrockAgent.js";
import { getDemoScriptSteps } from "./demoScript.js";
import { isDemoNetwork } from "./demoNetwork.js";
import { optionalApiKeyAuth, resolveCorsOrigin } from "./security.js";
import { createRateLimiter } from "./rateLimit.js";

export type CreateSimulatorAppOptions = {
  mcp: HearthMcpClient;
  serveStatic?: boolean;
  staticDir?: string;
};

async function fetchMcpHealth(mcp: HearthMcpClient) {
  try {
    const base = mcp.mcpUrl.replace(/\/mcp\/?$/, "");
    const res = await fetch(`${base}/health`);
    if (!res.ok) return null;
    return (await res.json()) as {
      latency?: { avgMs: number | null; maxMs: number | null; under500ms: boolean };
    };
  } catch {
    return null;
  }
}

export function createSimulatorApp(options: CreateSimulatorAppOptions): Express {
  const { mcp } = options;
  const __dirname = dirname(fileURLToPath(import.meta.url));
  const staticDir = options.staticDir ?? join(__dirname, "..", "dist");
  const serveStatic =
    options.serveStatic ??
    (process.env.SERVE_STATIC === "1" && existsSync(join(staticDir, "index.html")));

  const app = express();
  app.use(cors({ origin: resolveCorsOrigin() }));
  app.use(express.json({ limit: "1mb" }));
  const requireApiKey = optionalApiKeyAuth();
  const chatRateLimit = createRateLimiter();

  app.get("/api/health", async (_req, res) => {
    try {
      const tools = await mcp.listTools();
      const mcpHealth = await fetchMcpHealth(mcp);
      let households = HOUSEHOLD_PRESETS;
      try {
        const listed = await mcp.callTool("list_households", {});
        if (Array.isArray(listed.result)) households = listed.result as typeof HOUSEHOLD_PRESETS;
      } catch {
        // keep presets
      }
      res.json({
        ok: true,
        agent: bedrockEnabled() ? "bedrock" : "offline",
        network: isDemoNetwork() ? "demo" : "live",
        mcp: mcp.info(),
        tools: tools.map((t) => t.name),
        latency: mcpHealth?.latency ?? null,
        scenarios: SCENARIOS,
        households,
      });
    } catch (error) {
      res.status(503).json({
        ok: false,
        agent: bedrockEnabled() ? "bedrock" : "offline",
        network: isDemoNetwork() ? "demo" : "live",
        mcp: mcp.info(),
        error: error instanceof Error ? error.message : String(error),
        scenarios: SCENARIOS,
        households: HOUSEHOLD_PRESETS,
      });
    }
  });

  app.get("/api/scenarios", (_req, res) => {
    res.json({ scenarios: SCENARIOS, households: HOUSEHOLD_PRESETS });
  });

  app.get("/api/demo-script", (req, res) => {
    const fast =
      req.query.fast === "1" ||
      process.env.HEARTH_DEMO_FAST === "1" ||
      process.env.HEARTH_DEMO_FAST === "true";
    res.json({ steps: getDemoScriptSteps(fast), fast });
  });

  app.get("/api/tools", async (_req, res) => {
    try {
      const tools = await mcp.listTools();
      res.json({ tools, mcp: mcp.info() });
    } catch (error) {
      res.status(503).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  app.post("/api/chat", chatRateLimit.middleware, requireApiKey, async (req, res) => {
    const message = String(req.body?.message ?? "").trim();
    const scenario = (req.body?.scenario as ScenarioId | null | undefined) ?? null;
    const household = (req.body?.household as string | null | undefined) ?? null;
    if (!message) {
      res.status(400).json({ error: "message is required" });
      return;
    }

    try {
      let result;
      if (bedrockEnabled()) {
        try {
          result = await runBedrockAgent(mcp, message, { scenario, household });
        } catch (error) {
          console.warn(
            "[hearth-sim] Bedrock failed, falling back to offline agent:",
            error instanceof Error ? error.message : error,
          );
          result = await runOfflineAgent(mcp, message, scenario, household);
          result = {
            ...result,
            reply: `${result.reply}\n\n_(Bedrock unavailable — used offline MCP agent)_`,
          };
        }
      } else {
        result = await runOfflineAgent(mcp, message, scenario, household);
      }

      const mcpHealth = await fetchMcpHealth(mcp);
      res.json({
        ...result,
        toolLatency: mcpHealth?.latency ?? null,
      });
    } catch (error) {
      console.error("[hearth-sim] /api/chat error", error);
      res.status(500).json({
        error: error instanceof Error ? error.message : String(error),
      });
    }
  });

  if (serveStatic) {
    app.use(express.static(staticDir));
    app.get(/^(?!\/api).*/, (_req, res) => {
      res.sendFile(join(staticDir, "index.html"));
    });
  }

  return app;
}
