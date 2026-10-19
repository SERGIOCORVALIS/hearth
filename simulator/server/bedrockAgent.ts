import {
  BedrockRuntimeClient,
  ConverseCommand,
  type Message,
  type ToolConfiguration,
  type ContentBlock,
  type ToolResultContentBlock,
} from "@aws-sdk/client-bedrock-runtime";
import type { ScenarioId } from "@hearth/shared";
import type { HearthMcpClient, ListedTool, ToolCallRecord } from "./mcpClient.js";
import { runOfflineAgent, type AgentTurnResult } from "./offlineAgent.js";
import { formatKnowledgeForPrompt, retrieveKnowledge, type KnowledgeHit } from "./knowledge.js";
import { cloudWatchEnabled, putHearthCloudWatchEvent } from "./cloudwatch.js";
import {
  isDemoNetwork,
  sleep,
  VIRTUAL_AWS_SERVICES,
  virtualBedrockDelayMs,
} from "./demoNetwork.js";

const SYSTEM_BASE = `You are Alexa+ simulating a warm family concierge named Hearth.
You help households plan evenings that work for kids and elders — accessibility and elder care are first-class.
Always use the available MCP tools when you need household facts or to create plans, reminders, or care check-ins.
Prefer inclusive, accessibility-aware suggestions (captions, gentle audio, clear pathways, seated options).
Name active household members explicitly when explaining why a plan fits.
When plans include whyForMembers, chips, timeline, or constraintWarnings, weave them into a spoken reply.
When you finalize a plan, call confirm_plan, create_reminder, get_plan_visual, and get_evening_state.
For elder care check-ins, use the elder member id from the profile (or memberId "elder").
Use the retrieved care knowledge snippets when relevant.
Keep replies concise and device-friendly (Echo Show style).`;

export type BedrockAgentOptions = {
  scenario?: ScenarioId | null;
  household?: string | null;
};

function toBedrockTools(tools: ListedTool[]): ToolConfiguration {
  return {
    tools: tools.map((t) => ({
      toolSpec: {
        name: t.name,
        description: t.description ?? t.name,
        inputSchema: {
          json: (t.inputSchema ?? {
            type: "object",
            properties: {},
          }) as never,
        },
      },
    })) as ToolConfiguration["tools"],
  };
}

function extractText(content: ContentBlock[] | undefined): string {
  if (!content) return "";
  return content
    .map((block) => ("text" in block && block.text ? block.text : ""))
    .filter(Boolean)
    .join("\n")
    .trim();
}

