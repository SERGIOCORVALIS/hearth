/**
 * Verify Alexa+ HTTPS surface for the demo video (health / legal / assets).
 *
 * Usage:
 *   node scripts/tunnel-proof.mjs https://YOUR_PUBLIC_HOST
 *   node scripts/tunnel-proof.mjs   # defaults to http://127.0.0.1:3100 (local dry-run)
 *
 * Writes docs/demo-assets/tunnel-proof.json (+ updates STRONG_PLUS status note).
 */
import { mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const outDir = join(root, "docs", "demo-assets");
const base = (process.argv[2] ?? "http://127.0.0.1:3100").replace(/\/$/, "");

const paths = [
  "/health",
  "/legal/privacy.html",
  "/legal/terms.html",
  "/assets/icon-72.png",
  "/assets/carousel-600x900.png",
];

async function check(path) {
  const url = `${base}${path}`;
  const started = Date.now();
  try {
    const res = await fetch(url, { redirect: "follow" });
    const ms = Date.now() - started;
    const ct = res.headers.get("content-type") ?? "";
    let snippet = "";
    if (ct.includes("json")) {
      const j = await res.json();
      snippet = JSON.stringify({
        ok: j.ok,
        protocolVersion: j.protocolVersion,
        transport: j.transport,
        security: j.security,
      });
    } else if (ct.includes("text") || ct.includes("html")) {
      snippet = (await res.text()).slice(0, 120).replace(/\s+/g, " ");
    } else {
      const buf = Buffer.from(await res.arrayBuffer());
      snippet = `bytes=${buf.length}`;
    }
    return { path, url, status: res.status, ok: res.ok, ms, contentType: ct, snippet };
  } catch (error) {
    return {
      path,
      url,
      status: 0,
      ok: false,
      ms: Date.now() - started,
      error: error instanceof Error ? error.message : String(error),
    };
  }
}

async function main() {
  mkdirSync(outDir, { recursive: true });
  const results = [];
  for (const p of paths) {
    results.push(await check(p));
  }
  const allOk = results.every((r) => r.ok);
  const report = {
    checkedAt: new Date().toISOString(),
    base,
    public: !/127\.0\.0\.1|localhost/i.test(base),
    allOk,
    results,
    videoCue:
      "Record 10–15s in browser: open /health, then /legal/privacy.html, then /assets/icon-72.png",
  };

  const jsonPath = join(outDir, "tunnel-proof.json");
  writeFileSync(jsonPath, JSON.stringify(report, null, 2));

  const mdPath = join(outDir, "TUNNEL_PROOF.md");
  const lines = [
    "# Tunnel proof",
    "",
    `- Checked: \`${report.checkedAt}\``,
    `- Base: \`${base}\``,
    `- Public host: **${report.public ? "yes" : "no (local dry-run)"}**`,
    `- All endpoints OK: **${allOk ? "YES" : "NO"}**`,
    "",
    "| Path | Status | ms | Notes |",
    "|------|--------|----|-------|",
    ...results.map((r) => {
      const note = r.error ?? r.snippet ?? r.contentType ?? "";
      return `| \`${r.path}\` | ${r.status} | ${r.ms} | ${String(note).replace(/\|/g, "/").slice(0, 80)} |`;
    }),
    "",
    "## Video insert (10–15s)",
    "",
    report.videoCue,
    "",
  ];
  writeFileSync(mdPath, lines.join("\n"));

  console.log(JSON.stringify(report, null, 2));
  console.log(`\nWrote ${jsonPath}`);
  console.log(`Wrote ${mdPath}`);
  if (!allOk) process.exit(1);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
