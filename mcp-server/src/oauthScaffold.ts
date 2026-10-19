import { createHash, randomBytes } from "node:crypto";
import type { Express, Request, Response } from "express";

export type OAuthScaffoldOptions = {
  publicBaseUrl: string;
  resourcePath?: string;
  apiKey?: string;
};

type PendingAuth = {
  codeChallenge: string;
  codeChallengeMethod: string;
  redirectUri: string;
  clientId: string;
  resource?: string;
  scope?: string;
  createdAt: number;
};

const pending = new Map<string, PendingAuth>();
const TTL_MS = 10 * 60 * 1000;

function purgePending(now = Date.now()): void {
  for (const [code, row] of pending) {
    if (now - row.createdAt > TTL_MS) pending.delete(code);
  }
}

function baseUrl(req: Request, configured?: string): string {
  if (configured?.trim()) return configured.replace(/\/$/, "");
  const host = req.get("x-forwarded-host") ?? req.get("host");
  const proto = req.get("x-forwarded-proto") ?? req.protocol;
  return `${proto}://${host}`;
}

function s256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

/**
 * Alexa+ account-linking scaffold:
 * - RFC 9728 PRM at /.well-known/oauth-protected-resource
 * - OAuth AS metadata with PKCE S256
 * - Minimal authorize/token stubs for local / tunnel demos
 *
 * Note: Alexa+ expects 401 *without* WWW-Authenticate (handled in security.ts).
 */
export function mountOAuthScaffold(app: Express, options: OAuthScaffoldOptions): void {
  const resourcePath = options.resourcePath ?? "/mcp";

  app.get("/.well-known/oauth-protected-resource", (req, res) => {
    const root = baseUrl(req, options.publicBaseUrl);
    res.json({
      resource: `${root}${resourcePath}`,
      authorization_servers: [root],
      scopes_supported: ["openid", "hearth.mcp"],
      bearer_methods_supported: ["header"],
      resource_documentation: `${root}/legal/privacy.html`,
    });
  });

  app.get("/.well-known/oauth-authorization-server", (req, res) => {
    const root = baseUrl(req, options.publicBaseUrl);
    res.json({
      issuer: root,
      authorization_endpoint: `${root}/oauth/authorize`,
      token_endpoint: `${root}/oauth/token`,
      response_types_supported: ["code"],
      grant_types_supported: ["authorization_code"],
      code_challenge_methods_supported: ["S256"],
      token_endpoint_auth_methods_supported: ["none", "client_secret_post"],
      scopes_supported: ["openid", "hearth.mcp"],
    });
  });

  app.get("/oauth/authorize", (req, res) => {
    purgePending();
    const clientId = String(req.query.client_id ?? "hearth-demo");
    const redirectUri = String(req.query.redirect_uri ?? "");
    const codeChallenge = String(req.query.code_challenge ?? "");
    const codeChallengeMethod = String(req.query.code_challenge_method ?? "");
    const state = req.query.state ? String(req.query.state) : undefined;
    const scope = req.query.scope ? String(req.query.scope) : undefined;
    const resource = req.query.resource ? String(req.query.resource) : undefined;
    const responseType = String(req.query.response_type ?? "");

    if (responseType !== "code" || !redirectUri || !codeChallenge) {
      res.status(400).json({
        error: "invalid_request",
        error_description: "Require response_type=code, redirect_uri, code_challenge",
      });
      return;
    }
    if (codeChallengeMethod !== "S256") {
      res.status(400).json({
        error: "invalid_request",
        error_description: "code_challenge_method must be S256",
      });
      return;
    }

    const code = randomBytes(24).toString("base64url");
    pending.set(code, {
      codeChallenge,
      codeChallengeMethod,
      redirectUri,
      clientId,
      resource,
      scope,
      createdAt: Date.now(),
    });

    const url = new URL(redirectUri);
    url.searchParams.set("code", code);
    if (state) url.searchParams.set("state", state);
    res.redirect(302, url.toString());
  });

  app.post("/oauth/token", (req, res) => {
    purgePending();
    const body = req.body ?? {};
    const grantType = String(body.grant_type ?? "");
    const code = String(body.code ?? "");
    const redirectUri = String(body.redirect_uri ?? "");
    const codeVerifier = String(body.code_verifier ?? "");
    const resource = body.resource ? String(body.resource) : undefined;

    if (grantType !== "authorization_code") {
      res.status(400).json({ error: "unsupported_grant_type" });
      return;
    }

    const row = pending.get(code);
    if (!row) {
      res.status(400).json({ error: "invalid_grant", error_description: "Unknown or expired code" });
      return;
    }
    pending.delete(code);

    if (row.redirectUri !== redirectUri) {
      res.status(400).json({ error: "invalid_grant", error_description: "redirect_uri mismatch" });
      return;
    }
    if (s256(codeVerifier) !== row.codeChallenge) {
      res.status(400).json({ error: "invalid_grant", error_description: "PKCE verification failed" });
      return;
    }
    if (resource && row.resource && resource !== row.resource) {
      res.status(400).json({ error: "invalid_target", error_description: "resource mismatch" });
      return;
    }

    // Demo token: reuse HEARTH_API_KEY when set so /mcp bearer auth keeps working.
    const accessToken = options.apiKey?.trim() || randomBytes(24).toString("base64url");
    res.json({
      access_token: accessToken,
      token_type: "Bearer",
      expires_in: 3600,
      scope: row.scope ?? "openid hearth.mcp",
    });
  });

  // Small HTML helper so humans can see the scaffold is live.
  app.get("/oauth", (_req: Request, res: Response) => {
    res.type("html").send(`<!doctype html>
<html lang="en"><head><meta charset="utf-8"/><title>Hearth OAuth scaffold</title>
<style>body{font-family:system-ui;max-width:40rem;margin:2rem auto;padding:0 1rem;background:#f7f3ee;color:#1a1410}
code{background:#ebe4da;padding:.1rem .3rem}</style></head>
<body>
<h1>Hearth OAuth / PRM scaffold</h1>
<p>Alexa+ discovery endpoints:</p>
<ul>
<li><code>/.well-known/oauth-protected-resource</code></li>
<li><code>/.well-known/oauth-authorization-server</code> (PKCE <strong>S256</strong>)</li>
<li><code>/oauth/authorize</code> · <code>/oauth/token</code></li>
</ul>
<p>Hackathon note: this is a local/tunnel stub, not a production IdP. Prefer <code>HEARTH_API_KEY</code> for simple tunnel demos.</p>
</body></html>`);
  });
}

export function oauthScaffoldEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  const raw = env.HEARTH_OAUTH_SCAFFOLD?.trim().toLowerCase();
  if (raw === "0" || raw === "false" || raw === "off") return false;
  // On by default so Alexa+ discovery docs are always reachable; stubs are harmless for local demo.
  return true;
}
