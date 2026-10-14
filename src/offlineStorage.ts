/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { getAutoClearSetting } from './privacyRedaction';

export type ModelExecutionTier = 'cloud' | 'on_device';

export interface CachedAgentOutput {
  id: string;
  agentId: string;
  agentName: string;
  title: string;
  prompt: string;
  output: string;
  timestamp: number;
  model: string;
  modelCategory: ModelExecutionTier;
  isOfflineCached: boolean;
  queuedRequestId?: string;
  tags?: string[];
  citationsCount?: number;
}

export interface QueuedOfflineRequest {
  id: string;
  agentId: string;
  agentName: string;
  userPrompt: string;
  context?: string;
  modelId?: string;
  createdAt: number;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  errorMessage?: string;
  onDeviceOutputSnippet?: string;
  onDeviceOutputId?: string;
}

const DB_NAME = 'nexus_impact_offline_v2';
const DB_VERSION = 2;
const STORE_CACHED_OUTPUTS = 'cached_outputs';
const STORE_QUEUED_REQUESTS = 'queued_requests';
const SIMULATED_OFFLINE_KEY = 'nexus_simulated_offline';

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (typeof window === 'undefined' || !window.indexedDB) {
      return reject(new Error('IndexedDB is not supported in this environment'));
    }
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = (event: IDBVersionChangeEvent) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_CACHED_OUTPUTS)) {
        const cachedStore = db.createObjectStore(STORE_CACHED_OUTPUTS, { keyPath: 'id' });
        cachedStore.createIndex('agentId', 'agentId', { unique: false });
        cachedStore.createIndex('timestamp', 'timestamp', { unique: false });
        cachedStore.createIndex('modelCategory', 'modelCategory', { unique: false });
      }
      if (!db.objectStoreNames.contains(STORE_QUEUED_REQUESTS)) {
        const queueStore = db.createObjectStore(STORE_QUEUED_REQUESTS, { keyPath: 'id' });
        queueStore.createIndex('status', 'status', { unique: false });
        queueStore.createIndex('createdAt', 'createdAt', { unique: false });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export function isSimulatedOffline(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(SIMULATED_OFFLINE_KEY) === 'true';
}

export function setSimulatedOffline(offline: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(SIMULATED_OFFLINE_KEY, offline ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nexus_network_status_changed', {
    detail: { isOnline: isAppOnline() }
  }));
}

export function isAppOnline(): boolean {
  if (typeof window === 'undefined') return true;
  if (isSimulatedOffline()) return false;
  return navigator.onLine;
}

export async function saveOutputToOfflineCache(item: CachedAgentOutput): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHED_OUTPUTS, 'readwrite');
      const store = tx.objectStore(STORE_CACHED_OUTPUTS);
      const req = store.put(item);
      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('nexus_offline_cache_updated'));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to cache output:', err);
  }
}

const STORAGE_KEY_DATA_USAGE = 'nexus_data_usage_bytes_v1';

export function getDataUsageBytes(): number {
  if (typeof window === 'undefined') return 0;
  const raw = localStorage.getItem(STORAGE_KEY_DATA_USAGE);
  return raw ? parseInt(raw, 10) || 0 : 0;
}

export function trackDataUsage(bytes: number): number {
  if (typeof window === 'undefined') return 0;
  const current = getDataUsageBytes();
  const updated = current + Math.max(0, bytes);
  localStorage.setItem(STORAGE_KEY_DATA_USAGE, updated.toString());
  window.dispatchEvent(new CustomEvent('nexus_data_usage_updated', { detail: { bytes: updated } }));
  return updated;
}

export function resetDataUsage(): void {
  if (typeof window === 'undefined') return;
  localStorage.removeItem(STORAGE_KEY_DATA_USAGE);
  window.dispatchEvent(new CustomEvent('nexus_data_usage_updated', { detail: { bytes: 0 } }));
}

/**
 * Runs auto-clear of expired local records based on the user's setting ('1h' | '1d' | 'never')
 */
export async function runAutoClearHistory(): Promise<number> {
  if (typeof window === 'undefined') return 0;
  const setting = getAutoClearSetting();
  if (setting === 'never') return 0;

  const maxAgeMs = setting === '1h' ? 3600 * 1000 : 24 * 3600 * 1000;
  const cutoff = Date.now() - maxAgeMs;

  let clearedCount = 0;
  try {
    const db = await openDb();
    const items = await getCachedOutputs();
    const toDelete = items.filter((i) => i.timestamp < cutoff);
    for (const item of toDelete) {
      await deleteCachedOutput(item.id);
      clearedCount++;
    }
  } catch (err) {
    console.warn('[OfflineStorage] Auto-clear error:', err);
  }
  return clearedCount;
}

