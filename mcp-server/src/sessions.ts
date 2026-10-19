import type { StreamableHTTPServerTransport } from "@modelcontextprotocol/sdk/server/streamableHttp.js";

export type McpSession = {
  transport: StreamableHTTPServerTransport;
  lastAccess: number;
};

export type SessionStoreOptions = {
  ttlMs?: number;
  maxSessions?: number;
  now?: () => number;
};

const DEFAULT_TTL_MS = 30 * 60 * 1000;
const DEFAULT_MAX = 100;

export class SessionStore {
  private readonly sessions = new Map<string, McpSession>();
  private readonly ttlMs: number;
  private readonly maxSessions: number;
  private readonly now: () => number;

  constructor(options: SessionStoreOptions = {}) {
    this.ttlMs = options.ttlMs ?? Number(process.env.HEARTH_SESSION_TTL_MS ?? DEFAULT_TTL_MS);
    this.maxSessions =
      options.maxSessions ?? Number(process.env.HEARTH_MAX_SESSIONS ?? DEFAULT_MAX);
    this.now = options.now ?? Date.now;
  }

  get size(): number {
    return this.sessions.size;
  }

  get(id: string): McpSession | undefined {
    this.purgeExpired();
    const session = this.sessions.get(id);
    if (!session) return undefined;
    session.lastAccess = this.now();
    return session;
  }

  set(id: string, transport: StreamableHTTPServerTransport): void {
    this.purgeExpired();
    this.sessions.set(id, { transport, lastAccess: this.now() });
    this.evictOverflow();
  }

  delete(id: string): void {
    this.sessions.delete(id);
  }

  purgeExpired(): number {
    const cutoff = this.now() - this.ttlMs;
    let removed = 0;
    for (const [id, session] of this.sessions) {
      if (session.lastAccess < cutoff) {
        this.closeQuietly(session.transport);
        this.sessions.delete(id);
        removed += 1;
      }
    }
    return removed;
  }

  private evictOverflow(): void {
    while (this.sessions.size > this.maxSessions) {
      let oldestId: string | undefined;
      let oldestAt = Infinity;
      for (const [id, session] of this.sessions) {
        if (session.lastAccess < oldestAt) {
          oldestAt = session.lastAccess;
          oldestId = id;
        }
      }
      if (!oldestId) break;
      const session = this.sessions.get(oldestId);
      if (session) this.closeQuietly(session.transport);
      this.sessions.delete(oldestId);
    }
  }

  private closeQuietly(transport: StreamableHTTPServerTransport): void {
    try {
      void transport.close?.();
    } catch {
      // ignore close errors during eviction
    }
  }
}
