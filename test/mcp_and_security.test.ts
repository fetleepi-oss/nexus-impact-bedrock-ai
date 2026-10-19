/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import assert from 'node:assert';
import { handleServerApi } from '../src/serverApiHandler.ts';
import { redactPersonalData } from '../src/privacyRedaction.ts';
import { encryptWithPassphrase, decryptWithPassphrase } from '../src/cryptoVault.ts';
import { validateHumanInTheLoopSafety } from '../src/safetyGuardrails.ts';

// Mock HTTP Request/Response objects for testing server handler
function createMockHttp(method: string, url: string, bodyJson?: any) {
  const req: any = {
    method,
    url,
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '127.0.0.1',
    },
    on(event: string, callback: any) {
      if (event === 'data' && bodyJson) {
        callback(Buffer.from(JSON.stringify(bodyJson)));
      }
      if (event === 'end') {
        callback();
      }
    },
  };

  const headers: Record<string, string> = {};
  let responseData = '';
  let statusCode = 200;
  let ended = false;
  let endResolver: (() => void) | null = null;

  const res: any = {
    statusCode,
    setHeader(key: string, val: string) {
      headers[key.toLowerCase()] = val;
    },
    write(chunk: string) {
      responseData += chunk;
    },
    end(finalData?: string) {
      if (finalData) responseData += finalData;
      ended = true;
      if (endResolver) {
        endResolver();
        endResolver = null;
      }
    },
    waitForEnd(timeoutMs = 3000) {
      if (ended) return Promise.resolve();
      return new Promise<void>((resolve) => {
        const timer = setTimeout(() => resolve(), timeoutMs);
        endResolver = () => {
          clearTimeout(timer);
          resolve();
        };
      });
    },
    getHeaders() {
      return headers;
    },
    getBody() {
      try {
        return JSON.parse(responseData);
      } catch {
        return responseData;
      }
    },
    getRawBody() {
      return responseData;
    },
  };

  return { req, res };
}

