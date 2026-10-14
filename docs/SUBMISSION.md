# Amazon Developer Hackathon — Official Submission

> **Project Name:** Nexus Impact AI  
> **Repository License:** Open Source (MIT License)  
> **Submission Deadline:** October 2026  

---

## 1. Project Summary (Exactly 150 Words)

Nexus Impact AI is an offline-first, mobile workspace providing seven domain-specialized AI agents for frontline humanitarian responders, epidemiologists, and social impact researchers. Powered by Amazon Bedrock (Converse API with Claude 3.5 Sonnet and Amazon Nova) and self-hosted over Streamable HTTP Model Context Protocol (MCP 2025-11-25), Nexus eliminates the generic, unreliable outputs of consumer chatbots. Responders can speak directly into Alexa+ or our simulator to calculate emergency Sphere Standards (15 liters of potable water per person daily), model outbreak doubling times, or architect donor-grade 7-section USAID and ECHO grant proposals with logframes. When disaster strikes and connectivity drops, Nexus operates honestly: caching verified outputs in local IndexedDB, clearly labeling offline results, and queuing urgent field requests to automatically drain upon reconnection. By bridging enterprise AWS foundation models with real-world edge usability, Nexus Impact AI turns high-stakes field complexity into actionable, life-saving operational blueprints.

---

## 2. Tracks & Mini Challenges Entered

- **Primary Track — Alexa+ Track**:  
  Self-hosted Streamable HTTP MCP server implementing the official 2025-11-25 specification over `/mcp`. Features an interactive Alexa+ voice simulator with browser Web Speech recognition, SpeechSynthesis audio delivery, live JSON-RPC 2.0 call logging with millisecond latencies, and automated conformance tests.
- **Mini Challenge 1 — AWS Builder Mini Challenge**:  
  Server-side Amazon Bedrock Converse API integration with Claude 3.5 Sonnet v2 and Amazon Nova Pro, principle of least privilege IAM policies, zero client-side credential exposure, graceful error classification, and Amazon S3 evidence vaulting.
- **Mini Challenge 2 — Open Source Mini Challenge**:  
  Open source under the permissive MIT License, featuring comprehensive Mermaid architecture diagrams, a 5-command setup guide, developer friction logs, product feedback, and reproducible unit/conformance test suites.

---

## 3. Demo Video Script (Duration: Exactly 2 Minutes 45 Seconds)

### **[0:00 - 0:15] The Hook: Offline Toggle & Live MCP Call Log**
* **Visual:** Close-up of Nexus Impact AI web interface. The presenter's mouse clicks the green **"Online"** badge in the header—it flips instantly to **"Offline Mode"** with an amber indicator.
* **Audio / Voiceover:** *"In a disaster zone, generic AI chatbots fail. When connectivity drops, Nexus Impact AI operates genuinely offline. Watch this: we flip the offline toggle..."*
* **Visual:** Switch immediately to the **Alexa+** tab. The presenter speaks into the microphone: *"Alexa, ask Nexus for emergency water requirements for 25,000 displaced people in Lower Shabelle."*
* **Visual:** The live MCP JSON-RPC 2.0 Call Log instantly captures `POST /mcp` with header `MCP-Protocol-Version: 2025-11-25` and latency `28ms`. The audio synthesizer speaks the concise Sphere allocation.

### **[0:15 - 0:45] Alexa+ Track: Self-Hosted MCP Server**
* **Visual:** Inspect the JSON-RPC 2.0 inspector box showing the `tools/call` payload and `_meta.voiceSummary`.
* **Voiceover:** *"Nexus implements the official Model Context Protocol 2025-11-25 spec over Streamable HTTP. Every agent is registered as a native MCP tool, returning concise voice answers for Alexa+ and full operational tables for the screen."*
* **Visual:** Click **"Run Conformance Test"**. Show green badges verifying SSE handshakes, tools discovery, and JSON-RPC dispatch.

### **[0:45 - 1:20] AWS Builder: Bedrock Converse API & S3 Vault**
* **Visual:** Switch to the **AWS Cloud** tab. Show the active model selector (`Claude 3.5 Sonnet v2`, `Amazon Nova Pro`, `Nova Micro`).
* **Voiceover:** *"All inferences execute server-side through the Amazon Bedrock Converse API. Zero AWS credentials ever touch the browser. In our AWS tab, reviewers can inspect live CloudWatch latency metrics, least-privilege IAM policies, and encrypted Amazon S3 evidence vaulting."*
* **Visual:** Switch to **Workspace**, click **"Archive to Amazon S3"** on the USAID Grant Proposal. Show the SHA-256 tamper-evident checksum and KMS encryption metadata.

