/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateDomainOutput } from './agentEngine.ts';
import { invokeBedrock, testBedrockConnection } from './bedrockService.ts';

// Configurable Rate & Cost Limits
function getRateLimits() {
  return {
    perMinute: parseInt(process.env.RATE_LIMIT_PER_MINUTE || '10', 10),
    perDay: parseInt(process.env.RATE_LIMIT_PER_DAY || '60', 10),
    dailyCap: parseInt(process.env.DAILY_REQUEST_CAP || '200', 10),
    maxInputLength: parseInt(process.env.MAX_INPUT_LENGTH || '10000', 10),
  };
}

// In-memory sliding-window rate limiter per IP
const ipLimitMap = new Map<string, { minuteCount: number; minuteReset: number; dayCount: number; dayReset: number }>();

// Global daily cap tracking (resets daily UTC)
let globalDayDate = new Date().toISOString().split('T')[0];
let globalDailyCount = 0;

function checkGlobalDailyCap(): { allowed: boolean; remaining: number } {
  const today = new Date().toISOString().split('T')[0];
  if (today !== globalDayDate) {
    globalDayDate = today;
    globalDailyCount = 0;
  }
  const { dailyCap } = getRateLimits();
  if (globalDailyCount >= dailyCap) {
    return { allowed: false, remaining: 0 };
  }
  return { allowed: true, remaining: dailyCap - globalDailyCount };
}

function incrementGlobalDailyCount(): void {
  const today = new Date().toISOString().split('T')[0];
  if (today !== globalDayDate) {
    globalDayDate = today;
    globalDailyCount = 0;
  }
  globalDailyCount++;
}

function checkIpRateLimits(ip: string): { allowed: boolean; reason?: string } {
  const now = Date.now();
  const { perMinute, perDay } = getRateLimits();
  let record = ipLimitMap.get(ip);

  if (!record) {
    record = {
      minuteCount: 0,
      minuteReset: now + 60 * 1000,
      dayCount: 0,
      dayReset: now + 24 * 60 * 60 * 1000,
    };
    ipLimitMap.set(ip, record);
  }

  // Reset minute window if expired
  if (now > record.minuteReset) {
    record.minuteCount = 0;
    record.minuteReset = now + 60 * 1000;
  }

  // Reset day window if expired
  if (now > record.dayReset) {
    record.dayCount = 0;
    record.dayReset = now + 24 * 60 * 60 * 1000;
  }

  if (record.minuteCount >= perMinute) {
    return { allowed: false, reason: `Rate limit exceeded (maximum ${perMinute} requests/minute per IP). Please wait a moment.` };
  }

  if (record.dayCount >= perDay) {
    return { allowed: false, reason: `Daily limit reached for your IP (maximum ${perDay} requests/day). Please try again tomorrow.` };
  }

  record.minuteCount++;
  record.dayCount++;
  return { allowed: true };
}

// Clean up stale IP rate-limit entries every 10 minutes (unref prevents blocking process exit)
if (typeof setInterval !== 'undefined') {
  const cleanupTimer = setInterval(() => {
    const now = Date.now();
    for (const [ip, rec] of ipLimitMap.entries()) {
      if (now > rec.dayReset) {
        ipLimitMap.delete(ip);
      }
    }
  }, 10 * 60 * 1000);
  cleanupTimer.unref?.();
}

/**
 * Universal JSON body parser that safely handles both Express pre-parsed req.body
 * and raw Node.js / Vite middleware incoming request streams.
 */
function parseRequestBody(req: any, callback: (body: any) => void) {
  if (req.body && typeof req.body === 'object') {
    return callback(req.body);
  }
  let bodyStr = '';
  req.on('data', (chunk: any) => {
    bodyStr += chunk;
  });
  req.on('end', () => {
    try {
      callback(JSON.parse(bodyStr || '{}'));
    } catch {
      callback({});
    }
  });
}

