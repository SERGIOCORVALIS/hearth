import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(args, env = {}) {
  const child = spawn("npx", args, {
    cwd: root,
    env: { ...process.env, ...env },
    stdio: "inherit",
  });
  child.on("exit", (code) => {
    if (code && code !== 0) process.exit(code);
  });
  return child;
}

run(["tsx", "mcp-server/src/index.ts"], {
  MCP_HOST: process.env.MCP_HOST ?? "0.0.0.0",
  MCP_PORT: process.env.MCP_PORT ?? "3100",
});

run(["tsx", "simulator/server/index.ts"], {
  SIM_API_HOST: process.env.SIM_API_HOST ?? "0.0.0.0",
  SIM_API_PORT: process.env.SIM_API_PORT ?? "8787",
  MCP_URL: process.env.MCP_URL ?? "http://127.0.0.1:3100/mcp",
  SERVE_STATIC: "1",
});

console.log("Hearth Docker stack starting (MCP :3100, UI+API :8787)");