export async function getCachedOutputs(agentIdFilter?: string): Promise<CachedAgentOutput[]> {
  try {
    const db = await openDb();

    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHED_OUTPUTS, 'readonly');
      const store = tx.objectStore(STORE_CACHED_OUTPUTS);
      const req = store.getAll();
      req.onsuccess = () => {
        let results = (req.result as CachedAgentOutput[]) || [];
        if (agentIdFilter) {
          results = results.filter((item) => item.agentId === agentIdFilter);
        }
        results.sort((a, b) => b.timestamp - a.timestamp);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to get cached outputs:', err);
    return [];
  }
}

export async function searchCachedOutputs(
  searchQuery: string,
  options?: {
    modelCategory?: 'all' | 'cloud' | 'on_device';
    agentId?: string;
  }
): Promise<CachedAgentOutput[]> {
  const all = await getCachedOutputs(options?.agentId);
  const q = searchQuery.toLowerCase().trim();
  return all.filter((item) => {
    if (options?.modelCategory && options.modelCategory !== 'all') {
      if (item.modelCategory !== options.modelCategory) return false;
    }
    if (!q) return true;
    return (
      item.title.toLowerCase().includes(q) ||
      item.prompt.toLowerCase().includes(q) ||
      item.agentName.toLowerCase().includes(q) ||
      item.output.toLowerCase().includes(q) ||
      (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)))
    );
  });
}

export async function deleteCachedOutput(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_CACHED_OUTPUTS, 'readwrite');
      const store = tx.objectStore(STORE_CACHED_OUTPUTS);
      const req = store.delete(id);
      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('nexus_offline_cache_updated'));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to delete cached output:', err);
  }
}

export async function queueOfflineRequest(
  agentId: string,
  agentName: string,
  userPrompt: string,
  context?: string,
  modelId?: string,
  onDeviceOutputSnippet?: string,
  onDeviceOutputId?: string
): Promise<QueuedOfflineRequest> {
  const reqItem: QueuedOfflineRequest = {
    id: `req_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
    agentId,
    agentName,
    userPrompt,
    context,
    modelId,
    createdAt: Date.now(),
    status: 'pending',
    onDeviceOutputSnippet,
    onDeviceOutputId
  };

  try {
    const db = await openDb();
    await new Promise<void>((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUED_REQUESTS, 'readwrite');
      const store = tx.objectStore(STORE_QUEUED_REQUESTS);
      const req = store.put(reqItem);
      req.onsuccess = () => resolve();
      req.onerror = () => reject(req.error);
    });
    window.dispatchEvent(new CustomEvent('nexus_offline_queue_updated'));
  } catch (err) {
    console.warn('[OfflineStorage] Failed to queue offline request:', err);
  }

  return reqItem;
}

export async function getQueuedRequests(): Promise<QueuedOfflineRequest[]> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUED_REQUESTS, 'readonly');
      const store = tx.objectStore(STORE_QUEUED_REQUESTS);
      const req = store.getAll();
      req.onsuccess = () => {
        const results = (req.result as QueuedOfflineRequest[]) || [];
        results.sort((a, b) => a.createdAt - b.createdAt);
        resolve(results);
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to get queued requests:', err);
    return [];
  }
}

export async function removeQueuedRequest(id: string): Promise<void> {
  try {
    const db = await openDb();
    return new Promise((resolve, reject) => {
      const tx = db.transaction(STORE_QUEUED_REQUESTS, 'readwrite');
      const store = tx.objectStore(STORE_QUEUED_REQUESTS);
      const req = store.delete(id);
      req.onsuccess = () => {
        window.dispatchEvent(new CustomEvent('nexus_offline_queue_updated'));
        resolve();
      };
      req.onerror = () => reject(req.error);
    });
  } catch (err) {
    console.warn('[OfflineStorage] Failed to remove queued request:', err);
  }
}

export async function reRunSingleQueuedRequest(requestId: string): Promise<{ success: boolean; newOutputId?: string; error?: string }> {
  if (!isAppOnline()) {
    return { success: false, error: 'Cannot re-run with Cloud while offline. Please connect to the internet first.' };
  }
  const items = await getQueuedRequests();
  const target = items.find((i) => i.id === requestId);
  if (!target) {
    return { success: false, error: 'Queued request not found' };
  }
  try {
    const res = await fetch('/api/agent/generate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        agentId: target.agentId,
        userPrompt: target.userPrompt,
        context: target.context,
        modelId: target.modelId,
      }),
    });
    if (!res.ok) {
      throw new Error(`HTTP ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    if (!data.success) {
      throw new Error(data.error || 'Backend failed to generate response');
    }
    const newId = `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`;
    await saveOutputToOfflineCache({
      id: newId,
      agentId: target.agentId,
      agentName: target.agentName,
      title: `${target.userPrompt.slice(0, 45)} (Cloud Bedrock)`,
      prompt: target.userPrompt,
      output: data.output,
      timestamp: Date.now(),
      model: 'Cloud (Bedrock)',
      modelCategory: 'cloud',
      isOfflineCached: false,
    });
    await removeQueuedRequest(target.id);
    window.dispatchEvent(new CustomEvent('nexus_offline_queue_updated'));
    return { success: true, newOutputId: newId };
  } catch (err: any) {
    return { success: false, error: err?.message || 'Failed to re-run request' };
  }
}