async function runTests() {
  console.log('\n=======================================================');
  console.log('  NEXUS IMPACT AI - COMPREHENSIVE TEST SUITE');
  console.log('  Testing: MCP Handler, Redaction, Encryption, Safety');
  console.log('=======================================================\n');

  let passed = 0;
  let failed = 0;

  function runCase(name: string, fn: () => void | Promise<void>) {
    return Promise.resolve()
      .then(fn)
      .then(() => {
        console.log(`  [PASS] ${name}`);
        passed++;
      })
      .catch((err) => {
        console.error(`  [FAIL] ${name}:`, err.message);
        failed++;
      });
  }

  // -------------------------------------------------------------------------
  // 1. PRIVACY REDACTION TESTS
  // -------------------------------------------------------------------------
  console.log('--- 1. Privacy By Design (Client-Side Redaction) ---');

  await runCase('Redacts email addresses accurately', () => {
    const input = 'Report from field officer jane.doe@refugee-aid.org concerning food stock.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, true);
    assert.ok(!result.sanitizedText.includes('jane.doe@refugee-aid.org'));
    assert.ok(result.sanitizedText.includes('[REDACTED_EMAIL]'));
    assert.strictEqual(result.redactions[0].type, 'email');
  });

  await runCase('Redacts international phone numbers', () => {
    const input = 'Emergency hotline contact is +254 712 345 678 or +252 615 123 456.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, true);
    assert.ok(!result.sanitizedText.includes('+254 712 345 678'));
    assert.ok(!result.sanitizedText.includes('+252 615 123 456'));
    assert.ok(result.sanitizedText.includes('[REDACTED_PHONE]'));
  });

  await runCase('Redacts precise GPS coordinates', () => {
    const input = 'Water point location at 4.1754, 45.3211 in flood sector 3.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, true);
    assert.ok(!result.sanitizedText.includes('4.1754, 45.3211'));
    assert.ok(result.sanitizedText.includes('[REDACTED_GPS_COORDINATES]'));
  });

  await runCase('Redacts UNHCR / National IDs and refugee numbers', () => {
    const input = 'Beneficiary holds card UNHCR-9876543 and National ID: A12345678.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, true);
    assert.ok(!result.sanitizedText.includes('UNHCR-9876543'));
    assert.ok(result.sanitizedText.includes('[REDACTED_IDENTIFIER]'));
  });

  await runCase('Redacts explicit clinical and protection name labels', () => {
    const input = 'Patient: John Doe presented with severe dehydration; Informant: Mary Okonjo.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, true);
    assert.ok(!result.sanitizedText.includes('John Doe'));
    assert.ok(!result.sanitizedText.includes('Mary Okonjo'));
    assert.ok(result.sanitizedText.includes('[REDACTED_PATIENT_NAME]'));
    assert.ok(result.sanitizedText.includes('[REDACTED_INFORMANT_NAME]'));
  });

  await runCase('Leaves non-PII humanitarian content completely intact', () => {
    const input = 'Sphere minimum requires 15 liters of potable water per person per day.';
    const result = redactPersonalData(input);
    assert.strictEqual(result.wasRedacted, false);
    assert.strictEqual(result.sanitizedText, input);
    assert.strictEqual(result.redactions.length, 0);
  });

  // -------------------------------------------------------------------------
  // 2. ENCRYPTION (WEB CRYPTO AES-GCM 256) TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- 2. On-Device Encryption Vault (Web Crypto AES-GCM 256) ---');

  await runCase('Encrypts and decrypts payload with user passphrase round-trip', async () => {
    const secretText = 'Confidential field notes: Rapid protection assessment in Sector 4.';
    const passphrase = 'SuperSafePassphrase2026!';

    const encrypted = await encryptWithPassphrase(secretText, passphrase);
    assert.strictEqual(encrypted.algorithm, 'AES-GCM-256');
    assert.ok(encrypted.ciphertext.length > 0);
    assert.ok(encrypted.salt.length > 0);
    assert.ok(encrypted.iv.length > 0);
    assert.notStrictEqual(encrypted.ciphertext, secretText);

    const decrypted = await decryptWithPassphrase(encrypted, passphrase);
    assert.strictEqual(decrypted, secretText);
  });

  await runCase('Fails gracefully with invalid passphrase', async () => {
    const secretText = 'Secret donor budget narrative.';
    const encrypted = await encryptWithPassphrase(secretText, 'CorrectPassphrase1');

    let threw = false;
    try {
      await decryptWithPassphrase(encrypted, 'WrongPassphrase2');
    } catch {
      threw = true;
    }
    assert.strictEqual(threw, true, 'Decryption with wrong passphrase must fail');
  });

  // -------------------------------------------------------------------------
  // 3. MCP SERVER (SPEC 2025-11-25) PROTOCOL TESTS
  // -------------------------------------------------------------------------
  console.log('\n--- 3. MCP Server (Spec 2025-11-25) Protocol ---');

  await runCase('MCP GET /mcp provides SSE endpoint with correct protocol version', () => {
    const { req, res } = createMockHttp('GET', '/mcp');
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);
    assert.strictEqual(res.getHeaders()['content-type'], 'text/event-stream');
    assert.ok(res.getRawBody().includes('event: ready'));
    assert.ok(res.getRawBody().includes('"protocolVersion":"2025-11-25"'));
  });

  await runCase('MCP POST initialize returns protocolVersion 2025-11-25 and serverInfo', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 1,
      method: 'initialize',
      params: { protocolVersion: '2025-11-25', capabilities: {} },
    });
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);

    const body = res.getBody();
    assert.strictEqual(body.jsonrpc, '2.0');
    assert.strictEqual(body.id, 1);
    assert.strictEqual(body.result.protocolVersion, '2025-11-25');
    assert.strictEqual(body.result.serverInfo.name, 'nexus-impact-ai-mcp');
    assert.strictEqual(res.getHeaders()['mcp-protocol-version'], '2025-11-25');
  });

  await runCase('MCP POST ping responds with empty result object', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 2,
      method: 'ping',
    });
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);

    const body = res.getBody();
    assert.strictEqual(body.jsonrpc, '2.0');
    assert.strictEqual(body.id, 2);
    assert.deepStrictEqual(body.result, {});
  });

  await runCase('MCP POST tools/list enumerates registered humanitarian tools', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 3,
      method: 'tools/list',
    });
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);

    const body = res.getBody();
    assert.strictEqual(body.jsonrpc, '2.0');
    assert.ok(Array.isArray(body.result.tools));
    assert.ok(body.result.tools.length >= 6);

    const toolNames = body.result.tools.map((t: any) => t.name);
    assert.ok(toolNames.includes('humanitarian_emergency_response'));
    assert.ok(toolNames.includes('research_evidence_synthesis'));
    assert.ok(toolNames.includes('public_health_epidemiology'));
    assert.ok(toolNames.includes('grant_proposal_architect'));
  });

  await runCase('MCP POST tools/call executes tool and returns structured content & meta', async () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/call',
      params: {
        name: 'humanitarian_emergency_response',
        arguments: {
          population: '15000',
          location: 'Dadaab camp',
        },
      },
    });
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);
    await res.waitForEnd();

    const body = res.getBody();
    assert.strictEqual(body.jsonrpc, '2.0');
    assert.strictEqual(body.id, 4);
    assert.ok(body.result.content && body.result.content.length > 0);
    assert.strictEqual(body.result.content[0].type, 'text');
    assert.ok(body.result.content[0].text.length > 100);
    assert.ok(body.result._meta.voiceSummary.length > 0);
    assert.strictEqual(body.result._meta.tool, 'humanitarian_emergency_response');
  });

  await runCase('MCP accepts requests with no Origin header (external MCP clients)', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 10,
      method: 'ping'
    });
    delete req.headers['origin'];
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);
    assert.strictEqual(res.statusCode, 200);
    const body = res.getBody();
    assert.strictEqual(body.jsonrpc, '2.0');
    assert.deepStrictEqual(body.result, {});
  });

  await runCase('MCP accepts requests with localhost Origin', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 11,
      method: 'ping'
    });
    req.headers['origin'] = 'http://localhost:3000';
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);
    assert.strictEqual(res.statusCode, 200);
    assert.strictEqual(res.getHeaders()['access-control-allow-origin'], 'http://localhost:3000');
  });

  await runCase('MCP rejects unknown browser origins with 403 Forbidden', () => {
    const { req, res } = createMockHttp('POST', '/mcp', {
      jsonrpc: '2.0',
      id: 12,
      method: 'ping'
    });
    req.headers['origin'] = 'https://malicious-external-site.com';
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);
    assert.strictEqual(res.statusCode, 403);
    const body = res.getBody();
    assert.strictEqual(body.error.code, -32003);
  });

  // -------------------------------------------------------------------------
  // 4. API HEALTH & SECURITY HEADERS
  // -------------------------------------------------------------------------
  console.log('\n--- 4. API Health & Security Headers ---');

  await runCase('GET /api/health returns 200 with zero prompt logging policy', () => {
    const { req, res } = createMockHttp('GET', '/api/health');
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);

    const body = res.getBody();
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'Nexus Impact AI');
    assert.ok(
      body.loggingPolicy.includes('does not log prompt text') ||
      body.loggingPolicy === 'zero_prompt_logging_privacy_enforced'
    );
    assert.strictEqual(res.getHeaders()['x-content-type-options'], 'nosniff');
    assert.strictEqual(res.getHeaders()['referrer-policy'], 'no-referrer');
  });

  // -------------------------------------------------------------------------
  // 5. HUMANITARIAN DO NO HARM & CLINICAL SAFEGUARDING
  // -------------------------------------------------------------------------
  console.log('\n--- 5. Do No Harm & Clinical Safety Guardrails ---');

  await runCase('Blocks military targeting or surveillance requests immediately', () => {
    const prompt = 'Please provide target coordinates to attack camp refugees fleeing across the valley.';
    const check = validateHumanInTheLoopSafety(prompt, 'humanitarian', 'Humanitarian', 'Amazon Bedrock');
    assert.strictEqual(check.isBlocked, true);
    assert.strictEqual(check.reason, 'military_targeting');
    assert.ok(check.title?.includes('TARGETING & SURVEILLANCE PROHIBITED'));
  });

  await runCase('Blocks individual clinical patient drug dosing requests', () => {
    const prompt = 'What is the pediatric dose of amoxicillin for a 12 kg child with fever?';
    const check = validateHumanInTheLoopSafety(prompt, 'public_health', 'Public Health', 'Amazon Bedrock');
    assert.strictEqual(check.isBlocked, true);
    assert.strictEqual(check.reason, 'individual_dosing');
    assert.ok(check.title?.includes('PATIENT DOSING PROHIBITED'));
  });

  await runCase('Blocks individual clinical diagnosis inquiries', () => {
    const prompt = 'Please diagnose my patient who has acute abdominal cramps and yellow skin.';
    const check = validateHumanInTheLoopSafety(prompt, 'humanitarian', 'Humanitarian', 'Amazon Bedrock');
    assert.strictEqual(check.isBlocked, true);
    assert.strictEqual(check.reason, 'individual_diagnosis');
    assert.ok(check.title?.includes('INDIVIDUAL DIAGNOSIS PROHIBITED'));
  });

  await runCase('Allows legitimate population-level humanitarian requests', () => {
    const prompt = 'Calculate Sphere standard water and latrine allocations for 18,000 displaced persons.';
    const check = validateHumanInTheLoopSafety(prompt, 'humanitarian', 'Humanitarian', 'Amazon Bedrock');
    assert.strictEqual(check.isBlocked, false);
  });

  // -------------------------------------------------------------------------
  // 6. AMAZON BEDROCK ROUTING & CREDENTIAL ISOLATION
  // -------------------------------------------------------------------------
  console.log('\n--- 6. Amazon Bedrock & Cloud Security Boundaries ---');

  await runCase('GET /api/aws/status returns model list and never leaks secret credentials', () => {
    const { req, res } = createMockHttp('GET', '/api/aws/status');
    const handled = handleServerApi(req, res);
    assert.strictEqual(handled, true);

    const body = res.getBody();
    assert.strictEqual(body.status, 'active');
    assert.ok(Array.isArray(body.supportedModels));
    assert.ok(body.supportedModels.length >= 4);

    // Verify absolutely no AWS secrets exist in response
    const raw = res.getRawBody();
    assert.strictEqual(raw.includes('AWS_SECRET_ACCESS_KEY'), false);
    assert.strictEqual(raw.includes('secretAccessKey'), false);
  });

  await runCase('POST /api/aws/test-connection handles unconfigured credentials gracefully without crash', async () => {
    const { req, res } = createMockHttp('POST', '/api/aws/test-connection');
    handleServerApi(req, res);
    await res.waitForEnd();

    const body = res.getBody();
    assert.ok(typeof body.ok === 'boolean');
    assert.ok(typeof body.message === 'string');
    // Ensure message contains zero AWS keys
    assert.strictEqual(JSON.stringify(body).includes('AKIA'), false);
  });

  await runCase('POST /api/agent/generate rejects oversized inputs (> 50,000 chars) with 400', async () => {
    const hugePrompt = 'A'.repeat(50005);
    const { req, res } = createMockHttp('POST', '/api/agent/generate', {
      agentId: 'humanitarian',
      userPrompt: hugePrompt
    });
    handleServerApi(req, res);
    await res.waitForEnd();

    const body = res.getBody();
    assert.strictEqual(body.success, false);
    assert.strictEqual(body.errorCode, 'PROMPT_TOO_LONG');
  });

  await runCase('POST /api/agent/generate provides actionable setup guidance when Bedrock credentials are unset', async () => {
    const { req, res } = createMockHttp('POST', '/api/agent/generate', {
      agentId: 'humanitarian',
      userPrompt: 'Assess shelter needs for 2,000 displaced individuals'
    });
    handleServerApi(req, res);
    await res.waitForEnd();

    const body = res.getBody();
    // Either live call succeeded, simulation was enabled, or actionable setup message was returned
    if (!body.success) {
      assert.ok(
        body.errorCode === 'MISSING_AWS_CREDENTIALS' ||
        body.errorCode === 'MISSING_BEDROCK_MODEL_ID' ||
        body.errorCode === 'INVALID_CREDENTIALS'
      );
      assert.ok(
        body.error.includes('Amazon Bedrock') ||
        body.error.includes('BEDROCK_MODEL_ID') ||
        body.error.includes('AWS credentials')
      );
    } else {
      assert.ok(body.output.length > 0);
    }
    // Verify no secret credential value is leaked
    assert.strictEqual(body.AWS_SECRET_ACCESS_KEY, undefined);
    assert.strictEqual(body.secretAccessKey, undefined);
    assert.strictEqual(/AKIA[0-9A-Z]{16}/.test(JSON.stringify(body)), false);
  });

  // -------------------------------------------------------------------------
  // Summary
  // -------------------------------------------------------------------------
  console.log('\n=======================================================');
  console.log(`  TEST RESULTS: ${passed} Passed, ${failed} Failed`);
  console.log('=======================================================\n');

  if (failed > 0) {
    process.exit(1);
  }
  process.exit(0);
}

runTests().catch((err) => {
  console.error('Fatal test error:', err);
  process.exit(1);
});
