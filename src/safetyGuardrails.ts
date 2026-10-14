/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { logAuditEvent, getCurrentUserRole } from './auditTrail';

export interface SafetyCheckResult {
  isBlocked: boolean;
  reason?: 'individual_diagnosis' | 'individual_dosing' | 'child_protection' | 'gbv_safeguarding' | 'military_targeting';
  title?: string;
  message?: string;
  recommendedAction?: string;
}

const CLINICAL_AGENTS = ['humanitarian', 'public_health', 'womens_health'];

export function isClinicalDecisionSupportAgent(agentId: string): boolean {
  return CLINICAL_AGENTS.includes(agentId);
}

const INDIVIDUAL_DIAGNOSIS_PATTERNS = [
  /\bdiagnose\s+(?:this|my|the|a)\s+(?:patient|child|infant|baby|woman|man|individual|case|person)\b/i,
  /\bwhat\s+(?:is|could\s+be)\s+the\s+diagnosis\s+for\b/i,
  /\bdoes\s+(?:my|this)\s+(?:child|patient|baby)\s+have\b/i,
  /\bdiagnose\s+(?:me|her|him|them)\b/i,
  /\bwhat\s+disease\s+does\s+(?:my|this)\s+(?:patient|child)\s+have\b/i
];

const INDIVIDUAL_DOSING_PATTERNS = [
  /\b(?:what|calculate|give|prescribe)\s+(?:is\s+the\s+)?(?:pediatric\s+|adult\s+)?(?:dose|dosage|mg|milligrams|ml|tablets)\s+(?:of|for)\b/i,
  /\b(?:pediatric|adult)\s+dose\s+(?:of|for)\b/i,
  /\bhow\s+(?:much|many)\s+(?:mg|ml|tablets|dose)\s+(?:of|should\s+i\s+give)\b/i,
  /\bpediatric\s+dose\s+for\s+\d+\s*(?:kg|lbs|pounds|years?|months?)\b/i,
  /\bdose\s+for\s+a\s+\d+\s*(?:kg|year|month)\s+(?:old|infant|child|patient)\b/i,
  /\bprescribe\s+(?:amoxicillin|ciprofloxacin|artesunate|paracetamol|ibuprofen|doxycycline|azithromycin|metronidazole|ceftriaxone)\b/i
];

// Safeguarding: Prohibit surveillance, targeting, or weaponized tracking of vulnerable groups
const MILITARY_TARGETING_PATTERNS = [
  /\b(?:target|strike|attack|bomb|raid|track\s+down)\s+(?:coordinates?|camp|refugees?|idp|civilians?)\b/i,
  /\b(?:surveillance|reconnaissance|doxx|locate)\s+(?:dissidents?|protesters?|activists?|refugees?)\b/i
];

export function validateHumanInTheLoopSafety(
  prompt: string,
  agentId: string,
  agentName: string,
  modelName: string
): SafetyCheckResult {
  // Check targeting / surveillance guardrail first (applies universally)
  for (const pattern of MILITARY_TARGETING_PATTERNS) {
    if (pattern.test(prompt)) {
      logAuditEvent({
        userRole: getCurrentUserRole(),
        agentId,
        agentName,
        promptSummary: prompt.slice(0, 100),
        promptCharCount: prompt.length,
        model: modelName,
        latencyMs: 10,
        networkState: 'Guardrail Intercepted',
        guardrailFired: 'Do No Harm: Surveillance & Targeting Prohibited',
        redactedItemsCount: 0,
        language: 'en',
        status: 'blocked'
      });
      return {
        isBlocked: true,
        reason: 'military_targeting',
        title: 'DO NO HARM MANDATE: TARGETING & SURVEILLANCE PROHIBITED',
        message: 'Nexus Impact AI is bound by the humanitarian "Do No Harm" charter. The platform strictly prohibits requests related to military targeting, kinetic action, surveillance of civilian populations, or tracking displaced persons.',
        recommendedAction: 'Ensure all inquiries adhere to neutral humanitarian protection, non-violence, and civilian safeguarding standards.'
      };
    }
  }

  // Clinical safety rules for healthcare / humanitarian agents
  if (isClinicalDecisionSupportAgent(agentId)) {
    for (const pattern of INDIVIDUAL_DIAGNOSIS_PATTERNS) {
      if (pattern.test(prompt)) {
        logAuditEvent({
          userRole: getCurrentUserRole(),
          agentId,
          agentName,
          promptSummary: prompt.slice(0, 100),
          promptCharCount: prompt.length,
          model: modelName,
          latencyMs: 12,
          networkState: 'Guardrail Intercepted',
          guardrailFired: 'Clinical Safety: Individual Diagnosis Blocked',
          redactedItemsCount: 0,
          language: 'en',
          status: 'blocked'
        });
        return {
          isBlocked: true,
          reason: 'individual_diagnosis',
          title: 'CLINICAL SAFETY GUARDRAIL: INDIVIDUAL DIAGNOSIS PROHIBITED',
          message: 'Nexus Impact AI is designed exclusively for population-level public health epidemiology, outbreak surveillance, and humanitarian guideline synthesis. It is strictly prohibited from providing individual clinical diagnoses for specific patients.',
          recommendedAction: 'For clinical care of individual patients, immediately refer to a licensed medical doctor or qualified clinical officer and follow national clinical triage protocols.'
        };
      }
    }

    for (const pattern of INDIVIDUAL_DOSING_PATTERNS) {
      if (pattern.test(prompt)) {
        logAuditEvent({
          userRole: getCurrentUserRole(),
          agentId,
          agentName,
          promptSummary: prompt.slice(0, 100),
          promptCharCount: prompt.length,
          model: modelName,
          latencyMs: 14,
          networkState: 'Guardrail Intercepted',
          guardrailFired: 'Clinical Safety: Individual Dosing Blocked',
          redactedItemsCount: 0,
          language: 'en',
          status: 'blocked'
        });
        return {
          isBlocked: true,
          reason: 'individual_dosing',
          title: 'CLINICAL SAFETY GUARDRAIL: PATIENT DOSING PROHIBITED',
          message: 'Nexus Impact AI does not calculate or prescribe individual patient medication dosages. Providing dosing instructions without in-person clinical examination creates acute risks of toxicity or under-treatment.',
          recommendedAction: 'Consult official national standard treatment guidelines (STGs), the WHO Essential Medicines List, or a registered clinical pharmacist for verified pediatric and adult dosing schedules.'
        };
      }
    }
  }

  return { isBlocked: false };
}
