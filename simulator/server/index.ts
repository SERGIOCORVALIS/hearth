import { HearthMcpClient } from "./mcpClient.js";
import { createSimulatorApp } from "./app.js";
import { bedrockEnabled } from "./bedrockAgent.js";
import { isDemoNetwork } from "./demoNetwork.js";

const PORT = Number(process.env.SIM_API_PORT ?? 8787);
const mcp = new HearthMcpClient(
  process.env.MCP_URL ?? process.env.VITE_MCP_URL ?? "http://127.0.0.1:3100/mcp",
);

const app = createSimulatorApp({ mcp });
const host = process.env.SIM_API_HOST ?? "127.0.0.1";

app.listen(PORT, host, () => {
  console.log(`Hearth Alexa+ simulator API on http://${host}:${PORT}`);
  console.log(`  MCP URL: ${mcp.mcpUrl}`);
  const agentLabel = !bedrockEnabled()
    ? "offline MCP router"
    : isDemoNetwork()
      ? "virtual Bedrock (demo — no AWS network)"
      : "live Bedrock (with offline fallback)";
  console.log(`  Agent:   ${agentLabel}`);
  console.log(
    `  Network: ${isDemoNetwork() ? "demo / virtual" : "live AWS enabled (HEARTH_LIVE_AWS=1)"}`,
  );
  if (process.env.SERVE_STATIC === "1") {
    console.log(`  UI:      static files enabled`);
  }
});
