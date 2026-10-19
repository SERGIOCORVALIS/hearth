# Devpost — Open Source mini fields

Copy/adapt:

- **Contribution / repo URL:** https://github.com/SERGIOCORVALIS/streamable-http-mcp-starter
- **Parent / monorepo URL:** your Hearth private/public hackathon repo
- **GitHub username:** `SERGIOCORVALIS`
- **What you did:** Created a new open-source Streamable HTTP MCP starter (spec 2025-11-25) with Express session handling, sample `ping` tool, resource, CONTRIBUTING guide, and Alexa+ tunnel notes — during the hackathon, alongside the main Hearth submission.
- **How it works:** Developers run `npm start`, expose `/mcp` via cloudflared, and point `alexa-ai new mcp` at the tunnel URL.
- **Why it matters:** Most MCP samples are stdio-only; Alexa+ requires remote Streamable HTTP. This lowers the onboarding cost for Alexa+ builders.

## Publish steps

From the Hearth monorepo (recommended):

```powershell
.\scripts\publish-oss-starter.ps1 -GitHubUser YOUR_USER
```

Or manually:

```bash
cd oss/streamable-http-mcp-starter
git init && git add . && git commit -m "feat: Streamable HTTP MCP starter for Alexa+"
git branch -M main
git remote add origin https://github.com/YOUR_USER/streamable-http-mcp-starter.git
git push -u origin main
```

