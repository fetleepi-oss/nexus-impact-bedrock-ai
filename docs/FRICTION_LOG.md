# Amazon Developer Hackathon — Friction Log

> **Project:** Nexus Impact AI  
> **Topic:** Real Developer Friction Encountered with Amazon Bedrock SDK, Model Context Protocol (MCP), and Offline Edge Bundling  
> **Date:** October 2026  

---

### Incident 1: Vite / Rolldown Static Bundler Resolution on Edge Neural Packages
- **Task:** Implementing client-side on-device neural inference (`SmolLM-135M`) via dynamic `import('@huggingface/transformers')` for offline edge operations.
- **Steps Taken:**
  1. Authored `src/onDeviceModel.ts` with a runtime `try { const { pipeline } = await import('@huggingface/transformers'); } catch {}` block.
  2. Executed `npm run build` (`vite build`).
- **Expected:** The bundler should treat dynamic imports inside `try/catch` as optional runtime chunks without halting compilation.
- **Actual:** Build failed immediately with `Error: [vite]: Rolldown failed to resolve import "@huggingface/transformers" from "/src/onDeviceModel.ts"`.
- **Severity:** High (blocked production build).
- **Workaround:** Used `/* @vite-ignore */` with a dynamic string variable: `const pkg = '@huggingface/transformers'; await import(/* @vite-ignore */ pkg);`, paired with an instant local RAG engine grounded in bundled Sphere/WHO text.
- **Suggestion for Tooling Teams:** Bundlers should provide standard annotations or warnings rather than fatal errors when dynamic imports fail resolution in optional runtime code.

---

### Incident 2: Cross-Region Bedrock Model ID Formatting in AWS SDK v3
- **Task:** Invoking Claude 3.5 Sonnet v2 through the Amazon Bedrock Converse API in non-`us-east-1` regions (e.g. `eu-west-1` or `eu-central-1`).
- **Steps Taken:**
  1. Configured `AWS_REGION=eu-west-1` in `.env`.
  2. Passed `modelId: "anthropic.claude-3-5-sonnet-20241022-v2:0"` to `ConverseCommand`.
  3. Dispatched inference request.
- **Expected:** Bedrock either routes automatically or returns an actionable error informing that regional cross-region inference profiles (`eu.anthropic...` or `us.anthropic...`) are required.
- **Actual:** Threw generic `ValidationException: The provided model identifier is invalid or not supported in this region.` with no suggested prefix.
- **Severity:** Medium (causes confusion for developers deploying outside US East).
- **Workaround:** Created an automated region resolver in the backend that maps standard model IDs to regional inference profile aliases when non-default regions are detected.
- **Suggestion for AWS Team:** The `@aws-sdk/client-bedrock-runtime` should include a helper method like `BedrockRuntimeClient.resolveInferenceProfile(modelId, region)` or include the valid regional profile ID directly in the `ValidationException` error payload.

---

### Incident 3: MCP Specification (2025-11-25) Streamable HTTP Header Casing
- **Task:** Implementing single-endpoint Streamable HTTP transport compliance for MCP over `/mcp`.
- **Steps Taken:**
  1. Connected via `GET /mcp` with `Accept: text/event-stream`.
  2. Handled incoming `POST /mcp` requests and parsed `Mcp-Session-Id` header.
- **Expected:** Consistent header casing behavior between HTTP/1.1 and HTTP/2 clients.
- **Actual:** Express normalizes incoming headers to lowercase (`req.headers['mcp-session-id']`), whereas some strict client validators reject responses missing Pascal-Kebab-Cased `Mcp-Session-Id` or `MCP-Protocol-Version`.
- **Severity:** Low.
- **Workaround:** Normalized header extraction using case-insensitive access and explicitly set both `Mcp-Session-Id` and `MCP-Protocol-Version` in response headers.
- **Suggestion for MCP / Amazon Teams:** Provide explicit test vectors in the MCP SDK test harness verifying case-insensitive HTTP header compliance.

---

### Incident 4: Voice Summary Extraction for Conversational Alexa+ Output
- **Task:** Generating concise conversational voice summaries for spoken Alexa+ delivery alongside comprehensive 1,500-word structured markdown reports.
- **Steps Taken:**
  1. Prompted Bedrock to generate an emergency humanitarian plan with Sphere ratios.
  2. Model returned complete operational briefing with markdown headers, tables, and bullet points.
- **Expected:** Single model call producing dual output: an auditory 2-sentence conversational spoken summary and a rich visual report.
- **Actual:** LLMs naturally insert markdown headers like `## 1. Water, Sanitation & Hygiene` and pipe tables in the first lines, which sound robotic and unnatural when read by voice synthesizers.
- **Severity:** Medium (degraded voice user experience).
- **Workaround:** Implemented a dual-channel output pipeline in `agentEngine.ts` and `AlexaSimulatorTab.tsx` that extracts `_meta.voiceSummary`, strips markdown symbols, and optimizes audio cadence for Alexa+ SpeechSynthesis.
- **Suggestion for Alexa+ / Bedrock Teams:** Standardize an official `spokenSummary` or audio synthesis block in the Converse API response schema to partition spoken utterances from visual cards.
