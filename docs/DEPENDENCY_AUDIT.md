# Dependency audit (npm + Aikido)

Last checked: 2026-10-16

## npm audit

| Package          | Severity | Advisory                        | Fix                                         |
| ---------------- | -------- | ------------------------------- | ------------------------------------------- |
| `tinypool`       | critical | GHSA-5gmw-xhrv-c9v3 / GHSA-85c8 | Upgrade **vitest → 5.0.5** (drops tinypool) |
| `@vitest/mocker` | moderate | GHSA-82fw-gwwq-j7x9             | Same vitest upgrade                         |

Applied in:

- `mcp-server` / `simulator` (workspace)
- `oss/streamable-http-mcp-starter`

Verify:

```powershell
npm audit
npm --prefix oss/streamable-http-mcp-starter audit
```

Expect **0 vulnerabilities** after `npm install`.

## Aikido MCP

`aikido_oss_dependency_scan` currently fails because **`AIKIDO_API_KEY` is set but invalid**.

To re-enable Aikido scans:

1. Unset the bad key in the shell / user env: `Remove-Item Env:AIKIDO_API_KEY`
2. Sign in via the Aikido MCP (`aikido_login`) **or** set a fresh API key from the Aikido dashboard
3. Re-run OSS + path scans against `package-lock.json` and the OSS starter lockfile

Until then, treat `npm audit` (above) as the local gate; CI already runs install → typecheck → test → build.
