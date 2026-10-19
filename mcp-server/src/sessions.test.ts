import { describe, expect, it, vi } from "vitest";
import { SessionStore } from "./sessions.js";
import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

function fakeTransport(id = "t"): StreamableHTTPServerTransport {
  return {
    sessionId: id,
    close: vi.fn(async () => undefined),
  } as unknown as StreamableHTTPServerTransport;
}

describe("SessionStore", () => {
  it("purges sessions past TTL", () => {
    let now = 1_000_000;
    const store = new SessionStore({
      ttlMs: 1_000,
      maxSessions: 10,
      now: () => now,
    });
    store.set("a", fakeTransport("a"));
    expect(store.get("a")).toBeTruthy();

    now += 2_000;
    expect(store.purgeExpired()).toBe(1);
    expect(store.get("a")).toBeUndefined();
    expect(store.size).toBe(0);
  });

  it("evicts oldest when maxSessions exceeded", () => {
    let now = 0;
    const store = new SessionStore({
      ttlMs: 60_000,
      maxSessions: 2,
      now: () => now,
    });
    const t1 = fakeTransport("1");
    const t2 = fakeTransport("2");
    const t3 = fakeTransport("3");
    store.set("1", t1);
    now = 10;
    store.set("2", t2);
    now = 20;
    store.set("3", t3);

    expect(store.size).toBe(2);
    expect(store.get("1")).toBeUndefined();
    expect(store.get("2")).toBeTruthy();
    expect(store.get("3")).toBeTruthy();
    expect(t1.close).toHaveBeenCalled();
  });

  it("touches lastAccess on get", () => {
    let now = 100;
    const store = new SessionStore({
      ttlMs: 50,
      maxSessions: 5,
      now: () => now,
    });
    store.set("alive", fakeTransport("alive"));
    now = 140;
    expect(store.get("alive")).toBeTruthy();
    now = 180;
    expect(store.purgeExpired()).toBe(0);
    expect(store.size).toBe(1);
  });
});
