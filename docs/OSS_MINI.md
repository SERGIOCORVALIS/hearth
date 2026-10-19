# Open Source mini-challenge

## Published repo (done)

| Field                      | Value                                                         |
| -------------------------- | ------------------------------------------------------------- |
| **OSS / contribution URL** | https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter |
| **Main project repo URL**  | _(your Hearth hackathon repo after push)_                     |
| **GitHub username**        | `SERGIOCORVALIS`                                              |

## What / how / why (paste to Devpost)

Created a new MIT-licensed Streamable HTTP MCP starter for Alexa+ (MCP spec **2025-11-25**) during the hackathon, alongside the main Hearth submission. Most MCP samples are stdio-only; Alexa+ needs remote Streamable HTTP. The starter gives Express `POST/GET/DELETE /mcp`, session handling, a sample `ping` tool, a resource, and cloudflared / `alexa-ai` next steps so builders can connect a remote MCP server to Alexa+ faster.

## Local copy

In-tree mirror: [`oss/streamable-http-mcp-starter`](../oss/streamable-http-mcp-starter)

```bash
npm --prefix oss/streamable-http-mcp-starter install
npm run test:oss   # tsc → dist/ + Streamable HTTP smoke (health, initialize, ping)
```

Re-publish if needed:

```powershell
.\scripts\publish-oss-starter.ps1 -GitHubUser SERGIOCORVALIS
```