async function polishSpokenBriefing(
  client: BedrockRuntimeClient,
  modelId: string,
  draft: string,
  knowledge: KnowledgeHit[],
): Promise<string> {
  const response = await client.send(
    new ConverseCommand({
      modelId,
      system: [
        {
          text: "Rewrite the assistant draft as a warm 4–6 sentence Alexa+ spoken briefing for a living-room display. Keep member names and accessibility details. No markdown headings.",
        },
      ],
      messages: [
        {
          role: "user",
          content: [
            {
              text: `${formatKnowledgeForPrompt(knowledge)}\n\nDraft to polish:\n${draft}`,
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 400, temperature: 0.4 },
    }),
  );
  return extractText(response.output?.message?.content) || draft;
}

/**
 * Demo path: real local MCP tools + Bedrock-shaped response (no AWS network).
 */
async function runVirtualBedrockAgent(
  mcp: HearthMcpClient,
  userMessage: string,
  opts?: BedrockAgentOptions,
): Promise<AgentTurnResult> {
  const region = process.env.AWS_REGION ?? "us-east-1";
  const modelId = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0";
  const started = performance.now();

  await sleep(virtualBedrockDelayMs());

  const offline = await runOfflineAgent(mcp, userMessage, opts?.scenario, opts?.household);
  const knowledgeHits = offline.knowledgeHits ?? retrieveKnowledge(userMessage, 3);
  const awsServices = [...VIRTUAL_AWS_SERVICES];
  const latencyMs = Math.round(performance.now() - started);

  if (cloudWatchEnabled()) {
    await putHearthCloudWatchEvent({
      service: "hearth",
      kind: "bedrock_turn",
      region,
      modelId,
      latencyMs,
      toolNames: offline.toolCalls.map((t) => t.name),
      awsServices,
      knowledgeIds: knowledgeHits.map((h) => h.id),
      mode: "bedrock",
      note: "Virtual Bedrock demo turn (no AWS network)",
    });
  }

  return {
    ...offline,
    mode: "bedrock",
    knowledgeHits,
    awsServices,
    latencyMs,
    reply: offline.reply,
  };
}

async function runLiveBedrockAgent(
  mcp: HearthMcpClient,
  userMessage: string,
): Promise<AgentTurnResult> {
  const started = performance.now();
  const modelId = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0";
  const region = process.env.AWS_REGION ?? "us-east-1";

  const knowledgeHits = retrieveKnowledge(userMessage, 3);
  const client = new BedrockRuntimeClient({ region });
  const listed = await mcp.listTools();
  const toolConfig = toBedrockTools(listed);

  const systemText = `${SYSTEM_BASE}\n\n${formatKnowledgeForPrompt(knowledgeHits)}`;

  const messages: Message[] = [{ role: "user", content: [{ text: userMessage }] }];

  const toolCalls: ToolCallRecord[] = [];
  let planCard: unknown | null = null;
  let visualCard: unknown | null = null;
  let eveningState: unknown | null = null;
  let finalText = "";
  const awsServices = ["bedrock-runtime:Converse", "hearth-care-kb:retrieve"];

  for (let turn = 0; turn < 6; turn++) {
    const response = await client.send(
      new ConverseCommand({
        modelId,
        system: [{ text: systemText }],
        messages,
        toolConfig,
        inferenceConfig: { maxTokens: 1024, temperature: 0.3 },
      }),
    );

    const output = response.output?.message;
    if (!output) {
      throw new Error("Bedrock returned an empty message");
    }

    messages.push(output);

    const toolUseBlocks = (output.content ?? []).filter((b) => b.toolUse !== undefined);

    if (toolUseBlocks.length === 0) {
      finalText = extractText(output.content);
      break;
    }

    const toolResultContent: ContentBlock[] = [];

    for (const block of toolUseBlocks) {
      const toolUse = block.toolUse!;
      const name = toolUse.name ?? "unknown";
      const toolUseId = toolUse.toolUseId ?? `tool-${Date.now()}`;
      const args = (toolUse.input ?? {}) as Record<string, unknown>;

      try {
        const record = await mcp.callTool(name, args);
        toolCalls.push(record);
        if (name === "confirm_plan") planCard = record.result;
        if (name === "get_plan_visual") visualCard = record.result;
        if (name === "get_evening_state") eveningState = record.result;

        const resultPayload: ToolResultContentBlock =
          typeof record.result === "object" && record.result !== null
            ? { json: record.result as never }
            : { text: String(record.result) };

        toolResultContent.push({
          toolResult: {
            toolUseId,
            content: [resultPayload],
            status: "success",
          },
        });
      } catch (error) {
        toolResultContent.push({
          toolResult: {
            toolUseId,
            content: [
              {
                text: error instanceof Error ? error.message : String(error),
              },
            ],
            status: "error",
          },
        });
      }
    }

    messages.push({
      role: "user",
      content: toolResultContent,
    });
  }

  if (!finalText) {
    finalText = "I finished updating your household tools. Check the plan card for details.";
  }

  try {
    finalText = await polishSpokenBriefing(client, modelId, finalText, knowledgeHits);
    awsServices.push("bedrock-runtime:Converse(briefing)");
  } catch {
    // Keep tool-loop draft if briefing polish fails
  }

  const latencyMs = Math.round(performance.now() - started);

  if (cloudWatchEnabled()) {
    awsServices.push("logs:PutLogEvents");
    await putHearthCloudWatchEvent({
      service: "hearth",
      kind: "bedrock_turn",
      region,
      modelId,
      latencyMs,
      toolNames: toolCalls.map((t) => t.name),
      awsServices,
      knowledgeIds: knowledgeHits.map((h) => h.id),
      mode: "bedrock",
      note: "Alexa+ family evening turn",
    });
  }

  return {
    mode: "bedrock",
    toolCalls,
    planCard,
    visualCard,
    eveningState,
    reply: finalText,
    latencyMs,
    knowledgeHits,
    awsServices,
  };
}

export async function runBedrockAgent(
  mcp: HearthMcpClient,
  userMessage: string,
  opts?: BedrockAgentOptions,
): Promise<AgentTurnResult> {
  if (isDemoNetwork()) {
    return runVirtualBedrockAgent(mcp, userMessage, opts);
  }

  const parts = [
    opts?.household ? `[Household: ${opts.household}]` : "",
    opts?.scenario ? `[Scenario: ${opts.scenario}]` : "",
    userMessage,
  ].filter(Boolean);
  return runLiveBedrockAgent(mcp, parts.join(" "));
}

export function hasLiveAwsCredentials(env: NodeJS.ProcessEnv = process.env): boolean {
  return Boolean(
    env.AWS_ACCESS_KEY_ID ||
    env.AWS_PROFILE ||
    env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    env.AWS_WEB_IDENTITY_TOKEN_FILE,
  );
}

export function bedrockEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  if (env.HEARTH_FORCE_OFFLINE === "1" || env.HEARTH_FORCE_OFFLINE === "true") return false;
  // Demo default: virtual Bedrock so the AWS Builder UI path always works offline.
  if (isDemoNetwork(env)) return true;
  return hasLiveAwsCredentials(env);
}
