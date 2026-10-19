import type { CorsOptions } from "cors";
import type { NextFunction, Request, Response } from "express";

/**
 * HEARTH_CORS_ORIGINS:
 * - unset or `*` → reflect any Origin (local demo / tunnel convenience)
 * - comma-separated list → allowlist only those origins
 */
export function resolveCorsOrigin(env: NodeJS.ProcessEnv = process.env): CorsOptions["origin"] {
  const raw = env.HEARTH_CORS_ORIGINS?.trim();
  if (!raw || raw === "*") return true;
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
  if (list.length === 0) return true;
  return list.length === 1 ? list[0]! : list;
}

export function apiKeyConfigured(env: NodeJS.ProcessEnv = process.env): string | undefined {
  const key = env.HEARTH_API_KEY?.trim();
  return key || undefined;
}

function extractPresentedKey(req: Request): string | undefined {
  const auth = req.headers.authorization;
  if (typeof auth === "string" && auth.toLowerCase().startsWith("bearer ")) {
    return auth.slice(7).trim();
  }
  const header = req.headers["x-hearth-api-key"];
  if (typeof header === "string") return header.trim();
  return undefined;
}

/**
 * Optional bearer / X-Hearth-Api-Key gate. Disabled when HEARTH_API_KEY is unset
 * so localhost demos keep working with zero config.
 *
 * Alexa+ account-linking docs: return 401 **without** a WWW-Authenticate header
 * (discovery uses /.well-known/oauth-protected-resource instead).
 */
export function optionalApiKeyAuth(env: NodeJS.ProcessEnv = process.env) {
  return (req: Request, res: Response, next: NextFunction): void => {
    const expected = apiKeyConfigured(env);
    if (!expected) {
      next();
      return;
    }
    const presented = extractPresentedKey(req);
    if (presented && presented === expected) {
      next();
      return;
    }
    // Explicitly avoid WWW-Authenticate for Alexa+ compatibility.
    res.removeHeader("WWW-Authenticate");
    res.status(401).json({
      jsonrpc: "2.0",
      error: {
        code: -32001,
        message:
          "Unauthorized: Bearer token required. See /.well-known/oauth-protected-resource or use HEARTH_API_KEY.",
      },
      id: null,
    });
  };
}
