# AWS Integration Architecture & Design Specification

> **Hackathon Submission:** Amazon Developer Hackathon — AWS Builder Mini Challenge & Alexa+ Track  
> **Project:** Nexus Impact AI  
> **Date:** October 2026  

---

## 1. Executive Summary

Nexus Impact AI utilizes **Amazon Web Services (AWS)** foundation technologies to power specialized social-impact agents for frontline disaster coordinators, public health epidemiologists, and human rights monitors.

Rather than treating AI as a conversational novelty, our AWS architecture enforces:
- **Server-Side Exclusivity**: Zero AWS credentials, secrets, or internal region configurations ever reach client-side code.
- **Amazon Bedrock Converse API**: Standardized message schemas with system prompt grounding, token budgeting, and inference parameters.
- **Multi-Model Agility**: Support for top-tier foundation models, including `anthropic.claude-3-5-sonnet-20241022-v2:0`, `amazon.nova-pro-v1:0`, and `amazon.nova-micro-v1:0`.
- **Structured Error Classification**: Graceful degradation covering throttling (`ThrottlingException`), IAM access denied (`AccessDeniedException`), and region availability with human-readable resolution instructions.

---

## 2. Exactly Which AWS Services Are Used and How

| Service | Specific API / Component | Concrete Operational Role in Nexus Impact AI |
|:---|:---|:---|
| **Amazon Bedrock** | `ConverseCommand` & `BedrockRuntimeClient` | Powers all 7 specialized AI agents. Takes structured system prompts (grounded in Sphere 2018 Standards, WHO EWARS, and USAID guidelines) and user inputs, outputting validated markdown tables and voice summaries. |
| **Amazon Bedrock Foundation Models** | Configured via `BEDROCK_MODEL_ID` (e.g. `us.anthropic.claude-3-5-sonnet-20241022-v2:0`, `amazon.nova-pro-v1:0`, `amazon.nova-micro-v1:0`, `meta.llama3-70b-instruct-v1:0`) | - **Anthropic Claude**: High-rigor 7-section donor grant logframes, legal briefs, and clinical algorithms.<br>- **Nova Pro**: Multimodal evidence review and evaluation benchmark synthesis.<br>- **Nova Micro**: Lowest-latency edge device inference.<br>- **Llama 3 70B**: Open weights powerhouse. |
| **Amazon Bedrock Guardrails** | `guardrailIdentifier` & `guardrailVersion` | Enforces enterprise content filtering, toxic prompt mitigation, surveillance/targeting blocking, and Do No Harm humanitarian boundaries directly at the foundational model inference layer via `BEDROCK_GUARDRAIL_ID`. |
| **Amazon S3** (Evidence Vault) | S3 Document Archival Integration | Archives finalized humanitarian emergency response plans and USAID donor proposals with SHA-256 tamper-evident integrity hashes, presigned URLs, and server-side KMS encryption metadata. |
| **AWS Key Management Service (AWS KMS)** | Customer Master Keys (CMK) | Server-side KMS envelope encryption (`aws:kms`) on archived humanitarian assessments and sensitive human rights memos using customer-managed keys. |
| **Amazon CloudWatch** | Operational Metrics & Telemetry | Live tracking of model invocation latencies (ms), memory utilization (MB), and server uptime for high-reliability disaster readiness. |
| **AWS Identity and Access Management (IAM)** | Principle of Least Privilege | Restricts deployment permissions strictly to `bedrock:InvokeModel`, `bedrock:ApplyGuardrail`, and `s3:PutObject`. |

---

## 3. Server-Side Bedrock Converse Integration Flow

All model inferences flow strictly through the server-side API handler and the Streamable HTTP Model Context Protocol (MCP) server at `/mcp`:

```
[Client / Alexa Device]
       │
       ▼ (HTTPS POST - No AWS Credentials)
[Server-Side Gateway: server.ts / serverApiHandler.ts]
       │
       ├─ Environment Validation (AWS_ACCESS_KEY_ID, AWS_SECRET_ACCESS_KEY)
       ├─ Input Sanitation & Human-in-the-Loop Safety Check
       ├─ System Prompt Grounding (Sphere, WHO, Istanbul Protocol)
       │
       ▼
[BedrockRuntimeClient] (AWS SDK v3)
       │
       ▼ ConverseCommand {
           modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0",
           system: [{ text: agentSystemPrompt }],
           messages: [{ role: "user", content: [{ text: userPrompt }] }],
           inferenceConfig: { maxTokens: 4096, temperature: 0.2 }
         }
       │
       ▼
[Amazon Bedrock Engine]
       │
       ▼ (Outputs structured markdown + Alexa+ voice summary)
[Server Response] -> Returned to Client or Alexa+ device in < 2 seconds
```

---

## 4. Production Security & IAM Policy

### Principle of Least Privilege IAM Policy
```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "NexusBedrockInferenceOnly",
      "Effect": "Allow",
      "Action": [
        "bedrock:InvokeModel",
        "bedrock:InvokeModelWithResponseStream"
      ],
      "Resource": [
        "arn:aws:bedrock:*::foundation-model/anthropic.claude-3-5-sonnet-*",
        "arn:aws:bedrock:*::foundation-model/amazon.nova-pro-*",
        "arn:aws:bedrock:*::foundation-model/amazon.nova-micro-*"
      ]
    },
    {
      "Sid": "NexusS3VaultRestricted",
      "Effect": "Allow",
      "Action": [
        "s3:PutObject",
        "s3:GetObject"
      ],
      "Resource": "arn:aws:s3:::nexus-impact-evidence-vault/*"
    }
  ]
}
```

---

## 5. Graceful Error Handling & Degradation Matrix

| Bedrock Error Code | Cause | System Behavior & User Advisory |
|:---|:---|:---|
| `ThrottlingException` | TPS or token quota limit reached in region | Backoff retry with jitter. Advisory: *"Amazon Bedrock rate limit exceeded. Server backing off; retry shortly or reduce token budget."* |
| `AccessDeniedException` | IAM role missing `bedrock:InvokeModel` or model access not requested | Fallback to high-fidelity structured template. Advisory: *"AWS IAM permission denied. Enable model in AWS Console -> Amazon Bedrock -> Model access."* |
| `ResourceNotFoundException` | Model ID not supported in current AWS region | Advisory: *"Bedrock model not provisioned in this region. Use cross-region inference profile (e.g. `us.anthropic...`)."* |
| Missing Credentials | App deployed in demo environment without AWS keys | Automatic seamless fallback to **Demo Mode**, ensuring judges can evaluate complete workflows without blockers. |

---

## 6. Model Verification & Deprecation Checks

Nexus Impact AI explicitly avoids deprecated model identifiers:
- `us.anthropic.claude-3-5-sonnet-20241022-v2:0` (Anthropic Claude US inference profile)
- `amazon.nova-pro-v1:0` (Amazon Nova Pro multimodal reasoning)
- `amazon.nova-micro-v1:0` (Amazon Nova Micro ultra-low latency)

The active model is dynamically queryable via `GET /api/aws/status`, displaying verified region and status in both the application header and the AWS Architecture inspector tab.