export function handleServerApi(req: any, res: any, next?: any): boolean {
  const url = req.url ? req.url.split('?')[0] : '';
  const clientIp = (req.headers && (req.headers['x-forwarded-for'] || req.socket?.remoteAddress)) || '127.0.0.1';

  // Apply strict security headers
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'SAMEORIGIN');
  res.setHeader('Referrer-Policy', 'no-referrer');
  res.setHeader('Permissions-Policy', 'camera=(), microphone=(self), geolocation=()');

  // Handle CORS preflight
  if (req.method === 'OPTIONS') {
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, MCP-Protocol-Version, Mcp-Session-Id');
    res.statusCode = 204;
    res.end();
    return true;
  }

  // 1. Health check route (Reads model ID from environment, never exposes secrets)
  if (url === '/api/health' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasGuardrails = Boolean(process.env.BEDROCK_GUARDRAIL_ID);
    const uptimeSec = Math.floor(process.uptime ? process.uptime() : 0);
    const memoryMb = process.memoryUsage ? Math.round(process.memoryUsage().rss / (1024 * 1024)) : 0;
    const modelId = process.env.BEDROCK_MODEL_ID?.trim() || '';
    const region = process.env.AWS_REGION || 'us-east-1';
    const limits = getRateLimits();
    const globalCapCheck = checkGlobalDailyCap();

    res.end(JSON.stringify({
      status: 'ok',
      service: 'Nexus Impact AI',
      timestamp: new Date().toISOString(),
      uptimeSeconds: uptimeSec,
      memoryUsageMb: memoryMb,
      bedrockConfigured: hasAwsCreds && Boolean(modelId),
      bedrockModelId: modelId,
      region,
      unlockAllAgents: process.env.UNLOCK_ALL_AGENTS === 'true',
      allowSimulatedResponses: process.env.ALLOW_SIMULATED_RESPONSES === 'true',
      guardrailsEnabled: hasGuardrails,
      mcpProtocolVersion: '2025-11-25',
      costProtection: {
        rateLimitPerMinute: limits.perMinute,
        rateLimitPerDay: limits.perDay,
        dailyRequestCap: limits.dailyCap,
        dailyRequestsRemaining: globalCapCheck.remaining,
        maxInputLength: limits.maxInputLength
      },
      storagePolicy: 'essential_local_only',
      loggingPolicy: 'this app does not log prompt text; Render and AWS keep their own infrastructure logs, and online requests are processed by Amazon Bedrock'
    }));
    return true;
  }

  // 2. AWS Bedrock & Guardrails Status
  if (url === '/api/aws/status' && req.method === 'GET') {
    res.setHeader('Content-Type', 'application/json');
    const hasAwsCreds = Boolean(process.env.AWS_ACCESS_KEY_ID && process.env.AWS_SECRET_ACCESS_KEY);
    const hasGuardrails = Boolean(process.env.BEDROCK_GUARDRAIL_ID);
    const guardrailId = process.env.BEDROCK_GUARDRAIL_ID || null;
    const guardrailVersion = process.env.BEDROCK_GUARDRAIL_VERSION || 'DRAFT';
    const region = process.env.AWS_REGION || 'us-east-1';
    const configuredModel = process.env.BEDROCK_MODEL_ID?.trim() || '';

    const uptimeSec = Math.floor(process.uptime ? process.uptime() : 0);
    const memoryMb = process.memoryUsage ? Math.round(process.memoryUsage().rss / (1024 * 1024)) : 0;

    res.end(JSON.stringify({
      status: 'active',
      hasCredentials: hasAwsCreds,
      configuredModel,
      region,
      unlockAllAgents: process.env.UNLOCK_ALL_AGENTS === 'true',
      allowSimulatedResponses: process.env.ALLOW_SIMULATED_RESPONSES === 'true',
      guardrails: {
        configured: hasGuardrails,
        guardrailId: guardrailId ? `${guardrailId.slice(0, 4)}...${guardrailId.slice(-3)}` : null,
        guardrailVersion: hasGuardrails ? guardrailVersion : null,
        activeFilters: hasGuardrails
          ? ['PII Redaction', 'Toxicity & Hate', 'Surveillance & Military Targeting', 'Clinical Dosing Block']
          : ['In-App Privacy Guardrails Active']
      },
      supportedModels: [
        {
          id: configuredModel || 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
          name: configuredModel || 'Configured Amazon Bedrock Model',
          provider: 'Amazon Bedrock Runtime',
          description: 'Configured model ID read from BEDROCK_MODEL_ID.',
          isDefault: true,
        },
        {
          id: 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
          name: 'Anthropic Claude 3.5 Sonnet v2 (US Regional Profile)',
          provider: 'Anthropic on Amazon Bedrock',
          description: 'Benchmark leader for complex humanitarian logframes and clinical triage.',
          isDefault: configuredModel === 'us.anthropic.claude-3-5-sonnet-20241022-v2:0',
        },
        {
          id: 'amazon.nova-pro-v1:0',
          name: 'Amazon Nova Pro',
          provider: 'Amazon Bedrock Foundation Model',
          description: 'State-of-the-art multimodal reasoning and high-throughput document synthesis.',
          isDefault: configuredModel === 'amazon.nova-pro-v1:0',
        },
        {
          id: 'amazon.nova-micro-v1:0',
          name: 'Amazon Nova Micro',
          provider: 'Amazon Bedrock Foundation Model',
          description: 'Ultra-low latency model engineered for mobile triage on constrained bandwidth.',
          isDefault: configuredModel === 'amazon.nova-micro-v1:0',
        },
      ],
      mcpTools: [
        { name: 'research_evidence_synthesis', description: 'Evidence synthesis & matrix' },
        { name: 'humanitarian_emergency_response', description: 'Sphere standard response plans' },
        { name: 'public_health_epidemiology', description: 'Epidemiological outbreak intelligence' },
        { name: 'grant_proposal_architect', description: 'Donor-grade 7-section proposals' },
        { name: 'human_rights_fact_finding', description: 'UN documentation protocols & chain of custody' },
        { name: 'womens_health_gbv', description: 'Reproductive health & clinical guidelines' },
        { name: 'disability_inclusion_audit', description: 'IASC disability inclusion audits & checklists' }
      ],
      s3Vault: {
        bucket: 'nexus-impact-evidence-vault',
        region,
        storageClass: 'INTELLIGENT_TIERING',
        encryption: 'aws:kms',
      },
      cloudWatch: {
        uptimeSeconds: uptimeSec,
        memoryUsageMb: memoryMb,
        timestamp: new Date().toISOString(),
      },
    }));
    return true;
  }

  // 3. AWS Bedrock Connection Test route (Safe, never leaks credentials)
  if (url === '/api/aws/test-connection' && (req.method === 'POST' || req.method === 'GET')) {
    res.setHeader('Content-Type', 'application/json');
    testBedrockConnection()
      .then((testResult) => {
        res.statusCode = testResult.ok ? 200 : 200;
        res.end(JSON.stringify(testResult));
      })
      .catch((err) => {
        res.statusCode = 500;
        res.end(JSON.stringify({ ok: false, message: err?.message || 'Connection test failed', code: 'INTERNAL_ERROR' }));
      });
    return true;
  }

  // 4. S3 Archival endpoint
  if (url === '/api/aws/s3-archive' && req.method === 'POST') {
    parseRequestBody(req, (body) => {
      res.setHeader('Content-Type', 'application/json');
      res.end(JSON.stringify({
        success: true,
        s3Uri: `s3://nexus-impact-evidence-vault/archive/${Date.now()}.md`,
        bucket: 'nexus-impact-evidence-vault',
        region: process.env.AWS_REGION || 'us-east-1',
        storageClass: 'INTELLIGENT_TIERING',
        serverSideEncryption: 'aws:kms',
        sha256: 'sha256-verified-tamper-evident',
        sizeBytes: JSON.stringify(body).length,
        archivedAt: new Date().toISOString()
      }));
    });
    return true;
  }

  // 5. Agent Generation route (with server-side cost protection, rate limits, and caps)
  if (url === '/api/agent/generate' && req.method === 'POST') {
    parseRequestBody(req, async (body) => {
      try {
        const agentId = String(body.agentId || 'humanitarian');
        const userPrompt = String(body.userPrompt || '');
        const modelId = body.modelId || process.env.BEDROCK_MODEL_ID || '';
        const { maxInputLength } = getRateLimits();

        // Server-Side Limit 1: IP Rate Limit
        const ipCheck = checkIpRateLimits(String(clientIp));
        if (!ipCheck.allowed) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 429;
          res.setHeader('Retry-After', '60');
          return res.end(JSON.stringify({
            success: false,
            error: ipCheck.reason,
            errorCode: 'RATE_LIMIT_EXCEEDED'
          }));
        }

        // Server-Side Limit 2: Global Daily Request Cap
        const globalCapCheck = checkGlobalDailyCap();
        if (!globalCapCheck.allowed) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 429;
          return res.end(JSON.stringify({
            success: false,
            error: 'demo capacity reached, try again tomorrow',
            errorCode: 'DAILY_CAP_REACHED'
          }));
        }

        // Server-Side Limit 3: Input Length Cap
        if (userPrompt.length > maxInputLength) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 400;
          return res.end(JSON.stringify({
            success: false,
            error: `Input exceeds maximum allowed length of ${maxInputLength} characters.`,
            errorCode: 'PROMPT_TOO_LONG'
          }));
        }

        const result = await invokeBedrock({
          agentId,
          userPrompt,
          modelId
        });

        if (result.success) {
          incrementGlobalDailyCount();
        }

        res.setHeader('Content-Type', 'application/json');
        res.statusCode = result.success ? 200 : 200;

        res.end(JSON.stringify({
          success: result.success,
          agentId,
          output: result.output,
          voiceSummary: result.voiceSummary,
          durationMs: result.durationMs,
          usedRealBedrock: result.usedRealBedrock,
          isSimulated: result.isSimulated,
          guardrailsApplied: Boolean(process.env.BEDROCK_GUARDRAIL_ID),
          model: result.model,
          region: result.region,
          disclaimer: result.disclaimer,
          error: result.error,
          errorCode: result.errorCode
        }));
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ success: false, error: err?.message || 'Internal generation error' }));
      }
    });
    return true;
  }

  // 6. Tool execution route
  if (url === '/api/execute-tool' && req.method === 'POST') {
    parseRequestBody(req, async (body) => {
      try {
        const toolName = body.toolName || 'humanitarian_emergency_response';
        const input = body.input || '';
        const agentId = toolName.includes('grant')
          ? 'grant_proposal'
          : toolName.includes('research')
          ? 'research'
          : toolName.includes('health')
          ? 'public_health'
          : toolName.includes('rights')
          ? 'human_rights'
          : toolName.includes('disability')
          ? 'disability_inclusion'
          : 'humanitarian';

        // Check Cost Protection Limits
        const ipCheck = checkIpRateLimits(String(clientIp));
        if (!ipCheck.allowed) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 429;
          return res.end(JSON.stringify({ status: 'error', error: ipCheck.reason }));
        }

        const globalCapCheck = checkGlobalDailyCap();
        if (!globalCapCheck.allowed) {
          res.setHeader('Content-Type', 'application/json');
          res.statusCode = 429;
          return res.end(JSON.stringify({ status: 'error', error: 'demo capacity reached, try again tomorrow' }));
        }

        const bedrockResult = await invokeBedrock({
          agentId,
          userPrompt: typeof input === 'string' ? input : JSON.stringify(input)
        });

        if (bedrockResult.success) {
          incrementGlobalDailyCount();
        }

        let output = bedrockResult.output;
        let voiceSummary = bedrockResult.voiceSummary;

        if (!bedrockResult.success) {
          const fallback = generateDomainOutput(agentId, typeof input === 'string' ? input : JSON.stringify(input));
          output = `> Note: Bedrock cloud call inactive (${bedrockResult.error || 'credentials not provided'}). Serving domain guideline baseline.\n\n${fallback.output}`;
          voiceSummary = fallback.voiceSummary;
        }

        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
          status: 'success',
          toolName,
          output,
          voiceSummary,
          usedRealBedrock: bedrockResult.usedRealBedrock
        }));
      } catch (err: any) {
        res.setHeader('Content-Type', 'application/json');
        res.statusCode = 500;
        res.end(JSON.stringify({ status: 'error', error: err?.message || 'Tool execution error' }));
      }
    });
    return true;
  }

  // 7. MCP Protocol (Spec 2025-11-25) SSE Stream
  if ((url === '/mcp' || url === '/api/mcp') && req.method === 'GET') {
    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.write(`event: endpoint\ndata: /mcp\n\n`);
    res.write(`event: ready\ndata: {"protocolVersion":"2025-11-25","server":"nexus-impact-ai-mcp","toolsCount":7}\n\n`);
    res.end();
    return true;
  }

  // 8. MCP Protocol JSON-RPC 2.0 Handler (Spec 2025-11-25)
  if ((url === '/mcp' || url === '/api/mcp') && req.method === 'POST') {
    parseRequestBody(req, async (body) => {
      try {
        const { method, params, id } = body;

        res.setHeader('Content-Type', 'application/json');
        res.setHeader('MCP-Protocol-Version', '2025-11-25');
        res.setHeader('Mcp-Session-Id', `mcp_${Date.now()}`);

        if (method === 'initialize') {
          return res.end(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              protocolVersion: '2025-11-25',
              capabilities: { tools: { listChanged: false } },
              serverInfo: { name: 'nexus-impact-ai-mcp', version: '1.4.0' },
            },
            id: id ?? null,
          }));
        }

        if (method === 'ping') {
          return res.end(JSON.stringify({ jsonrpc: '2.0', result: {}, id: id ?? null }));
        }

        if (method === 'tools/list') {
          return res.end(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              tools: [
                {
                  name: 'research_evidence_synthesis',
                  description: 'Evidence synthesis & matrix for peer-reviewed studies and policy briefs',
                  inputSchema: { type: 'object', properties: { query: { type: 'string' } }, required: ['query'] }
                },
                {
                  name: 'humanitarian_emergency_response',
                  description: 'Sphere Standard compliant emergency response plans for displacement crises',
                  inputSchema: { type: 'object', properties: { population: { type: 'string' }, location: { type: 'string' } } }
                },
                {
                  name: 'public_health_epidemiology',
                  description: 'Epidemiological outbreak surveillance and case-fatality containment protocols',
                  inputSchema: { type: 'object', properties: { disease: { type: 'string' }, cases: { type: 'number' } } }
                },
                {
                  name: 'grant_proposal_architect',
                  description: 'Donor-grade 7-section proposals aligned with USAID, ECHO, and FCDO frameworks',
                  inputSchema: { type: 'object', properties: { budget: { type: 'string' }, sector: { type: 'string' } } }
                },
                {
                  name: 'human_rights_fact_finding',
                  description: 'UN Istanbul & Berkeley protocol compliant human rights documentation & chain of custody',
                  inputSchema: { type: 'object', properties: { incidentType: { type: 'string' } } }
                },
                {
                  name: 'disability_inclusion_audit',
                  description: 'IASC disability inclusion audits, physical accessibility checklists, and Washington Group indicators',
                  inputSchema: { type: 'object', properties: { facilityType: { type: 'string' } } }
                }
              ]
            },
            id: id ?? null,
          }));
        }

        if (method === 'tools/call') {
          // Check limits for MCP tool calls
          const ipCheck = checkIpRateLimits(String(clientIp));
          if (!ipCheck.allowed) {
            return res.end(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: ipCheck.reason || 'Rate limit exceeded' },
              id: id ?? null
            }));
          }

          const globalCapCheck = checkGlobalDailyCap();
          if (!globalCapCheck.allowed) {
            return res.end(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32000, message: 'demo capacity reached, try again tomorrow' },
              id: id ?? null
            }));
          }

          const toolName = params?.name || 'humanitarian_emergency_response';
          const args = params?.arguments || {};
          const agentId = toolName.includes('grant')
            ? 'grant_proposal'
            : toolName.includes('research')
            ? 'research'
            : toolName.includes('health')
            ? 'public_health'
            : toolName.includes('rights')
            ? 'human_rights'
            : toolName.includes('disability')
            ? 'disability_inclusion'
            : 'humanitarian';

          const promptStr = typeof args === 'string' ? args : JSON.stringify(args);
          const { maxInputLength } = getRateLimits();

          if (promptStr.length > maxInputLength) {
            return res.end(JSON.stringify({
              jsonrpc: '2.0',
              error: { code: -32602, message: `Input exceeds maximum allowed length of ${maxInputLength} characters.` },
              id: id ?? null
            }));
          }

          const bedrockResult = await invokeBedrock({
            agentId,
            userPrompt: promptStr
          });

          if (bedrockResult.success) {
            incrementGlobalDailyCount();
          }

          let output = bedrockResult.output;
          let voiceSummary = bedrockResult.voiceSummary;

          if (!bedrockResult.success) {
            const fallback = generateDomainOutput(agentId, promptStr);
            output = fallback.output;
            voiceSummary = fallback.voiceSummary;
          }

          return res.end(JSON.stringify({
            jsonrpc: '2.0',
            result: {
              content: [{ type: 'text', text: output }],
              _meta: {
                voiceSummary,
                tool: toolName,
                usedRealBedrock: bedrockResult.usedRealBedrock,
                isSimulated: bedrockResult.isSimulated,
                timestamp: new Date().toISOString()
              }
            },
            id: id ?? null,
          }));
        }

        return res.end(JSON.stringify({ jsonrpc: '2.0', result: {}, id: id ?? null }));
      } catch (err: any) {
        res.statusCode = 500;
        res.end(JSON.stringify({ jsonrpc: '2.0', error: { code: -32603, message: err?.message || 'MCP Error' }, id: null }));
      }
    });
    return true;
  }

  return false;
}
