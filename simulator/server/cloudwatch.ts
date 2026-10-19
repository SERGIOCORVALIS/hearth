import {
  CloudWatchLogsClient,
  CreateLogGroupCommand,
  CreateLogStreamCommand,
  DescribeLogStreamsCommand,
  PutLogEventsCommand,
} from "@aws-sdk/client-cloudwatch-logs";
import { isDemoNetwork } from "./demoNetwork.js";

export type HearthCloudWatchEvent = {
  service: "hearth";
  kind: "bedrock_turn" | "bedrock_proof";
  region: string;
  modelId: string;
  latencyMs: number;
  toolNames?: string[];
  awsServices?: string[];
  knowledgeIds?: string[];
  mode?: string;
  note?: string;
};

export function cloudWatchEnabled(env: NodeJS.ProcessEnv = process.env): boolean {
  // Demo default: always emit a virtual CloudWatch event (dry-run).
  if (isDemoNetwork(env)) return true;
  if (env.HEARTH_CLOUDWATCH_DRY_RUN === "1" || env.HEARTH_CLOUDWATCH_DRY_RUN === "true") {
    return true;
  }
  return Boolean(env.HEARTH_CLOUDWATCH_LOG_GROUP?.trim());
}

function shouldDryRun(env: NodeJS.ProcessEnv = process.env): boolean {
  if (isDemoNetwork(env)) return true;
  return env.HEARTH_CLOUDWATCH_DRY_RUN === "1" || env.HEARTH_CLOUDWATCH_DRY_RUN === "true";
}

export function cloudWatchLogGroup(env: NodeJS.ProcessEnv = process.env): string {
  return env.HEARTH_CLOUDWATCH_LOG_GROUP?.trim() || "/hearth/aws-builder";
}

export function cloudWatchLogStream(env: NodeJS.ProcessEnv = process.env): string {
  const custom = env.HEARTH_CLOUDWATCH_LOG_STREAM?.trim();
  if (custom) return custom;
  const stamp = new Date().toISOString().slice(0, 13).replace(/:/g, "-");
  return `demo-${stamp}`;
}

/**
 * Best-effort CloudWatch Logs put for AWS Builder video proof.
 * Never throws into the chat path — failures are logged and ignored.
 */
export async function putHearthCloudWatchEvent(
  event: HearthCloudWatchEvent,
  env: NodeJS.ProcessEnv = process.env,
): Promise<{ ok: boolean; dryRun?: boolean; error?: string; group?: string; stream?: string }> {
  if (!cloudWatchEnabled(env)) {
    return { ok: false, error: "CloudWatch disabled (set HEARTH_CLOUDWATCH_LOG_GROUP)" };
  }

  const group = cloudWatchLogGroup(env);
  const stream = cloudWatchLogStream(env);
  const message = JSON.stringify({ ...event, at: new Date().toISOString() });

  if (shouldDryRun(env)) {
    console.log(`[hearth-cw] DRY_RUN group=${group} stream=${stream}`);
    console.log(`[hearth-cw] ${message}`);
    return { ok: true, dryRun: true, group, stream };
  }

  const region = env.AWS_REGION ?? event.region ?? "us-east-1";
  const client = new CloudWatchLogsClient({ region });

  try {
    await ensureLogGroup(client, group);
    await ensureLogStream(client, group, stream);
    const described = await client.send(
      new DescribeLogStreamsCommand({
        logGroupName: group,
        logStreamNamePrefix: stream,
        limit: 5,
      }),
    );
    const token = described.logStreams?.find(
      (s) => s.logStreamName === stream,
    )?.uploadSequenceToken;

    await client.send(
      new PutLogEventsCommand({
        logGroupName: group,
        logStreamName: stream,
        sequenceToken: token,
        logEvents: [{ timestamp: Date.now(), message }],
      }),
    );
    return { ok: true, group, stream };
  } catch (error) {
    const msg = error instanceof Error ? error.message : String(error);
    console.warn("[hearth-cw] PutLogEvents failed:", msg);
    return { ok: false, error: msg, group, stream };
  }
}

async function ensureLogGroup(client: CloudWatchLogsClient, group: string): Promise<void> {
  try {
    await client.send(new CreateLogGroupCommand({ logGroupName: group }));
  } catch (error) {
    if (!isAlreadyExists(error)) {
      // Caller may lack logs:CreateLogGroup; PutLogEvents will fail clearly if group missing.
    }
  }
}

async function ensureLogStream(
  client: CloudWatchLogsClient,
  group: string,
  stream: string,
): Promise<void> {
  try {
    await client.send(new CreateLogStreamCommand({ logGroupName: group, logStreamName: stream }));
  } catch (error) {
    if (!isAlreadyExists(error)) {
      // Same as group — ignore; put surfaces real errors.
    }
  }
}

function isAlreadyExists(error: unknown): boolean {
  return error instanceof Error && error.name === "ResourceAlreadyExistsException";
}
