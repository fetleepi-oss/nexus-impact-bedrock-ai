/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface AuditLogEntry {
  id: string;
  timestamp: number;
  isoTimestamp: string;
  userRole: string;
  agentId: string;
  agentName: string;
  promptSummary: string;
  promptCharCount: number;
  model: string;
  latencyMs: number;
  networkState: 'Online (Bedrock)' | 'Offline (On-Device)' | 'Guardrail Intercepted';
  guardrailFired: string;
  redactedItemsCount: number;
  language: string;
  status: 'success' | 'blocked' | 'error';
}

const AUDIT_STORE_KEY = 'nexus_audit_trail_entries_v1';
const CURRENT_USER_ROLE_KEY = 'nexus_current_user_role';

export const COMMON_USER_ROLES = [
  'Field Emergency Officer',
  'Senior Epidemiologist',
  'WASH Sector Lead',
  'Grant Proposal Specialist',
  'Clinical Reproductive Specialist',
  'Human Rights Monitor',
  'MEAL / M&E Officer',
  'Logistics & Supply Coordinator'
];

export function getCurrentUserRole(): string {
  if (typeof window === 'undefined') return COMMON_USER_ROLES[0];
  return localStorage.getItem(CURRENT_USER_ROLE_KEY) || COMMON_USER_ROLES[0];
}

export function setCurrentUserRole(role: string): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(CURRENT_USER_ROLE_KEY, role);
}

export function getAuditLogs(): AuditLogEntry[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(AUDIT_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to read audit logs:', err);
    return [];
  }
}

export function logAuditEvent(entry: Omit<AuditLogEntry, 'id' | 'timestamp' | 'isoTimestamp'>): AuditLogEntry {
  const fullEntry: AuditLogEntry = {
    ...entry,
    id: `audit_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    isoTimestamp: new Date().toISOString()
  };

  if (typeof window !== 'undefined') {
    try {
      const existing = getAuditLogs();
      const updated = [fullEntry, ...existing].slice(0, 500);
      localStorage.setItem(AUDIT_STORE_KEY, JSON.stringify(updated));
      window.dispatchEvent(new CustomEvent('nexus_audit_log_updated', { detail: fullEntry }));
    } catch (err) {
      console.warn('Failed to save audit log:', err);
    }
  }

  return fullEntry;
}

export function clearAuditLogs(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(AUDIT_STORE_KEY);
  window.dispatchEvent(new CustomEvent('nexus_audit_log_updated', { detail: null }));
}

export function exportAuditLogsJson(): void {
  const logs = getAuditLogs();
  const exportPayload = {
    exportedAt: new Date().toISOString(),
    totalEntries: logs.length,
    deviceEnvironment: typeof navigator !== 'undefined' ? navigator.userAgent : 'Unknown',
    integrityNotice: 'Nexus Impact AI Local Operational Audit Trail (tamper-evident local log of operators, models, prompts, and security guardrails)',
    entries: logs
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(exportPayload, null, 2));
  const downloadAnchor = document.createElement('a');
  downloadAnchor.setAttribute('href', dataStr);
  downloadAnchor.setAttribute('download', `nexus_audit_trail_export_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(downloadAnchor);
  downloadAnchor.click();
  downloadAnchor.remove();
}
