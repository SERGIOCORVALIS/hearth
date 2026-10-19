import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { MCP_PROTOCOL_VERSION } from "@hearth/shared";

export type ToolCallRecord = {
  name: string;
  arguments: Record<string, unknown>;
  result: unknown;
};

export type ListedTool = {
  name: string;
  description?: string;
  inputSchema?: unknown;
};

function parseToolText(content: unknown): unknown {
  if (!Array.isArray(content)) return content;
  const texts = content
    .filter((c): c is { type: string; text: string } => {
      return (
        typeof c === "object" &&
        c !== null &&
        "type" in c &&
        (c as { type: string }).type === "text" &&
        "text" in c
      );
    })
    .map((c) => c.text);

  if (texts.length === 1) {
    try {
      return JSON.parse(texts[0]);
    } catch {
      return texts[0];
    }
  }
  return texts.length ? texts : content;
}

export class HearthMcpClient {
  private client: Client | null = null;
  private transport: StreamableHTTPClientTransport | null = null;
  readonly mcpUrl: string;

  constructor(mcpUrl = process.env.MCP_URL ?? "http://127.0.0.1:3100/mcp") {
    this.mcpUrl = mcpUrl;
  }

  async connect(): Promise<void> {
    if (this.client) return;

    this.client = new Client({
      name: "hearth-alexa-plus-simulator",
      version: "1.0.0",
    });

    const apiKey = process.env.HEARTH_API_KEY?.trim();
    this.transport = new StreamableHTTPClientTransport(new URL(this.mcpUrl), {
      requestInit: apiKey
        ? {
            headers: {
              Authorization: `Bearer ${apiKey}`,
              "X-Hearth-Api-Key": apiKey,
            },
          }
        : undefined,
    });
    await this.client.connect(this.transport);
  }

  async listTools(): Promise<ListedTool[]> {
    await this.connect();
    const result = await this.client!.listTools();
    return result.tools.map((t) => ({
      name: t.name,
      description: t.description,
      inputSchema: t.inputSchema,
    }));
  }

  async callTool(name: string, args: Record<string, unknown> = {}): Promise<ToolCallRecord> {
    await this.connect();
    const result = await this.client!.callTool({
      name,
      arguments: args,
    });
    return {
      name,
      arguments: args,
      result: parseToolText(result.content),
    };
  }

  async listResources(): Promise<Array<{ uri: string; name?: string; description?: string }>> {
    await this.connect();
    const result = await this.client!.listResources();
    return result.resources.map((r) => ({
      uri: r.uri,
      name: r.name,
      description: r.description,
    }));
  }

  async readResource(uri: string): Promise<{ uri: string; result: unknown }> {
    await this.connect();
    const result = await this.client!.readResource({ uri });
    const texts = (result.contents ?? [])
      .map((c) => ("text" in c ? String(c.text) : ""))
      .filter(Boolean);
    let parsed: unknown = texts;
    if (texts.length === 1) {
      try {
        parsed = JSON.parse(texts[0]);
      } catch {
        parsed = texts[0];
      }
    }
    return { uri, result: parsed };
  }

  async listPrompts(): Promise<Array<{ name: string; description?: string }>> {
    await this.connect();
    const result = await this.client!.listPrompts();
    return result.prompts.map((p) => ({
      name: p.name,
      description: p.description,
    }));
  }

  async getPrompt(
    name: string,
    args: Record<string, string> = {},
  ): Promise<{ name: string; result: unknown }> {
    await this.connect();
    const result = await this.client!.getPrompt({ name, arguments: args });
    return { name, result };
  }

  async close(): Promise<void> {
    await this.transport?.close();
    this.client = null;
    this.transport = null;
  }

  info() {
    return {
      mcpUrl: this.mcpUrl,
      protocolVersion: MCP_PROTOCOL_VERSION,
      transport: "streamable-http",
    };
  }
}
