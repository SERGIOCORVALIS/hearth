import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { createRateLimiter } from "./rateLimit.js";

function mockRes() {
  const headers: Record<string, string> = {};
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    setHeader(name: string, value: string) {
      headers[name.toLowerCase()] = value;
    },
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    headers,
  };
  return res as unknown as Response & {
    statusCode: number;
    body: unknown;
    headers: Record<string, string>;
  };
}

describe("simulator createRateLimiter", () => {
  it("returns 429 when rpm exceeded on chat path", () => {
    const t = 5_000_000;
    const { middleware } = createRateLimiter({
      rpm: 1,
      windowMs: 60_000,
      now: () => t,
      keyFn: () => "sim-client",
    });

    const nextOk = vi.fn();
    const nextBlocked = vi.fn();
    middleware({ headers: {} } as Request, mockRes(), nextOk);
    const res = mockRes();
    middleware({ headers: {} } as Request, res, nextBlocked);

    expect(nextOk).toHaveBeenCalledOnce();
    expect(nextBlocked).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(429);
    expect((res.body as { error: string }).error).toMatch(/rate limit/i);
  });
});
