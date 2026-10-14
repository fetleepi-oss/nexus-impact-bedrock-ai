/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { generateOnDeviceResponse } from './onDeviceModel';

export interface TestCase {
  id: string;
  agentId: string;
  agentName: string;
  category: string;
  prompt: string;
  expectedKeyPoints: {
    id: string;
    description: string;
    regexPattern: string;
  }[];
}

export interface TestResult {
  testId: string;
  agentId: string;
  prompt: string;
  status: 'passed' | 'partial' | 'failed';
  matchedPoints: string[];
  missedPoints: string[];
  scorePercent: number;
  measuredLatencyMs: number;
  modelUsed: string;
  timestamp: number;
  outputSnippet: string;
}

export const BENCHMARK_TESTS_BY_AGENT: Record<string, TestCase[]> = {
  research: [
    {
      id: 'res_01',
      agentId: 'research',
      agentName: 'Research Evidence Synthesis',
      category: 'Workforce Retention',
      prompt: 'Synthesize empirical evidence on community health worker retention strategies in post-conflict fragile zones.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Evaluates predictable financial remuneration or stipends', regexPattern: 'stipend|remuneration|incentive|financ' },
        { id: 'p2', description: 'Includes 5-column evidence matrix table', regexPattern: 'Study.*Design.*Population.*Finding.*Quality|\\|.*\\|.*\\|.*\\|' },
        { id: 'p3', description: 'Critiques Hawthorne effect or self-reporting biases', regexPattern: 'bias|hawthorne|self-report|validity' },
        { id: 'p4', description: 'Provides actionable policy recommendations', regexPattern: 'policy|recommendation' }
      ]
    },
    {
      id: 'res_02',
      agentId: 'research',
      agentName: 'Research Evidence Synthesis',
      category: 'Water Infrastructure',
      prompt: 'Synthesize comparative operational trials of solar-powered boreholes versus hand pumps in arid pastoralist communities.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Analyzes lifecycle operational costs and breakdown rates', regexPattern: 'lifecycle|breakdown|maintenance|uptime' },
        { id: 'p2', description: 'Compares solar photovoltaic yield against mechanical hand pump fatigue', regexPattern: 'solar|photovoltaic|hand pump' },
        { id: 'p3', description: 'Methodological critique of sample size and seasonal variability', regexPattern: 'methodolog|sample|season|limitation' }
      ]
    },
    {
      id: 'res_03',
      agentId: 'research',
      agentName: 'Research Evidence Synthesis',
      category: 'Cash vs In-Kind',
      prompt: 'Compare mobile unconditional cash transfer efficacy against physical in-kind food rations in acute displacement.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Compares dietary diversity and market multiplier effects', regexPattern: 'dietary|market|multiplier|diversity' },
        { id: 'p2', description: 'Evaluates security and diversion risks of physical trucking', regexPattern: 'diversion|security|logistics|truck' }
      ]
    },
    {
      id: 'res_04',
      agentId: 'research',
      agentName: 'Research Evidence Synthesis',
      category: 'Child Nutrition',
      prompt: 'Synthesize evidence on simplified combined protocols for severe and moderate acute malnutrition (SAM/MAM).',
      expectedKeyPoints: [
        { id: 'p1', description: 'References MUAC (Mid-Upper Arm Circumference) triage thresholds', regexPattern: 'MUAC|115\\s*mm|arm circumference' },
        { id: 'p2', description: 'Compares RUTF dosage optimization vs standard separate programming', regexPattern: 'RUTF|dosage|therapeutic' }
      ]
    }
  ],
  humanitarian: [
    {
      id: 'hum_01',
      agentId: 'humanitarian',
      agentName: 'Humanitarian Emergency Response',
      category: 'Rapid Flood Response',
      prompt: 'Flash flood crisis in Lower Shabelle, Somalia affecting 18,000 pastoralists. Available assets: 2 water tankers, $65k cash, district clinic.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Sphere WASH: minimum 15 liters potable water per person/day', regexPattern: '15\\s*(?:L|liters)' },
        { id: 'p2', description: 'Sphere Latrines: max 20 persons per latrine stall with gender segregation', regexPattern: '20\\s*person|latrine' },
        { id: 'p3', description: 'Sphere Shelter: 3.5m² covered space per person', regexPattern: '3\\.5\\s*(?:m²|sqm)' },
        { id: 'p4', description: 'Structured 72-Hour staged checklist (0-24h, 25-48h, 49-72h)', regexPattern: '72-Hour|Hour 0 24|0-24' }
      ]
    },
    {
      id: 'hum_02',
      agentId: 'humanitarian',
      agentName: 'Humanitarian Emergency Response',
      category: 'Conflict Displacement',
      prompt: 'Rapid border crossing displacement of 35,000 refugees arriving in arid borderlands with zero shelter assets.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Calculates total daily potable water requirement (525,000L/day)', regexPattern: '525[,.]000|15\\s*L' },
        { id: 'p2', description: 'Emergency communal transit shelter staging', regexPattern: 'transit|shelter|thermal' }
      ]
    },
    {
      id: 'hum_03',
      agentId: 'humanitarian',
      agentName: 'Humanitarian Emergency Response',
      category: 'Severe Drought',
      prompt: 'Multi-season drought response for 12,000 individuals with complete failure of 4 deep boreholes.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Water trucking emergency dispatch schedule and turnaround metrics', regexPattern: 'trucking|tanker|distribution' },
        { id: 'p2', description: 'Emergency borehole generator and submersible pump repair package', regexPattern: 'pump|repair|spare' }
      ]
    }
  ],
  public_health: [
    {
      id: 'pub_01',
      agentId: 'public_health',
      agentName: 'Public Health & Epidemiology',
      category: 'Outbreak Analysis',
      prompt: 'Mode: Outbreak Analysis. Cholera outbreak data: Day 1: 12 cases, Day 2: 28 cases, Day 3: 65 cases, Day 4: 142 cases across 3 informal settlement sectors.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Calculates growth rate and reproduction number R_t estimation', regexPattern: 'R[_\s]?t|growth rate|doubling time' },
        { id: 'p2', description: 'Identifies common point-source vs propagated waterborne transmission', regexPattern: 'waterborne|transmission|point-source|propagated' },
        { id: 'p3', description: 'Proposes immediate oral rehydration and contact ring-fencing', regexPattern: 'rehydration|containment|ring' }
      ]
    },
    {
      id: 'pub_02',
      agentId: 'public_health',
      agentName: 'Public Health & Epidemiology',
      category: 'Surveillance Profile',
      prompt: 'Mode: Surveillance Profile. Target: Measles early warning in remote zero-dose pastoralist communities.',
      expectedKeyPoints: [
        { id: 'p1', description: 'Standard case definitions (Suspected, Probable, Confirmed with IgM serology)', regexPattern: 'case definition|suspected|confirmed|IgM' },
        { id: 'p2', description: 'Tiered reporting flow (Community health workers -> Facility -> District DHIS2)', regexPattern: 'CHW|facility|district|DHIS2' }
      ]
    }
  ],
  grant_proposal: [
    {
      id: 'grt_01',
      agentId: 'grant_proposal',
      agentName: 'Grant Proposal Architect',
      category: 'USAID BHA Multi-Year Resilience',
      prompt: 'Target Funder: USAID Bureau for Humanitarian Assistance (BHA)\nCall Text: Multi-Year Emergency Resilience, Water Access & Vulnerability Reduction\nOrganization: Nexus Action International\nBudget Range: $1,450,000 USD (24 Months)',
      expectedKeyPoints: [
        { id: 'p1', description: 'Problem statement with contextual crisis demographics and needs baseline', regexPattern: 'Problem Statement|Demographic|Vulnerability' },
        { id: 'p2', description: 'Three Specific Objectives formulated under SMART criteria', regexPattern: 'Specific Objective|SMART' },
        { id: 'p3', description: 'Complete 6-column logframe matrix table', regexPattern: 'Hierarchy.*Objective.*Indicator.*Baseline.*Target.*Verification|\\|.*\\|.*\\|.*\\|' },
        { id: 'p4', description: 'Budget narrative broken into standard donor categories', regexPattern: 'Personnel|Equipment|Logistics|Direct Operating' },
        { id: 'p5', description: 'Comprehensive 5-column risk matrix', regexPattern: 'Risk.*Category.*Severity.*Mitigation|\\|.*\\|.*\\|' }
      ]
    }
  ]
};

