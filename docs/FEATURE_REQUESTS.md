# Feature requests for Amazon / Alexa+ / MCP tooling

Optional Devpost field: what you’d like to see, why, urgency.

| Request                                             | Why it matters                                                                                                                                          | Urgency               |
| --------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- | --------------------- |
| **Official local Alexa+ MCP simulator SDK**         | Hackathon PCs often lack device access; a blessed simulator (like our web UI) with protocol fixtures would raise submission quality.                    | Critical              |
| **Streamable HTTP “hello Alexa+” template in docs** | Most MCP samples are still stdio; Alexa+ needs remote Streamable HTTP + session headers.                                                                | Critical              |
| **Hackathon-tier Bedrock model access / sandbox**   | Model enablement friction blocks the AWS Builder mini for first-time accounts.                                                                          | Important             |
| **OAuth-lite / PRM scaffold for MCP add-ons**       | Shipped in-repo: RFC 9728 PRM + AS metadata (S256) + `/oauth/*` stubs; see `mcp-server/src/oauthScaffold.ts` and `docs/ALEXA_PLUS_TUNNEL.md`.           | Done (hackathon stub) |
| **Role-based `memberId` on care/reminders**         | Shipped: `resolveMember` accepts id · role alias (`elder`/`child`/`adult`/`grandma`) · display name; wired into `log_care_checkin` + `create_reminder`. | Done                  |
| **Latency dashboard in Alexa AI CLI**               | Alexa+ targets &lt;500 ms round-trip; a simple `alexa-ai mcp ping` latency report would help.                                                           | Important             |
| **MCP Apps visual card schema examples**            | Shipped: `hearth://schemas/plan-card` + [`docs/MCP_APPS_PLAN_CARD.md`](MCP_APPS_PLAN_CARD.md).                                                          | Done                  |
| **GitHub collaborator invite reminder in Devpost**  | Invites expire in 7 days; a submit-time reminder reduces lost reviews.                                                                                  | Desirable             |
