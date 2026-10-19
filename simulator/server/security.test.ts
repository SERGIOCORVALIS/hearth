import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { optionalApiKeyAuth, resolveCorsOrigin } from "./security.js";

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
  };
  return res as unknown as Response & { statusCode: number; body: unknown };
}

describe("simulator security", () => {
  it("resolves CORS allowlist", () => {
    expect(resolveCorsOrigin({ HEARTH_CORS_ORIGINS: "http://127.0.0.1:5173" })).toBe(
      "http://127.0.0.1:5173",
    );
  });

  it("gates /api/chat style handlers when key set", () => {
    const next = vi.fn();
    const res = mockRes();
    optionalApiKeyAuth({ HEARTH_API_KEY: "tunnel-secret" })({ headers: {} } as Request, res, next);
    expect(res.statusCode).toBe(401);
    expect(next).not.toHaveBeenCalled();
  });
});
