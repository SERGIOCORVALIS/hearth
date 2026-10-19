/**
 * Fill alexa-addon/addon.json from example using a public HTTPS base (cloudflare tunnel).
 * Usage: node scripts/fill-addon-json.mjs https://xxxx.trycloudflare.com
 */
import { readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const base = (process.argv[2] ?? "").replace(/\/$/, "");
if (!base.startsWith("https://")) {
  console.error("Usage: node scripts/fill-addon-json.mjs https://YOUR_TUNNEL_HOST");
  process.exit(1);
}

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = readFileSync(join(root, "alexa-addon", "addon.json.example"), "utf8");
const filled = example.replaceAll("https://PUBLIC_BASE", base);
const out = join(root, "alexa-addon", "addon.json");
writeFileSync(out, filled);
console.log(`Wrote ${out}`);
console.log(`MCP endpoint: ${base}/mcp`);
