/**
 * Terminal proof for AWS Builder video (5–15s screen record).
 *
 * Demo default (no AWS network):
 *   npm run proof:bedrock
 *
 * Live AWS (opt-in):
 *   $env:HEARTH_LIVE_AWS="1"; npm run proof:bedrock
 */
import { BedrockRuntimeClient, ConverseCommand } from "@aws-sdk/client-bedrock-runtime";
import { retrieveKnowledge } from "../simulator/server/knowledge.ts";
import { putHearthCloudWatchEvent } from "../simulator/server/cloudwatch.ts";
import { isDemoNetwork } from "../simulator/server/demoNetwork.ts";

const region = process.env.AWS_REGION ?? "us-east-1";
const modelId = process.env.BEDROCK_MODEL_ID ?? "anthropic.claude-3-haiku-20240307-v1:0";
const demo = isDemoNetwork();
const logGroup = process.env.HEARTH_CLOUDWATCH_LOG_GROUP?.trim() || "/hearth/aws-builder";

function printShotList() {
  console.log(`
=== AWS Builder video clip (5–15s) ===
1. Terminal: this script (virtual or live Bedrock + CloudWatch)
2. Browser: AWS Console → Amazon Bedrock (optional live clip)
3. Browser: CloudWatch → Log groups → ${logGroup} (optional live clip)
4. Cut to Hearth UI pill "AWS: Bedrock reasoning" + Care knowledge panel
`);
}

function hasAwsCreds() {
  return Boolean(
    process.env.AWS_ACCESS_KEY_ID ||
    process.env.AWS_PROFILE ||
    process.env.AWS_CONTAINER_CREDENTIALS_RELATIVE_URI ||
    process.env.AWS_WEB_IDENTITY_TOKEN_FILE,
  );
}

async function main() {
  console.log("=== Hearth AWS Builder proof ===");
  console.log(`region=${region}`);
  console.log(`model=${modelId}`);
  console.log(`cloudwatch_group=${logGroup}`);
  console.log(`network=${demo ? "demo / virtual" : "live AWS"}`);
  printShotList();

  const hits = retrieveKnowledge("elder care captions accessibility school night", 2);
  console.log("\nCare KB retrieve:");
  for (const h of hits) console.log(`- ${h.id}: ${h.title}`);

  if (demo) {
    const cw = await putHearthCloudWatchEvent({
      service: "hearth",
      kind: "bedrock_proof",
      region,
      modelId,
      latencyMs: 42,
      awsServices: ["bedrock-runtime:Converse", "hearth-care-kb:retrieve", "logs:PutLogEvents"],
      knowledgeIds: hits.map((h) => h.id),
      note: "virtual Bedrock proof event (demo — no AWS network)",
    });
    console.log("\nVirtual Bedrock Converse OK in 42ms (demo)");
    console.log(
      "assistant: Sure — I can help plan an accessible family evening with captions for grandma.",
    );
    console.log("\nDEMO complete — no Bedrock/CloudWatch network calls.");
    console.log(`CloudWatch payload ok=${cw.ok} dryRun=${Boolean(cw.dryRun)}`);
    console.log('Live AWS: $env:HEARTH_LIVE_AWS="1"; npm run proof:bedrock');
    return;
  }

  if (!hasAwsCreds()) {
    console.error("\nNo AWS credentials detected for live mode.");
    console.error("Set AWS_PROFILE / AWS_ACCESS_KEY_ID, or stay in demo mode (default).");
    process.exit(2);
  }

  process.env.HEARTH_CLOUDWATCH_LOG_GROUP ??= logGroup;

  const client = new BedrockRuntimeClient({ region });
  const started = Date.now();
  const res = await client.send(
    new ConverseCommand({
      modelId,
      messages: [
        {
          role: "user",
          content: [
            {
              text: "In one short sentence: confirm you can help plan an accessible family evening with captions for grandma.",
            },
          ],
        },
      ],
      inferenceConfig: { maxTokens: 80, temperature: 0.2 },
    }),
  );
  const ms = Date.now() - started;
  const text =
    res.output?.message?.content
      ?.map((b) => ("text" in b ? b.text : ""))
      .join("")
      .trim() ?? "(empty)";

  console.log(`\nBedrock Converse OK in ${ms}ms`);
  console.log(`assistant: ${text}`);

  const cw = await putHearthCloudWatchEvent({
    service: "hearth",
    kind: "bedrock_proof",
    region,
    modelId,
    latencyMs: ms,
    awsServices: ["bedrock-runtime:Converse", "hearth-care-kb:retrieve", "logs:PutLogEvents"],
    knowledgeIds: hits.map((h) => h.id),
    note: "AWS Builder terminal proof",
  });

  console.log(
    "\nServices used: bedrock-runtime:Converse + hearth-care-kb:retrieve + logs:PutLogEvents",
  );
  if (cw.ok) {
    console.log(
      `CloudWatch: group=${cw.group} stream=${cw.stream}${cw.dryRun ? " (dry-run)" : ""}`,
    );
    console.log(
      `Console: https://${region}.console.aws.amazon.com/cloudwatch/home?region=${region}#logsV2:log-groups/log-group/${encodeURIComponent(logGroup)}`,
    );
  } else {
    console.warn(`CloudWatch skipped/failed: ${cw.error ?? "unknown"}`);
    console.warn("Set HEARTH_CLOUDWATCH_LOG_GROUP=/hearth/aws-builder and IAM logs:PutLogEvents.");
  }
  console.log("Record this terminal + Bedrock + CloudWatch console for the video.");
}

main().catch((err) => {
  console.error("\nBedrock proof FAILED:", err.message);
  console.error(
    "Fix: aws configure (or AWS_PROFILE), enable the model in Bedrock, set AWS_REGION.",
  );
  console.error("Or stay in demo mode (default — no HEARTH_LIVE_AWS).");
  process.exit(1);
});
