# Product Feedback: Amazon Bedrock & Model Context Protocol (MCP)

> **Submitted for:** Amazon Developer Hackathon (Alexa+ Track & AWS Builder Challenge)  
> **Author:** Nexus Impact AI Engineering Team  
> **Date:** October 2026  

---

## 1. Amazon Bedrock Converse API Feedback

### Strengths
1. **Unified Schema Across Diverse Providers**: The `ConverseCommand` is a tremendous improvement over provider-specific `invokeModel` request bodies. Switching from Anthropic Claude 3.5 Sonnet to Amazon Nova Pro required modifying only the `modelId` string without altering message payloads or parsing logic.
2. **System Prompt Grounding**: Clean architectural separation between `system` instructions and conversational `messages` prevents prompt injection attacks and ensures agents strictly adhere to Sphere 2018 Standards and WHO EWARS frameworks.
3. **Enterprise Data Privacy Guarantees**: For social impact, human rights, and humanitarian data, Amazon Bedrock's enterprise privacy policy (zero customer data retained for base model training) is indispensable for organizational trust.

### Areas for Improvement
1. **Automated Fallback Profiles**: When a primary foundation model encounters regional capacity spikes or rate limiting (`ThrottlingException`), having an automated fallback profile within Bedrock (e.g., automatically stepping from Claude 3.5 Sonnet to Nova Pro) would significantly enhance field reliability during acute crises.
2. **Native Token Cost Transparency**: Providing calculated USD costs directly inside `ConverseResponse.usage` (e.g. `estimatedCostUsd`) would enable resource-constrained NGOs to track operational budgets in real time.
3. **Cross-Region Inference Helper**: The SDK should provide native helper methods to automatically resolve cross-region inference profile prefixes (e.g., `us.` or `eu.`) without requiring developers to manually build prefix mappers.

---

## 2. Model Context Protocol (MCP) Streamable HTTP Feedback

### Strengths
1. **Universal Tool Decoupling**: Exposing social-impact agents as MCP tools allows Alexa+, web frontends, command-line utilities, and external agent orchestrators to invoke the exact same operational logic without duplicate code.
2. **Streamable HTTP Spec (2025-11-25)**: Consolidating transport into a single `/mcp` endpoint with SSE handshakes and standard JSON-RPC 2.0 requests dramatically simplifies reverse proxy configuration and Cloud Run / ECS deployment.

### Areas for Improvement
1. **Official Audio / Spoken Metadata Schema**: The MCP specification currently standardizes text and image content blocks. Introducing an official `spokenSummary` or voice synthesis metadata field in the tool response schema would standardize Alexa+ and conversational assistant interoperability.
2. **Standardized Offline Caching Guidelines**: Establishing an official offline-first caching and queueing recommendation in the MCP client specification would assist developers building mission-critical tools for disconnected edge environments.
