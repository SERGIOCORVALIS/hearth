import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { createRateLimiter, rateLimitRpm } from "./rateLimit.js";

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

describe("rateLimitRpm", () => {
  it("treats missing/zero as disabled", () => {
    expect(rateLimitRpm({})).toBe(0);
    expect(rateLimitRpm({ HEARTH_RATE_LIMIT_RPM: "0" })).toBe(0);
  });

  it("parses positive rpm", () => {
    expect(rateLimitRpm({ HEARTH_RATE_LIMIT_RPM: "60" })).toBe(60);
  });
});

describe("createRateLimiter", () => {
  it("passes through when disabled", () => {
    const { middleware } = createRateLimiter({ rpm: 0 });
    const next = vi.fn();
    middleware({ headers: {}, ip: "1.1.1.1" } as Request, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("returns 429 after rpm is exceeded", () => {
    const t = 1_000_000;
    const { middleware } = createRateLimiter({
      rpm: 2,
      windowMs: 60_000,
      now: () => t,
      keyFn: () => "client-a",
    });

    const next1 = vi.fn();
    const next2 = vi.fn();
    const next3 = vi.fn();
    middleware({ headers: {} } as Request, mockRes(), next1);
    middleware({ headers: {} } as Request, mockRes(), next2);
    const res3 = mockRes();
    middleware({ headers: {} } as Request, res3, next3);

    expect(next1).toHaveBeenCalledOnce();
    expect(next2).toHaveBeenCalledOnce();
    expect(next3).not.toHaveBeenCalled();
    expect(res3.statusCode).toBe(429);
    expect(res3.headers["retry-after"]).toBeTruthy();
  });
});