export async function runSingleBenchmarkTest(
  testCase: TestCase,
  activeModelId: string,
  isOnline: boolean
): Promise<TestResult> {
  const startTime = Date.now();
  let output = '';
  let modelLabel = activeModelId;

  try {
    if (isOnline) {
      const res = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: testCase.agentId,
          userPrompt: testCase.prompt,
          modelId: activeModelId
        })
      });
      const data = await res.json();
      output = data.output || '';
      modelLabel = `Cloud Bedrock: ${activeModelId.split('.').pop() || activeModelId}`;
    } else {
      const onDeviceResult = await generateOnDeviceResponse(testCase.prompt, testCase.agentId);
      output = onDeviceResult.output;
      modelLabel = onDeviceResult.modelLabel;
    }
  } catch (err: any) {
    console.warn(`Evaluation error on test ${testCase.id}:`, err);
    output = `Error executing benchmark prompt: ${err?.message || 'Unknown network error'}`;
  }

  const durationMs = Date.now() - startTime;
  const matchedPoints: string[] = [];
  const missedPoints: string[] = [];

  for (const kp of testCase.expectedKeyPoints) {
    const regex = new RegExp(kp.regexPattern, 'i');
    if (regex.test(output)) {
      matchedPoints.push(kp.description);
    } else {
      missedPoints.push(kp.description);
    }
  }

  const totalPoints = testCase.expectedKeyPoints.length;
  const matchCount = matchedPoints.length;
  const scorePercent = totalPoints > 0 ? Math.round((matchCount / totalPoints) * 100) : 0;

  let status: 'passed' | 'partial' | 'failed' = 'failed';
  if (scorePercent >= 80) {
    status = 'passed';
  } else if (scorePercent >= 50) {
    status = 'partial';
  }

  return {
    testId: testCase.id,
    agentId: testCase.agentId,
    prompt: testCase.prompt,
    status,
    matchedPoints,
    missedPoints,
    scorePercent,
    measuredLatencyMs: durationMs,
    modelUsed: modelLabel,
    timestamp: Date.now(),
    outputSnippet: output.slice(0, 160)
  };
}
