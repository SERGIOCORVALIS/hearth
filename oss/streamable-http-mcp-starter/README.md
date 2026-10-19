# streamable-http-mcp-starter

Minimal **Model Context Protocol** server using **Streamable HTTP** (MCP specification **2025-11-25**), ready to extend into an [Alexa+](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-overview.html) add-on.

## Why this exists

Alexa+ expects remote MCP servers on Streamable HTTP (not legacy standalone SSE). Most “hello world” MCP samples still use stdio. This starter gives you:

- Express `POST`/`GET`/`DELETE` `/mcp`
- Stateful sessions via `Mcp-Session-Id`
- One sample tool (`ping`) and one resource
- Clear next steps for `cloudflared` + `alexa-ai`

## Quick start

```bash
cd oss/streamable-http-mcp-starter   # or clone this folder as its own repo
npm install
npm run build
npm start
```

Or during development: `npm run dev` (tsx, no build step).

Health: `http://127.0.0.1:3200/health`  
MCP: `http://127.0.0.1:3200/mcp`

Compiled entrypoint: `dist/index.js` (also the `streamable-http-mcp-starter` bin).

```bash
npm test   # build + Streamable HTTP smoke (health, initialize, ping)
```

## Tunnel for Alexa+

```bash
cloudflared tunnel --url http://127.0.0.1:3200
alexa-ai configure
alexa-ai new mcp --name "Starter Ping" --locale en-US --mcp-server-url "https://YOUR_TUNNEL/mcp"
```

See Amazon’s [MCP Toolkit QuickStart](https://developer.amazon.com/docs/alexaplus/add-ons/mcp-toolkit-quickstart.html) for OAuth/PRM production requirements.

## License

MIT

## Hackathon open-source mini

This directory is an **additional open-source project** (MIT) created during the hackathon alongside the main Hearth submission. Publish it as a **public** GitHub repository and paste the URL into Devpost (see `../OSS_MINI.md` in the parent monorepo, or `OSS_SUBMISSION.md` here).
