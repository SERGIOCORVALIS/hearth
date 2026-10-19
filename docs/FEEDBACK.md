# Tool / API / SDK feedback (Devpost draft)

Paste/adapt into the Devpost “feedback on each tool, API, or SDK” field.

## Model Context Protocol (`@modelcontextprotocol/sdk`)

- **Used for:** Hearth Alexa+ surface — Streamable HTTP MCP server (`2025-11-25`) with tools, resources (`hearth://…` including HTML plan card), prompts; simulator MCP client discovers/calls tools.
- **Worked well:** Zod tool schemas; Streamable HTTP transports matched Alexa+ requirements; resources/prompts were straightforward to add beside tools.
- **Needs improvement:** Session header (`Mcp-Session-Id`) and stateful vs stateless examples could be clearer for hackathon builders.
- **Learning curve:** Moderate.
- **Use again?** Yes for Alexa+ / agent integrations.

## Amazon Bedrock (`@aws-sdk/client-bedrock-runtime` Converse API)

- **Used for:** (1) Tool-calling agent loop over MCP tools; (2) second Converse pass to polish a spoken Alexa+ briefing; (3) consuming retrieved care-knowledge snippets (RAG-style) in the system prompt.
- **Worked well:** Converse tool-use maps cleanly to MCP; Haiku is fast/cheap for demos; dual-call pattern makes the AWS usage visible in the UI.
- **Needs improvement:** Model enablement per region/account slows first-time setup; a documented “hackathon demo role” would help.
- **Learning curve:** Low–moderate for SDK v3 users.
- **Use again?** Yes.

## Hearth Care KB (local retrieve)

- **Used for:** Accessibility / elder-care snippets injected into Bedrock (and shown in the UI) to demonstrate AWS Builder–style RAG without requiring a provisioned Bedrock Knowledge Base on every laptop.
- **Worked well:** Deterministic, demos cleanly, reinforces the care narrative.
- **Needs improvement:** Would graduate to a real Bedrock Knowledge Base for production.
- **Use again?** Yes as a scaffold.

## Vite + React / Express

- **Used for:** Echo Show–style simulator UI and agent API (keeps AWS credentials server-side).
- **Worked well:** Fast DX; proxy to API; multimodal plan hero + tool-call animation for judging.
- **Use again?** Yes.

## AWS Builder mini-challenge summary

We used **Amazon Bedrock Runtime (Converse)** twice per turn when enabled: tool orchestration + spoken briefing polish, with retrieved elder-care knowledge in context. The same MCP tools always run so judges see real protocol traffic even on the offline path.
