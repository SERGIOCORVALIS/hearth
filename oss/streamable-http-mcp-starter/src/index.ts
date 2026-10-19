#!/usr/bin/env node
import { randomUUID } from "node:crypto";
import express from "express";
import cors from "cors";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";
import { isInitializeRequest } from "@modelcontextprotocol/sdk/types.js";
import { z } from "zod";

const PROTOCOL = "2025-11-25";
const PORT = Number(process.env.PORT ?? 3200);
const HOST = process.env.HOST ?? "127.0.0.1";

function createServer(): McpServer {
  const server = new McpServer({
    name: "streamable-http-mcp-starter",
    version: "1.0.0",
  });

  server.tool(
    "ping",
    "Health-style ping tool for Alexa+/MCP connectivity checks",
    {
      message: z.string().optional().describe("Optional message to echo"),
    },
    async ({ message }) => ({
      content: [
        {
          type: "text" as const,
          text: JSON.stringify(
            {
              ok: true,
              echo: message ?? "pong",
              protocolVersion: PROTOCOL,
              transport: "streamable-http",
              at: new Date().toISOString(),
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  server.resource(
    "starter-info",
    "starter://info",
    {
      description: "Starter metadata",
      mimeType: "application/json",
    },
    async (uri) => ({
      contents: [
        {
          uri: uri.href,
          mimeType: "application/json",
          text: JSON.stringify(
            {
              name: "streamable-http-mcp-starter",
              protocolVersion: PROTOCOL,
              endpoint: "/mcp",
            },
            null,
            2,
          ),
        },
      ],
    }),
  );

  return server;
}

const app = express();
app.use(
  cors({
    origin: "*",
    exposedHeaders: ["Mcp-Session-Id", "mcp-session-id"],
  }),
);
app.use(express.json({ limit: "1mb" }));

type Session = { transport: StreamableHTTPServerTransport };
const sessions = new Map<string, Session>();

app.get("/health", (_req, res) => {
  res.json({
    ok: true,
    protocolVersion: PROTOCOL,
    transport: "streamable-http",
    endpoint: "/mcp",
  });
});

app.post("/mcp", async (req, res) => {
  const sessionHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  const existing = sessionId ? sessions.get(sessionId) : undefined;

  if (existing) {
    await existing.transport.handleRequest(req, res, req.body);
    return;
  }

  if (!sessionId && isInitializeRequest(req.body)) {
    const transport = new StreamableHTTPServerTransport({
      sessionIdGenerator: () => randomUUID(),
      onsessioninitialized: (id) => {
        sessions.set(id, { transport });
      },
    });
    transport.onclose = () => {
      if (transport.sessionId) sessions.delete(transport.sessionId);
    };
    const server = createServer();
    await server.connect(transport);
    await transport.handleRequest(req, res, req.body);
    return;
  }

  res.status(400).json({
    jsonrpc: "2.0",
    error: { code: -32000, message: "Initialize a session first" },
    id: null,
  });
});

app.get("/mcp", async (req, res) => {
  const sessionHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  const existing = sessionId ? sessions.get(sessionId) : undefined;
  if (!existing) {
    res.status(400).send("Invalid or missing MCP session");
    return;
  }
  await existing.transport.handleRequest(req, res);
});

app.delete("/mcp", async (req, res) => {
  const sessionHeader = req.headers["mcp-session-id"];
  const sessionId = typeof sessionHeader === "string" ? sessionHeader : undefined;
  const existing = sessionId ? sessions.get(sessionId) : undefined;
  if (!existing) {
    res.status(400).send("Invalid or missing MCP session");
    return;
  }
  await existing.transport.handleRequest(req, res);
  sessions.delete(sessionId!);
});

app.listen(PORT, HOST, () => {
  console.log(`streamable-http-mcp-starter (${PROTOCOL})`);
  console.log(`  health http://${HOST}:${PORT}/health`);
  console.log(`  mcp    http://${HOST}:${PORT}/mcp`);
});
