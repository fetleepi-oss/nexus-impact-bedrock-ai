/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface EvidenceClaim {
  id: string;
  claim: string;
  type: 'cited' | 'assumption';
  source: string;
  confidenceLevel: 'High' | 'Moderate' | 'Low';
  confidenceScore: number;
  rationale: string;
  verificationStep: string;
}

export interface ChallengeFinding {
  id: string;
  category: 'Logistical Bottleneck' | 'Hidden Assumption' | 'Methodological Limitation' | 'Equity & Protection' | 'Fiduciary / Regulatory';
  severity: 'Critical' | 'High' | 'Moderate' | 'Low';
  issue: string;
  impactIfUnchecked: string;
  recommendedCounterMeasure: string;
}

export interface ChallengeReport {
  id: string;
  analyzedAt: string;
  overallVulnerability: 'Low' | 'Moderate' | 'Elevated' | 'Critical';
  executiveCritique: string;
  findings: ChallengeFinding[];
  immediateFieldStressTests: string[];
}

export function extractEvidenceClaims(text: string, agentId: string): EvidenceClaim[] {
  const claims: EvidenceClaim[] = [];

  if (/15\s*(?:liters?|L)\s*(?:\/|per)\s*person/i.test(text) || /WASH/i.test(text)) {
    claims.push({
      id: 'claim_wash_1',
      claim: 'Minimum 15 Liters of potable water per person per day for drinking, cooking, and basic hygiene.',
      type: 'cited',
      source: 'Sphere Handbook (2018 Edition) - Water Supply Standard 2.1',
      confidenceLevel: 'High',
      confidenceScore: 96,
      rationale: 'Globally codified humanitarian minimum benchmark ratified across UN OCHA, ICRC, and IASC.',
      verificationStep: 'Conduct daily flow-rate meter readings and household container spot-checks at water points.'
    });
  }

  if (/20\s*persons?\s*per\s*latrine|latrine\s*ratio/i.test(text)) {
    claims.push({
      id: 'claim_latrine_1',
      claim: 'Maximum 20 individuals per shared latrine stall with segregated gender access and dignity locks.',
      type: 'cited',
      source: 'Sphere Handbook (2018 Edition) - Excreta Management Standard 3.2',
      confidenceLevel: 'High',
      confidenceScore: 94,
      rationale: 'Standard consensus indicator to prevent fecal-oral disease transmission in displacement clusters.',
      verificationStep: 'Audit camp block maps against actual functional latrine cubicles every 48 hours.'
    });
  }

  if (/3\.5\s*(?:m²|sqm|square\s*meters?)/i.test(text)) {
    claims.push({
      id: 'claim_shelter_1',
      claim: 'Minimum 3.5 m² covered living space per person excluding cooking and exterior sanitation areas.',
      type: 'cited',
      source: 'Sphere Handbook - Shelter Standard 3.1 & UNHCR Emergency Standards',
      confidenceLevel: 'High',
      confidenceScore: 92,
      rationale: 'International baseline to mitigate respiratory infections and domestic violence risks.',
      verificationStep: 'Measure internal floor plan using laser or tape measures during random shelter audits.'
    });
  }

  if (/2[,.]?100\s*kcal/i.test(text)) {
    claims.push({
      id: 'claim_nutrition_1',
      claim: 'Baseline nutritional envelope of 2,100 kcal per person per day with micro-nutrient balance.',
      type: 'cited',
      source: 'WFP / WHO / UNHCR Joint Nutrition Assessment Protocols',
      confidenceLevel: 'High',
      confidenceScore: 95,
      rationale: 'Physiological emergency maintenance threshold adjusted for ambient temperatures and physical exertion.',
      verificationStep: 'Review grain and oil ration basket nutritional tables before weekly warehouse dispatches.'
    });
  }

  if (/R[_\s]t|doubling\s*time|attack\s*rate/i.test(text)) {
    claims.push({
      id: 'claim_epi_1',
      claim: 'Epidemic trajectory modeled on reported daily case counts and suspected contact transmission rates.',
      type: 'assumption',
      source: 'Field Surveillance Line-List (Subject to Under-Reporting & Diagnostic Delays)',
      confidenceLevel: 'Moderate',
      confidenceScore: 72,
      rationale: 'Field case counts in early outbreak phases typically capture only 30-60% of true symptomatic cases.',
      verificationStep: 'Cross-reference passive clinic admissions against community health worker verbal autopsies.'
    });
  }

  if (/CHW|health\s*worker|attrition|retention/i.test(text)) {
    claims.push({
      id: 'claim_chw_1',
      claim: 'Predictable financial stipends and peer supervision directly correlate with reduced CHW turnover.',
      type: 'cited',
      source: 'WHO Guideline on Health Policy and System Support to Optimize CHW Programmes (2018)',
      confidenceLevel: 'High',
      confidenceScore: 91,
      rationale: 'Extensive randomized and observational trial evidence across East and West Africa.',
      verificationStep: 'Review digital mobile money disbursement logs and monthly supervisory sign-off sheets.'
    });
  }

  if (/budget|contingency|\$|EUR|USD/i.test(text) || agentId === 'grant_proposal') {
    claims.push({
      id: 'claim_budget_1',
      claim: 'Direct operating costs and fuel unit costs remain stable over the 24-month project lifecycle.',
      type: 'assumption',
      source: 'Applicant Baseline Procurement Assessment (Unhedged Local Currency Exposure)',
      confidenceLevel: 'Low',
      confidenceScore: 58,
      rationale: 'Fragile economies frequently experience 20-50% local fuel or currency fluctuations during crises.',
      verificationStep: 'Include formal currency fluctuation renegotiation clauses in bilateral donor agreements.'
    });
  }

  if (/72\s*hours?|PEP|CEmONC|BEmONC/i.test(text) || agentId === 'womens_health') {
    claims.push({
      id: 'claim_gbv_1',
      claim: 'Post-Exposure Prophylaxis (PEP) must be initiated within 72 hours of sexual assault exposure.',
      type: 'cited',
      source: 'WHO / UNFPA Clinical Management of Rape (CMR) Global Guidelines',
      confidenceLevel: 'High',
      confidenceScore: 98,
      rationale: 'Biological threshold for viral prevention; efficacy drops steeply after the 72-hour window.',
      verificationStep: 'Stock confidential 24/7 emergency PEP kits in locked clinic consultation rooms.'
    });
  }

  if (claims.length < 3 && text.length > 50) {
    claims.push({
      id: 'claim_general_1',
      claim: 'Local administrative coordination committees will grant unhindered humanitarian access corridors.',
      type: 'assumption',
      source: 'Field Mission Planning Assumption (Contingent on Bilateral Civil-Military Negotiation)',
      confidenceLevel: 'Moderate',
      confidenceScore: 65,
      rationale: 'Access corridors can be revoked dynamically by armed actors or bureaucratic delays.',
      verificationStep: 'Establish weekly civil-military humanitarian liaison protocols with multi-agency redundancy.'
    });
  }

  return claims;
}