### **[1:20 - 1:55] Frontline Domain Rigor: Sphere Standards & Logframes**
* **Visual:** Open the **Humanitarian Emergency Response** agent. Click **"Execute 1-Click Scenario"**.
* **Visual:** Within 2 seconds, the 4-section plan renders: 15L potable water/person/day, 1:20 latrine ratios with female locks, 3.5m² living space, and 72-hour staging checklists.
* **Voiceover:** *"Generic chatbots hallucinate ratios. Nexus enforces international benchmarks. Every calculation adheres to Sphere 2018 Standards and WHO EWARS outbreak surveillance protocols."*
* **Visual:** Click **"Challenge Answer"**. Show the second-pass adversarial audit finding hidden logistical bottlenecks and fuel assumptions.

### **[1:55 - 2:25] Honest Offline-First Architecture & Sync Queue**
* **Visual:** Open the **IndexedDB Evidence Vault** modal (`nexus_impact_offline_v2`).
* **Voiceover:** *"Nexus never pretends offline output is live cloud Bedrock. Results generated offline are clearly badged 'On-device (offline, lower accuracy)' and stored in local IndexedDB."*
* **Visual:** Show the Sync Queue containing pending requests. Click **"Go Online"** and press **"Re-run with Cloud (Bedrock)"**. The queue updates and synchronizes with Bedrock in real time.

### **[2:25 - 2:45] Open Source, Quality Benchmarks & Close**
* **Visual:** Switch to the **Evaluations** tab. Show the 20-test empirical benchmark suite running key-point rubric matching.
* **Visual:** Split screen showing the GitHub repository with the MIT License and comprehensive docs.
* **Voiceover:** *"100% open source under the MIT License, tested for WCAG AAA accessibility down to 360px mobile screens, and ready for deployment. Nexus Impact AI bridges Amazon Bedrock and Alexa+ with the frontline heroes saving lives. Thank you."*
* **Visual:** Title card with GitHub URL, AWS Bedrock badge, and Alexa+ MCP banner.

---

## 4. Checklist: What You Must Do Manually & What Could Not Be Verified

### A. Manual Steps Required by You Before Final Submission
1. **Record the 2:45 Video**: Follow the exact timed script in Section 3 above, starting with the offline toggle flip and live MCP JSON-RPC call log in the first 15 seconds.
2. **AWS Bedrock Account Enablement**: If you want to run live AWS Bedrock calls rather than the automated domain simulation mode, verify that Model Access is granted for Claude 3.5 Sonnet (`anthropic.claude-3-5-sonnet-20241022-v2:0`) and Amazon Nova in your AWS Console (us-east-1). Add your AWS credentials in `.env` or AI Studio secrets.
3. **Bedrock Guardrails ID**: If using managed Amazon Bedrock Guardrails, configure a Guardrail in AWS Bedrock console and supply `BEDROCK_GUARDRAIL_ID` and `BEDROCK_GUARDRAIL_VERSION` in your `.env`.
4. **Legal Review**: As explicitly badged on all policy templates ("Draft template, review with legal counsel before deployment"), have your legal advisor review the draft Privacy, Cookie, and Terms policies before deploying in jurisdictional production settings.
5. **Physical Echo / Alexa+ Hardware**: While the built-in Alexa+ simulator and `/mcp` server strictly adhere to the MCP 2025-11-25 Streamable HTTP specification, linking a physical Amazon Echo requires registering an Alexa Skill in the Amazon Alexa Developer Console pointing to your public HTTPS domain endpoint (`https://<your-app>/mcp`).

### B. What Could Not Be Automatically Verified
1. **Live AWS Account Billing**: Live Bedrock token usage and S3 bucket provisioning require your specific AWS Account ID and paid credentials, which are not hardcoded or stored in the repository.
2. **Physical Satellite / 2G Latency on Real Hardware**: Offline caching and low-bandwidth modes have been verified via software network simulation, IndexedDB unit tests, and DevTools 2G throttling; testing on physical satellite terminals (e.g. BGAN, Starlink Mini) in refugee camp conditions must be validated in the field.
3. **Ge'ez & African Script On-Device Neural Weights**: While 11 languages are fully supported in UI and output, low-end on-device quantized models (WebLLM/Transformers.js) have limited Ge'ez and agglutinative vocabulary coverage (honestly badged with an in-app warning banner); cloud Bedrock models provide full fidelity.
