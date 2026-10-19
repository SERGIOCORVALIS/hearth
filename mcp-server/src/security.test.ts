import { describe, expect, it, vi } from "vitest";
import type { Request, Response } from "express";
import { apiKeyConfigured, optionalApiKeyAuth, resolveCorsOrigin } from "./security.js";

function mockRes() {
  const res = {
    statusCode: 200,
    body: undefined as unknown,
    removed: [] as string[],
    status(code: number) {
      this.statusCode = code;
      return this;
    },
    json(payload: unknown) {
      this.body = payload;
      return this;
    },
    removeHeader(name: string) {
      this.removed.push(name);
    },
  };
  return res as unknown as Response & {
    statusCode: number;
    body: unknown;
    removed: string[];
  };
}

describe("resolveCorsOrigin", () => {
  it("defaults to reflective allow when unset or *", () => {
    expect(resolveCorsOrigin({})).toBe(true);
    expect(resolveCorsOrigin({ HEARTH_CORS_ORIGINS: "*" })).toBe(true);
  });

  it("parses allowlists", () => {
    expect(resolveCorsOrigin({ HEARTH_CORS_ORIGINS: "https://a.example" })).toBe(
      "https://a.example",
    );
    expect(
      resolveCorsOrigin({ HEARTH_CORS_ORIGINS: "https://a.example, https://b.example" }),
    ).toEqual(["https://a.example", "https://b.example"]);
  });
});

describe("optionalApiKeyAuth", () => {
  it("passes through when no key configured", () => {
    const next = vi.fn();
    optionalApiKeyAuth({})({ headers: {} } as Request, mockRes(), next);
    expect(next).toHaveBeenCalledOnce();
  });

  it("rejects missing credentials when key is set (no WWW-Authenticate)", () => {
    const next = vi.fn();
    const res = mockRes();
    optionalApiKeyAuth({ HEARTH_API_KEY: "secret" })({ headers: {} } as Request, res, next);
    expect(next).not.toHaveBeenCalled();
    expect(res.statusCode).toBe(401);
    expect(res.removed).toContain("WWW-Authenticate");
  });

  it("accepts Bearer and X-Hearth-Api-Key", () => {
    const nextBearer = vi.fn();
    optionalApiKeyAuth({ HEARTH_API_KEY: "secret" })(
      { headers: { authorization: "Bearer secret" } } as Request,
      mockRes(),
      nextBearer,
    );
    expect(nextBearer).toHaveBeenCalledOnce();

    const nextHeader = vi.fn();
    optionalApiKeyAuth({ HEARTH_API_KEY: "secret" })(
      { headers: { "x-hearth-api-key": "secret" } } as Request,
      mockRes(),
      nextHeader,
    );
    expect(nextHeader).toHaveBeenCalledOnce();
  });

  it("detects configured key", () => {
    expect(apiKeyConfigured({})).toBeUndefined();
    expect(apiKeyConfigured({ HEARTH_API_KEY: "  abc  " })).toBe("abc");
  });
});