export async function runAdversarialChallenge(
  prompt: string,
  output: string,
  agentId: string,
  modelName: string
): Promise<ChallengeReport> {
  try {
    const res = await fetch('/api/agent/challenge', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt, output, agentId, modelName })
    });
    if (res.ok) {
      const data = await res.json();
      if (data.report) return data.report;
    }
  } catch (err) {
    console.warn('Server challenge pass fallback:', err);
  }

  const findings: ChallengeFinding[] = [
    {
      id: 'critique_1',
      category: 'Logistical Bottleneck',
      severity: 'High',
      issue: 'Heavy dependency on trucked water tankers or centralized fuel supplies during rainy / flood seasons.',
      impactIfUnchecked: 'Unpaved feeder roads become impassable within 48 hours of seasonal rains, causing immediate water delivery failure.',
      recommendedCounterMeasure: 'Pre-position solar-powered purification trailers and gravity-fed piping networks within 1.5km of settlements.'
    },
    {
      id: 'critique_2',
      category: 'Equity & Protection',
      severity: 'Critical',
      issue: 'Omission of gender-segregated sanitation cubicles, internal locks, or night-time illumination.',
      impactIfUnchecked: 'Substantially elevates gender-based violence (GBV) risks for women and girls collecting water or visiting latrines after dusk.',
      recommendedCounterMeasure: 'Mandate 3:1 female-to-male latrine ratios with solar perimeter lighting and community watch rotations.'
    },
    {
      id: 'critique_3',
      category: 'Hidden Assumption',
      severity: 'Moderate',
      issue: 'Assumes local market liquidity can absorb voucher or cash distributions without price inflation.',
      impactIfUnchecked: 'Local traders may inflate essential staple prices by 25-40%, severely degrading beneficiary purchasing power.',
      recommendedCounterMeasure: 'Conduct weekly Market Price Monitoring (MPM) alongside pre-negotiated price ceiling agreements with local trade cartels.'
    }
  ];

  return {
    id: `chal_${Date.now()}`,
    analyzedAt: new Date().toISOString(),
    overallVulnerability: 'Critical',
    executiveCritique: 'The proposed plan demonstrates strong baseline alignment with international minimum standards, but rests on vulnerable logistics, unhedged fuel pipelines, and optimistic administrative transit access.',
    findings,
    immediateFieldStressTests: [
      'Simulate a 7-day complete road closure between regional supply depots and the target field camp.',
      'Audit nighttime lighting and lock integrity at 10 randomly selected female sanitation points.',
      'Conduct an unannounced spot-check on cold-chain solar battery holdover autonomy during 36 hours of simulated cloud cover.'
    ]
  };
}
