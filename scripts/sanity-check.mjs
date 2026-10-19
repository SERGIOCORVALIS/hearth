/**
 * Pre-submit sanity: shared build, unit/smoke tests, key files present.
 */
import { spawnSync } from "node:child_process";
import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function run(cmd, args) {
  console.log(`\n> ${cmd} ${args.join(" ")}`);
  const r = spawnSync(cmd, args, {
    cwd: root,
    stdio: "inherit",
    shell: true,
  });
  if (r.status !== 0) {
    process.exit(r.status ?? 1);
  }
}

const required = [
  "LICENSE",
  "README.md",
  "ARCHITECTURE.md",
  "mcp-server/src/index.ts",
  "simulator/server/bedrockAgent.ts",
  "simulator/server/knowledge.ts",
  "oss/streamable-http-mcp-starter/LICENSE",
  "oss/streamable-http-mcp-starter/src/index.ts",
  "alexa-addon/legal/privacy.html",
  "alexa-addon/legal/terms.html",
  "alexa-addon/assets/icon-72.png",
  "alexa-addon/assets/carousel-600x900.png",
  "alexa-addon/addon.json.example",
  "docs/DEVPOST_DESCRIPTION.md",
  "docs/FEEDBACK.md",
  "docs/BUG_JOURNAL.md",
  "docs/DEPENDENCY_AUDIT.md",
  "docs/MCP_APPS_PLAN_CARD.md",
  "docs/AWS_BUILDER_CLIP.md",
  "docs/FEATURE_REQUESTS.md",
  "docs/VIDEO_VOICEOVER.md",
  "docs/SUBMISSION_CHECKLIST.md",
];

console.log("Checking required submission files…");
for (const rel of required) {
  const p = join(root, rel);
  if (!existsSync(p)) {
    console.error(`Missing: ${rel}`);
    process.exit(1);
  }
  console.log(`  ok  ${rel}`);
}

run("npm", ["run", "build", "-w", "@hearth/shared"]);
run("npm", ["run", "lint"]);
run("npm", ["run", "format:check"]);
run("npm", ["test"]);
run("npm", ["run", "typecheck"]);
run("npm", ["install", "--prefix", "oss/streamable-http-mcp-starter"]);
run("npm", ["test", "--prefix", "oss/streamable-http-mcp-starter"]);

console.log(
  "\nSanity check passed. Next: record video, push repo, add collaborators at submit time.",
);
