import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { createHash, randomBytes } from "node:crypto";
import express from "express";
import type { Server } from "node:http";
import { mountOAuthScaffold, oauthScaffoldEnabled } from "./oauthScaffold.js";

function s256(verifier: string): string {
  return createHash("sha256").update(verifier).digest("base64url");
}

describe("oauthScaffoldEnabled", () => {
  it("defaults on; can be disabled", () => {
    expect(oauthScaffoldEnabled({})).toBe(true);
    expect(oauthScaffoldEnabled({ HEARTH_OAUTH_SCAFFOLD: "0" })).toBe(false);
    expect(oauthScaffoldEnabled({ HEARTH_OAUTH_SCAFFOLD: "false" })).toBe(false);
  });
});

describe("OAuth / PRM scaffold HTTP", () => {
  let server: Server;
  let base: string;

  beforeAll(async () => {
    const app = express();
    app.use(express.json());
    app.use(express.urlencoded({ extended: false }));
    mountOAuthScaffold(app, {
      publicBaseUrl: "https://demo.example",
      apiKey: "hearth-demo-token",
    });
    server = await new Promise<Server>((resolve) => {
      const s = app.listen(0, "127.0.0.1", () => resolve(s));
    });
    const addr = server.address();
    if (!addr || typeof addr === "string") throw new Error("no port");
    base = `http://127.0.0.1:${addr.port}`;
  });

  afterAll(async () => {
    await new Promise<void>((resolve, reject) => {
      server.close((err) => (err ? reject(err) : resolve()));
    });
  });

  it("serves RFC 9728 PRM and AS metadata with S256", async () => {
    const prm = await fetch(`${base}/.well-known/oauth-protected-resource`);
    expect(prm.status).toBe(200);
    const prmBody = (await prm.json()) as {
      resource: string;
      authorization_servers: string[];
    };
    expect(prmBody.resource).toBe("https://demo.example/mcp");
    expect(prmBody.authorization_servers).toContain("https://demo.example");

    const as = await fetch(`${base}/.well-known/oauth-authorization-server`);
    expect(as.status).toBe(200);
    const asBody = (await as.json()) as {
      code_challenge_methods_supported: string[];
      authorization_endpoint: string;
    };
    expect(asBody.code_challenge_methods_supported).toContain("S256");
    expect(asBody.authorization_endpoint).toContain("/oauth/authorize");
  });

  it("completes PKCE S256 authorize → token and returns demo access_token", async () => {
    const verifier = randomBytes(32).toString("base64url");
    const challenge = s256(verifier);
    const redirectUri = "https://client.example/callback";

    const authUrl = new URL(`${base}/oauth/authorize`);
    authUrl.searchParams.set("response_type", "code");
    authUrl.searchParams.set("client_id", "hearth-demo");
    authUrl.searchParams.set("redirect_uri", redirectUri);
    authUrl.searchParams.set("code_challenge", challenge);
    authUrl.searchParams.set("code_challenge_method", "S256");
    authUrl.searchParams.set("state", "xyz");

    const authRes = await fetch(authUrl, { redirect: "manual" });
    expect(authRes.status).toBe(302);
    const location = authRes.headers.get("location");
    expect(location).toBeTruthy();
    const redirected = new URL(location!);
    expect(redirected.searchParams.get("state")).toBe("xyz");
    const code = redirected.searchParams.get("code");
    expect(code).toBeTruthy();

    const tokenRes = await fetch(`${base}/oauth/token`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
        code_verifier: verifier,
      }),
    });
    expect(tokenRes.status).toBe(200);
    const token = (await tokenRes.json()) as {
      access_token: string;
      token_type: string;
    };
    expect(token.token_type).toBe("Bearer");
    expect(token.access_token).toBe("hearth-demo-token");
  });

  it("rejects non-S256 PKCE", async () => {
    const url = new URL(`${base}/oauth/authorize`);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("redirect_uri", "https://client.example/cb");
    url.searchParams.set("code_challenge", "abc");
    url.searchParams.set("code_challenge_method", "plain");
    const res = await fetch(url);
    expect(res.status).toBe(400);
  });
});
