# Changelog — Nexus Impact AI

All notable changes made during the **Amazon Developer Hackathon Window (October 2026)** are documented in this file. The project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.3.0] - 2026-10-14 — Crisis & Displacement Settings Upgrade

### Added
- **Privacy By Design & Anonymous Use**
  - Zero accounts, zero login, zero tracking, zero third-party analytics scripts, zero canvas fingerprinting.
  - Zero server prompt logging: Prompts and outputs are never stored to server logs or databases.
  - Client-side PII Redaction: Automatically scrubs emails, phone numbers, GPS coordinates, UNHCR/national IDs, and victim names before any cloud call, showing the user exactly what was redacted.
  - "Keep everything on this device" mode: Enforces 100% on-device local execution without ever hitting the cloud network.
  - Web Crypto AES-GCM 256-Bit Vault: Encrypts local IndexedDB records using PBKDF2 key derivation (100,000 iterations) with optional user passphrase.
  - Quick Exit / Panic Wipe: One-click button on every screen and `Esc` pressed 3 times instantly purges IndexedDB, caches, and localStorage, redirecting to a neutral site.
  - Auto-Clear History: User-selectable expiration interval (`1h`, `1d`, `never`) with automated cleanup on app launch.

- **Legal, Policy & Governance Framework**
  - Plain-language legal modals and storage consent banner:
    1. Privacy Policy
    2. Essential Storage Policy (0% advertising or analytics cookies)
    3. Terms of Use
    4. Data Protection & "Do No Harm" Humanitarian Statement
    5. Accessibility Statement (WCAG AAA, 360px viewport, screen reader support)
    6. Responsible-AI Decision Support Notice (clinical dosing and diagnosis blocked; verification required)
  - Every policy prominently marked: *"Draft template, review with legal counsel before deployment."*

- **Multilingual Support (11 Languages) & RTL Inclusion**
  - Full UI and agent output in: English, Arabic (with native RTL layout), French, Portuguese, Swahili, Amharic, Tigrinya, Oromo, Somali, Hausa, and Kinyarwanda.
  - Automatic language detection from browser (`navigator.language`).
  - Transparent in-app model notices honestly warning users of limited on-device Ge'ez/agglutinative vocabulary for weak languages.
  - Safeguarding & protection alerts for agents handling child protection, gender-based violence (GBV), or health triage.

- **Offline Sharing & Low-Bandwidth Mode**
  - Pure client-side SVG QR code transfer allowing responders to share field outputs without internet.
  - Print-friendly layout (`window.print()`) and Markdown export.
  - Low-bandwidth mode with data usage counter (KB) and concise summaries.

- **Security & Automated Testing**
  - Server-side rate limiting (sliding window 60 req/min), strict security headers (`X-Content-Type-Options: nosniff`, `Referrer-Policy: no-referrer`), strict CORS, and `/api/health` route.
  - Amazon Bedrock Guardrails configuration support via `BEDROCK_GUARDRAIL_ID`.
  - Comprehensive automated test suite (`npm run test:mcp`) covering MCP protocol (2025-11-25), PII redaction, AES-GCM encryption round-trip, and Do No Harm guardrails (18/18 tests passing).

---

## [1.2.0] - 2026-10-14 — Hackathon Finalist Release

### Added
- **Alexa+ Track: Model Context Protocol (MCP) Streamable HTTP Server**
  - Implemented the official **MCP Specification (2025-11-25)** over Streamable HTTP on a single unified `/mcp` endpoint (POST and GET).
  - Server-sent events (SSE) handshake returning `event: endpoint` and `event: ready` with protocol version and tools count.
  - Full JSON-RPC 2.0 dispatch for `initialize`, `ping`, `tools/list`, and `tools/call`.
  - Exposed 7 social-impact agents plus Sphere indicators as native MCP tools with strict JSON schema inputs and dual outputs (voice-friendly summary + detailed markdown).
  - Built interactive **Alexa+ Voice Simulator** in the web app featuring Web Speech API speech-to-text, browser SpeechSynthesis spoken playback, and a live JSON-RPC 2.0 call log inspector showing request/response headers, payloads, and millisecond latencies.
  - Created automated MCP conformance testing (`runConformanceTest`) validating SSE handshakes, tools discovery, and execution.

- **AWS Builder Mini Challenge: Amazon Bedrock Converse API**
  - Shifted all model inference to server-side routes, reading credentials strictly from environment variables (`AWS_REGION`, `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`, `BEDROCK_MODEL_ID`).
  - Zero AWS keys or credentials exposed to client bundles.
  - Granular classification for `ThrottlingException`, `AccessDeniedException`, and missing credentials with human-readable guidance.
  - Added Amazon S3 evidence vault archive integration (`/api/aws/s3-archive`) simulating encrypted document storage with SHA-256 integrity checksums.
  - Added AWS Bedrock prompt optimizer endpoint (`/api/aws/optimize-prompt`).

- **Honest Offline-First PWA Architecture**
  - Integrated Service Worker (`public/sw.js`) and Web App Manifest for full PWA installability.
  - Implemented IndexedDB local storage (`src/offlineStorage.ts`) with stores for cached outputs and offline request queues.
  - Added honest offline labeling: disconnected outputs are explicitly flagged with `"On-device (offline, lower accuracy)"`, never presented as live Bedrock output.
  - Implemented 1-click **Simulate Offline Mode** toggle in the header for judges to test disconnected behavior without pulling cables.
  - Implemented auto-drain queue logic that flushes pending requests to Bedrock when connectivity is restored.

- **Quality & Empirical Evaluations**
  - Built-in empirical evaluation benchmark suite running 20 test questions per agent with objective key-point rubric matching.
  - Export evaluation reports in both Markdown and JSON formats.

- **Design, Accessibility & User Experience**
  - Added coherent **Hackathon Demo Mode** (`DEMO_MODE=true` and client toggle) that unlocks all 7 agents and provides unlimited usage for judges without paywall blockers.
  - First-run onboarding in under 30 seconds with 1-click sample scenarios per agent that auto-execute on launch.
  - Prominent verification disclaimer on every generation: *"AI-generated, verify against local protocols before acting in the field."*
  - Dual export options: Markdown (`.md`) and Printable / PDF (`window.print()`).
  - Full keyboard accessibility with focus rings (`focus-visible:ring-2 focus-visible:ring-teal-400`), `Escape` key listeners on all modals, and touch targets &ge; 44px.
  - High-contrast color palette (WCAG AAA compliant) and dedicated High-Contrast Field Mode.
  - Reduced-motion media query support (`@media (prefers-reduced-motion: reduce)`).
  - Responsive mobile layout functioning seamlessly at 360px screen widths.

---

## [1.0.0] - 2026-10-12 — Initial Prototype
- Basic React 19 + Vite scaffolding.
- Initial agent definitions for research, humanitarian response, and grant design.
- Local storage quota tracking prototype.
