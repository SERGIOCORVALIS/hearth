# AWS Builder mini — record the Bedrock + CloudWatch clip

5–15 second insert for the Devpost video. Works offline in **dry-run** (rehearsal); live mode needs AWS credentials + Bedrock model access.

## Quick start

```powershell
# Rehearse shot list + sample CloudWatch JSON (no AWS account needed)
$env:HEARTH_CLOUDWATCH_DRY_RUN="1"
npm run proof:bedrock

# Live proof (when keys exist)
Remove-Item Env:HEARTH_CLOUDWATCH_DRY_RUN -ErrorAction SilentlyContinue
$env:AWS_REGION="us-east-1"
$env:AWS_PROFILE="your-profile"   # or AWS_ACCESS_KEY_ID / SECRET
$env:BEDROCK_MODEL_ID="anthropic.claude-3-haiku-20240307-v1:0"
$env:HEARTH_CLOUDWATCH_LOG_GROUP="/hearth/aws-builder"
# Do NOT set HEARTH_FORCE_OFFLINE
npm run proof:bedrock
```

IAM for live CloudWatch: `logs:CreateLogGroup`, `logs:CreateLogStream`, `logs:DescribeLogStreams`, `logs:PutLogEvents` on `/hearth/aws-builder*`.

## Shot list (record in order)

| #   | What                                                        | Where                                  |
| --- | ----------------------------------------------------------- | -------------------------------------- |
| 1   | Terminal: `Bedrock Converse OK in …ms` + assistant line     | `npm run proof:bedrock`                |
| 2   | Bedrock console: model access / Chat playground (Haiku)     | AWS Console → Amazon Bedrock           |
| 3   | CloudWatch log group `/hearth/aws-builder` JSON event       | AWS Console → CloudWatch → Log groups  |
| 4   | Hearth UI: **AWS: Bedrock reasoning** pill + Care knowledge | `npm run demo` (creds on, offline off) |

## Runtime logging

When `HEARTH_CLOUDWATCH_LOG_GROUP` is set (or dry-run), each successful Bedrock agent turn also emits `logs:PutLogEvents` and adds `logs:PutLogEvents` to the UI `awsServices` chips.

See also: [`AWS_BUILDER.md`](AWS_BUILDER.md) · [`STRONG_PLUS.md`](STRONG_PLUS.md)
