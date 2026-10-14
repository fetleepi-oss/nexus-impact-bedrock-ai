/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface ImpactRecord {
  id: string;
  timestamp: number;
  isoDate: string;
  taskTitle: string;
  agentId: string;
  agentName: string;
  measuredSessionSeconds: number;
  measuredGenerationLatencyMs: number;
  userEstimatedHoursSaved: number;
  userRole: string;
  operationalContext: string;
  notes: string;
}

const IMPACT_STORE_KEY = 'nexus_impact_tracker_records_v1';

export function getImpactRecords(): ImpactRecord[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(IMPACT_STORE_KEY);
    if (!raw) return [];
    return JSON.parse(raw);
  } catch (err) {
    console.error('Failed to load impact records:', err);
    return [];
  }
}

export function saveImpactRecord(record: Omit<ImpactRecord, 'id' | 'timestamp' | 'isoDate'>): ImpactRecord {
  const full: ImpactRecord = {
    ...record,
    id: `impact_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    timestamp: Date.now(),
    isoDate: new Date().toISOString()
  };
  if (typeof window !== 'undefined') {
    const existing = getImpactRecords();
    const updated = [full, ...existing];
    localStorage.setItem(IMPACT_STORE_KEY, JSON.stringify(updated));
    window.dispatchEvent(new CustomEvent('nexus_impact_records_updated', { detail: full }));
  }
  return full;
}

export function deleteImpactRecord(id: string): void {
  if (typeof window === 'undefined') return;
  const existing = getImpactRecords();
  const updated = existing.filter(r => r.id !== id);
  localStorage.setItem(IMPACT_STORE_KEY, JSON.stringify(updated));
  window.dispatchEvent(new CustomEvent('nexus_impact_records_updated', { detail: null }));
}

export function exportImpactRecordsJson(): void {
  const records = getImpactRecords();
  const payload = {
    exportedAt: new Date().toISOString(),
    statisticalDisclaimer: 'STRICT HUMANITARIAN POLICY: Nexus Impact AI does not invent or extrapolate metrics. All time savings presented represent exclusively unverified user self-estimates entered by field personnel, paired with real machine-measured in-app session times.',
    totalRecords: records.length,
    records
  };
  const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(payload, null, 2));
  const dl = document.createElement('a');
  dl.setAttribute('href', dataStr);
  dl.setAttribute('download', `nexus_impact_tracker_export_${new Date().toISOString().slice(0, 10)}.json`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
}

export function exportImpactRecordsCsv(): void {
  const records = getImpactRecords();
  const header = ['ID', 'Date', 'Task Title', 'Agent', 'Measured Session Seconds [MEASURED]', 'Measured Generation Latency ms [MEASURED]', 'User Estimated Hours Saved [USER ESTIMATE]', 'User Role', 'Operational Context', 'Notes'];
  const rows = records.map(r => [
    `"${r.id}"`,
    `"${r.isoDate}"`,
    `"${(r.taskTitle || '').replace(/"/g, '""')}"`,
    `"${r.agentName}"`,
    r.measuredSessionSeconds,
    r.measuredGenerationLatencyMs,
    r.userEstimatedHoursSaved,
    `"${r.userRole}"`,
    `"${(r.operationalContext || '').replace(/"/g, '""')}"`,
    `"${(r.notes || '').replace(/"/g, '""')}"`
  ]);
  const csvContent = [header.join(','), ...rows.map(row => row.join(','))].join('\n');
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const dl = document.createElement('a');
  dl.setAttribute('href', url);
  dl.setAttribute('download', `nexus_impact_tracker_export_${new Date().toISOString().slice(0, 10)}.csv`);
  document.body.appendChild(dl);
  dl.click();
  dl.remove();
}
