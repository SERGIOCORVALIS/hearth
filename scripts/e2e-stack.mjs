/**
 * Start MCP + simulator for Playwright (one process group).
 * Used by playwright.config.ts webServer.
 */
import { spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

const env = {
  ...process.env,
  HEARTH_FORCE_OFFLINE: "1",
  HEARTH_DEMO_FAST: "1",
  HEARTH_API_KEY: "",
  MCP_HOST: "127.0.0.1",
  MCP_PORT: "3100",
};

function run(cmd, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(cmd, args, {
      cwd: root,
      env,
      stdio: "inherit",
      shell: true,
    });
    child.on("exit", (code) => {
      if (code === 0) resolve();
      else reject(new Error(`${cmd} ${args.join(" ")} exited ${code}`));
    });
  });
}

await run("npm", ["run", "build", "-w", "@hearth/shared"]);

const demo = spawn(
  "npx",
  ["concurrently", "-k", "-n", "mcp,sim", "-c", "blue,magenta", "npm run mcp", "npm run sim"],
  { cwd: root, env, stdio: "inherit", shell: true },
);

demo.on("exit", (code) => process.exit(code ?? 1));

process.on("SIGINT", () => demo.kill("SIGTERM"));
process.on("SIGTERM", () => demo.kill("SIGTERM"));
