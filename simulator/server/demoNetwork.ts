/**
 * Hearth is a self-contained demo. External AWS / tunnel calls stay virtual
 * unless the operator explicitly opts into live networking.
 *
 * Defaults (no env required):
 *   - Virtual Bedrock agent (offline MCP + Bedrock-shaped response)
 *   - CloudWatch Logs dry-run (console log, no PutLogEvents)
 *
 * Opt into real AWS:
 *   HEARTH_LIVE_AWS=1  (+ credentials / profile)
 *
 * Force the plain offline router (no Bedrock-shaped UI):
 *   HEARTH_FORCE_OFFLINE=1
 */

export function isDemoNetwork(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.HEARTH_LIVE_AWS === "1" || env.HEARTH_LIVE_AWS === "true") return false;
  if (env.HEARTH_DEMO === "0" || env.HEARTH_DEMO === "false") return false;
  return true;
}

/** Simulated Converse round-trip so the UI latency strip looks alive. */
export function virtualBedrockDelayMs(env: NodeJS.ProcessEnv = process.env): number {
  const raw = env.HEARTH_VIRTUAL_BEDROCK_MS?.trim();
  if (raw && /^\d+$/.test(raw)) return Math.min(2000, Number(raw));
  return 120;
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

export const VIRTUAL_AWS_SERVICES = [
  "bedrock-runtime:Converse",
  "hearth-care-kb:retrieve",
  "bedrock-runtime:Converse(briefing)",
  "logs:PutLogEvents",
] as const;
