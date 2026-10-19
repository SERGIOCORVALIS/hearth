import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { MCP_PROTOCOL_VERSION } from "@hearth/shared";
import { createHearthServer } from "./server.js";
import { store } from "./store.js";
import { latencySummary } from "./metrics.js";
import { apiKeyConfigured, optionalApiKeyAuth, resolveCorsOrigin } from "./security.js";
import { SessionStore } from "./sessions.js";
import { mountOAuthScaffold, oauthScaffoldEnabled } from "./oauthScaffold.js";
import { createRateLimiter, rateLimitRpm } from "./rateLimit.js";

const PORT = Number(process.env.MCP_PORT ?? 3100);
const HOST = process.env.MCP_HOST ?? "127.0.0.1";
const __dirname = dirname(fileURLToPath(import.meta.url));
const addonRoot = join(__dirname, "..", "..", "alexa-addon");
const publicBase =
  process.env.HEARTH_PUBLIC_BASE_URL?.trim() || `http://${HOST}:${PORT}`;

const app = express();
app.use(
  cors({
    origin: resolveCorsOrigin(),
    exposedHeaders: ["Mcp-Session-Id", "mcp-session-id", "Retry-After", "X-RateLimit-Limit"],
  }),
);
app.use(express.json({ limit: "4mb" }));
app.use(express.urlencoded({ extended: false }));

// Real legal pages + PNG assets for Alexa+ add-on packaging (via tunnel HTTPS)
app.use("/legal", express.static(join(addonRoot, "legal")));
app.use("/assets", express.static(join(addonRoot, "assets")));

if (oauthScaffoldEnabled()) {
  mountOAuthScaffold(app, {
    publicBaseUrl: publicBase,
    apiKey: apiKeyConfigured(),
  });
}

const sessions = new SessionStore();
const requireMcpAuth = optionalApiKeyAuth();
const mcpRateLimit = createRateLimiter();

const sweepMs = Number(process.env.HEARTH_SESSION_SWEEP_MS ?? 60_000);
const sweepTimer = setInterval(() => {
  sessions.purgeExpired();
}, sweepMs);
sweepTimer.unref?.();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    service: "hearth-mcp",
    protocolVersion: MCP_PROTOCOL_VERSION,
    transport: "streamable-http",
    endpoint: "/mcp",
    alexaPlusLatencyTargetMs: 500,
    latency: latencySummary(),
    snapshot: store.snapshot(),
    security: {
      apiKeyRequired: Boolean(apiKeyConfigured()),
      cors: process.env.HEARTH_CORS_ORIGINS?.trim() || "*",
      sessionTtlMs: Number(process.env.HEARTH_SESSION_TTL_MS ?? 30 * 60 * 1000),
      maxSessions: Number(process.env.HEARTH_MAX_SESSIONS ?? 100),
      activeSessions: sessions.size,
      rateLimitRpm: rateLimitRpm() || null,
      oauthScaffold: oauthScaffoldEnabled(),
      publicBaseUrl: publicBase,
      prm: "/.well-known/oauth-protected-resource",
      authorizationServerMetadata: "/.well-known/oauth-authorization-server",
    },
  });
});

app.post("/mcp", mcpRateLimit.middleware, requireMcpAuth, async (req, res) => {
  try {
    const sessionIdHeader = req.headers["mcp-session-id"];
    const sessionId = typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;

    const session = sessionId ? sessions.get(sessionId) : undefined;

    if (session) {
      await session.transport.handleRequest(req, res, req.body);
      return;
    }

    if (!sessionId && isInitializeRequest(req.body)) {
      const transport = new StreamableHTTPServerTransport({
        sessionIdGenerator: () => randomUUID(),
        onsessioninitialized: (id) => {
          sessions.set(id, transport);
        },
      });

      transport.onclose = () => {
        const id = transport.sessionId;
        if (id) sessions.delete(id);
      };

      const server = createHearthServer();
      await server.connect(transport);
      await transport.handleRequest(req, res, req.body);
      return;
    }

    res.status(400).json({
      jsonrpc: "2.0",
      error: {
        code: -32000,
        message: "Bad Request: missing or invalid MCP session. Send initialize first.",
      },
      id: null,
    });
  } catch (error) {
    console.error("[hearth-mcp] POST /mcp error", error);
    if (!res.headersSent) {
      res.status(500).json({
        jsonrpc: "2.0",
        error: { code: -32603, message: "Internal server error" },
        id: null,
      });
    }
  }
});

app.get("/mcp", mcpRateLimit.middleware, requireMcpAuth, async (req, res) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  const session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session) {
    res.status(400).send("Invalid or missing MCP session");
    return;
  }

  await session.transport.handleRequest(req, res);
});

app.delete("/mcp", mcpRateLimit.middleware, requireMcpAuth, async (req, res) => {
  const sessionIdHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionIdHeader === "string" ? sessionIdHeader : undefined;
  const session = sessionId ? sessions.get(sessionId) : undefined;

  if (!session) {
    res.status(400).send("Invalid or missing MCP session");
    return;
  }

  await session.transport.handleRequest(req, res);
  sessions.delete(sessionId!);
});

app.listen(PORT, HOST, () => {
  console.log(`Hearth MCP (Streamable HTTP, ${MCP_PROTOCOL_VERSION})`);
  console.log(`  health:  http://${HOST}:${PORT}/health`);
  console.log(`  mcp:     http://${HOST}:${PORT}/mcp`);
  console.log(`  privacy: http://${HOST}:${PORT}/legal/privacy.html`);
  console.log(`  assets:  http://${HOST}:${PORT}/assets/`);
  if (oauthScaffoldEnabled()) {
    console.log(`  prm:     http://${HOST}:${PORT}/.well-known/oauth-protected-resource`);
    console.log(`  oauth:   http://${HOST}:${PORT}/oauth`);
  }
  if (apiKeyConfigured()) {
    console.log(`  auth:    HEARTH_API_KEY required on /mcp (401 without WWW-Authenticate)`);
  } else {
    console.log(`  auth:    open (set HEARTH_API_KEY before tunneling)`);
  }
  const rpm = rateLimitRpm();
  if (rpm) console.log(`  rate:    ${rpm} req/min on /mcp`);
});
