#!/usr/bin/env bash
set -euo pipefail

if ! command -v cloudflared >/dev/null 2>&1; then
  echo "cloudflared not found on PATH"
  exit 1
fi

if ! curl -fsS "http://127.0.0.1:3100/health" >/dev/null; then
  echo "MCP is not reachable. Start it with: npm run mcp"
  exit 1
fi

echo "Starting cloudflared tunnel → http://127.0.0.1:3100"
echo "Use https://<tunnel>/mcp as --mcp-server-url for alexa-ai"
exec cloudflared tunnel --url http://127.0.0.1:3100