export async function drainOfflineQueue(
  onProcessed?: (item: QueuedOfflineRequest, response: any) => void
): Promise<{ processed: number; failed: number }> {
  if (!isAppOnline()) {
    return { processed: 0, failed: 0 };
  }
  const items = await getQueuedRequests();
  const pending = items.filter((i) => i.status === 'pending');
  let processed = 0;
  let failed = 0;
  for (const item of pending) {
    try {
      const res = await fetch('/api/agent/generate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          agentId: item.agentId,
          userPrompt: item.userPrompt,
          context: item.context,
          modelId: item.modelId,
        }),
      });
      if (!res.ok) {
        throw new Error(`HTTP ${res.status}: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success) {
        await saveOutputToOfflineCache({
          id: `out_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
          agentId: item.agentId,
          agentName: item.agentName,
          title: item.userPrompt.slice(0, 48),
          prompt: item.userPrompt,
          output: data.output,
          timestamp: Date.now(),
          model: 'Cloud (Bedrock)',
          modelCategory: 'cloud',
          isOfflineCached: false,
        });
        await removeQueuedRequest(item.id);
        processed++;
        if (onProcessed) onProcessed(item, data);
      } else {
        throw new Error(data.error || 'Server rejected request');
      }
    } catch (err: any) {
      failed++;
      console.error(`[OfflineStorage] Error processing queued request ${item.id}:`, err);
    }
  }
  window.dispatchEvent(new CustomEvent('nexus_offline_queue_updated'));
  return { processed, failed };
}

export function exportCachedItemToMarkdown(item: CachedAgentOutput): void {
  const dateStr = new Date(item.timestamp).toISOString();
  let md = `# ${item.title}\n\n`;
  md += `**Agent**: ${item.agentName} (${item.agentId})\n`;
  md += `**Execution Tier**: ${item.modelCategory === 'cloud' ? 'Cloud (Bedrock)' : 'On-device (offline, lower accuracy)'}\n`;
  md += `**Model Specification**: ${item.model}\n`;
  md += `**Timestamp**: ${dateStr}\n\n`;
  md += `## Original Prompt\n${item.prompt}\n\n`;
  md += `---\n\n`;
  md += `## Output\n\n${item.output}\n\n`;
  md += `---\n*Generated via Nexus Impact AI - Verified Field Protocol*\n`;

  const blob = new Blob([md], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `${item.agentId}_${item.modelCategory}_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function exportAllCachedItemsToMarkdown(items: CachedAgentOutput[]): void {
  if (items.length === 0) return;
  let fullMd = `# NEXUS IMPACT AI - LOCAL EVIDENCE VAULT EXPORT\n`;
  fullMd += `*Total Documents: ${items.length} | Exported: ${new Date().toISOString()}*\n\n`;
  fullMd += `---\n\n`;
  items.forEach((item, idx) => {
    fullMd += `## [Document ${idx + 1}] ${item.title}\n`;
    fullMd += `- **Agent**: ${item.agentName}\n`;
    fullMd += `- **Tier**: ${item.modelCategory === 'cloud' ? 'Cloud (Bedrock)' : 'On-device (offline, lower accuracy)'}\n`;
    fullMd += `- **Model**: ${item.model}\n`;
    fullMd += `- **Date**: ${new Date(item.timestamp).toLocaleString()}\n\n`;
    fullMd += `### Synthesis Content\n\n${item.output}\n\n`;
    fullMd += `---\n\n`;
  });

  const blob = new Blob([fullMd], { type: 'text/markdown;charset=utf-8' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `nexus_impact_vault_export_${Date.now()}.md`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}
