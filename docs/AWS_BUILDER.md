# AWS Builder mini — Amazon Bedrock

## What we use

| Service                                          | Where                              | Purpose                                                                                                                                         |
| ------------------------------------------------ | ---------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------- |
| **Amazon Bedrock Runtime** `Converse`            | `simulator/server/bedrockAgent.ts` | Tool-calling agent loop over Hearth MCP tools                                                                                                   |
| **Amazon Bedrock Runtime** `Converse` (2nd call) | same file `polishSpokenBriefing`   | Spoken Alexa+ briefing polish                                                                                                                   |
| **Hearth Care KB retrieve**                      | `simulator/server/knowledge.ts`    | RAG-style care/accessibility snippets injected into Bedrock (KB pattern without requiring a provisioned Bedrock Knowledge Base for the PC demo) |
| **Amazon CloudWatch Logs** `PutLogEvents`        | `simulator/server/cloudwatch.ts`   | Optional demo log group (`HEARTH_CLOUDWATCH_LOG_GROUP`, default `/hearth/aws-builder`) for the AWS Builder video clip                           |

UI proof for judges:

- Green/orange pill **AWS: Bedrock reasoning**
- Device strip **Reasoning on Amazon Bedrock**
- **Care knowledge** panel listing retrieved snippets + `awsServices` chips

## Demo default (no AWS account)

Hearth ships with **virtual Bedrock** + **CloudWatch dry-run**. `npm run demo` and `npm run proof:bedrock` work offline and still show the AWS Builder UI pills / service chips.

## Enable live Bedrock on your PC

1. Set `HEARTH_LIVE_AWS=1` and use an AWS account with Bedrock model access (e.g. Claude Haiku) in your region.
2. Credentials via profile or env:

```powershell
$env:AWS_REGION="us-east-1"
$env:AWS_PROFILE="your-profile"
$env:BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
# Do NOT set HEARTH_FORCE_OFFLINE
npm run demo
```

3. Confirm UI Agent pill shows `bedrock` after `/api/health`.
4. Send a prompt — strip should say **Reasoning on Amazon Bedrock**.

## Video talking point

“The agent reasons with Amazon Bedrock Converse — it selects MCP tools, then a second Bedrock pass polishes the spoken briefing using retrieved elder-care knowledge. We emit a CloudWatch Logs event so judges can see the AWS footprint in console.”

If credentials are missing, the offline MCP router still runs the same tools and care KB retrieve so the demo never breaks — say that honestly in the video.

## Record the clip

Step-by-step shot list + dry-run: [`AWS_BUILDER_CLIP.md`](AWS_BUILDER_CLIP.md)

```powershell
$env:HEARTH_CLOUDWATCH_DRY_RUN="1"; npm run proof:bedrock   # rehearse
# with creds:
$env:HEARTH_CLOUDWATCH_LOG_GROUP="/hearth/aws-builder"; npm run proof:bedrock
```
