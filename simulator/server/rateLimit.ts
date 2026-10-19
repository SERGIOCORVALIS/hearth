import type { NextFunction, Request, Response } from "express";

type Bucket = { timestamps: number[] };

export type RateLimitOptions = {
  rpm?: number;
  windowMs?: number;
  keyFn?: (req: Request) => string;
  now?: () => number;
};

export function createRateLimiter(options: RateLimitOptions = {}) {
  const rpm = options.rpm ?? Number(process.env.HEARTH_RATE_LIMIT_RPM ?? 0);
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

  function middleware(req: Request, res: Response, next: NextFunction): void {
    if (!(Number.isFinite(rpm) && rpm > 0)) {
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
      res.status(429).json({
        error: `Rate limit exceeded (${rpm} req/min). Retry in ~${retryAfterSec}s.`,
      });
      return;
    }

    bucket.timestamps.push(t);
    next();
  }

  return { middleware, buckets };
}
