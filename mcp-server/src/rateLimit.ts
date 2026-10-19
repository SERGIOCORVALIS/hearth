import type { NextFunction, Request, Response } from "express";

type Bucket = { timestamps: number[] };

export type RateLimitOptions = {
  /** Max requests per window. 0 / unset disables. */
  rpm?: number;
  windowMs?: number;
  keyFn?: (req: Request) => string;
  now?: () => number;
};

/**
 * Simple sliding-window rate limiter for tunnel exposure.
 * Enable with HEARTH_RATE_LIMIT_RPM (e.g. 60).
 */
export function createRateLimiter(options: RateLimitOptions = {}) {
  const rpm =
    options.rpm ??
    Number(process.env.HEARTH_RATE_LIMIT_RPM ?? 0);
  const windowMs = options.windowMs ?? 60_000;
  const now = options.now ?? Date.now;
  const keyFn =
    options.keyFn ??
    ((req: Request) => {
      const xf = req.headers["x-forwarded-for"];
      if (typeof xf === "string" && xf.length) return xf.split(",")[0]!.trim();
      return req.ip || req.socket.remoteAddress || "unknown";
    });

  const buckets = new Map<string, Bucket>();

  function enabled(): boolean {
    return Number.isFinite(rpm) && rpm > 0;
  }

  function middleware(req: Request, res: Response, next: NextFunction): void {
    if (!enabled()) {
      next();
      return;
    }

    const key = keyFn(req);
    const t = now();
    const cutoff = t - windowMs;
    let bucket = buckets.get(key);
    if (!bucket) {
      bucket = { timestamps: [] };
      buckets.set(key, bucket);
    }
    bucket.timestamps = bucket.timestamps.filter((ts) => ts > cutoff);

    if (bucket.timestamps.length >= rpm) {
      const retryAfterSec = Math.max(
        1,
        Math.ceil((bucket.timestamps[0]! + windowMs - t) / 1000),
      );
      res.setHeader("Retry-After", String(retryAfterSec));
      res.setHeader("X-RateLimit-Limit", String(rpm));
      res.setHeader("X-RateLimit-Remaining", "0");
      res.status(429).json({
        jsonrpc: "2.0",
        error: {
          code: -32029,
          message: `Rate limit exceeded (${rpm} req/${windowMs / 1000}s). Retry later.`,
        },
        id: null,
      });
      return;
    }

    bucket.timestamps.push(t);
    res.setHeader("X-RateLimit-Limit", String(rpm));
    res.setHeader(
      "X-RateLimit-Remaining",
      String(Math.max(0, rpm - bucket.timestamps.length)),
    );
    next();
  }

  return { middleware, enabled, buckets };
}

export function rateLimitRpm(env: NodeJS.ProcessEnv = process.env): number {
  const n = Number(env.HEARTH_RATE_LIMIT_RPM ?? 0);
  return Number.isFinite(n) && n > 0 ? n : 0;
}
