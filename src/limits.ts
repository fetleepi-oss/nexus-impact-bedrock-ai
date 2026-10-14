/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export const FREE_DAILY_LIMIT = 3;
const STORAGE_KEY_USAGE = 'nexus_daily_usage_v1';
const STORAGE_KEY_ENTITLEMENTS = 'nexus_entitlements_v1';
const STORAGE_KEY_DEMO_MODE = 'nexus_demo_mode_v1';

export interface EntitlementState {
  isPro: boolean;
  activeOfferingId?: string;
  purchasedAt?: string;
  expiresAt?: string;
  testStoreTransactionId?: string;
}

/**
 * Returns today's key string formatted as YYYY-MM-DD
 */
export function getTodayKey(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

/**
 * Retrieves the count of generations used today
 */
export function getTodayUsage(): number {
  if (typeof window === 'undefined') return 0;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    if (!raw) return 0;
    const records = JSON.parse(raw);
    const today = getTodayKey();
    return typeof records[today] === 'number' ? records[today] : 0;
  } catch (err) {
    console.warn('Error reading usage limit from localStorage:', err);
    return 0;
  }
}

/**
 * Returns how many free generations remain today
 */
export function getRemainingFreeGenerations(): number {
  const usage = getTodayUsage();
  return Math.max(0, FREE_DAILY_LIMIT - usage);
}

/**
 * Increments today's usage counter by 1 and dispatches an update event
 */
export function incrementDailyUsage(): number {
  if (typeof window === 'undefined') return 1;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_USAGE);
    const records = raw ? JSON.parse(raw) : {};
    const today = getTodayKey();
    const current = typeof records[today] === 'number' ? records[today] : 0;
    records[today] = current + 1;
    localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(records));
    
    // Notify all listeners across the app
    window.dispatchEvent(new CustomEvent('nexus_limits_updated', {
      detail: { todayUsage: records[today], remaining: Math.max(0, FREE_DAILY_LIMIT - records[today]) }
    }));
    
    return records[today];
  } catch (err) {
    console.warn('Error updating usage limit in localStorage:', err);
    return 1;
  }
}

/**
 * Checks whether Hackathon Demo Mode is active.
 * Defaults to true for judges and reviewers.
 */
export function isDemoModeActive(): boolean {
  if (typeof window === 'undefined') return true;
  const stored = localStorage.getItem(STORAGE_KEY_DEMO_MODE);
  if (stored !== null) {
    return stored === 'true';
  }
  // Default to true for judge evaluation
  return true;
}

export function setDemoMode(active: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_DEMO_MODE, active ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nexus_demo_mode_updated', { detail: { isDemoMode: active } }));
  window.dispatchEvent(new CustomEvent('nexus_entitlement_updated', { detail: { isPro: active || isProEntitled() } }));
}

/**
 * Checks whether the user has active "pro" entitlement (or Demo Mode is active)
 */
export function isProEntitled(): boolean {
  if (typeof window === 'undefined') return true;
  if (isDemoModeActive()) return true;
  try {
    const raw = localStorage.getItem(STORAGE_KEY_ENTITLEMENTS);
    if (!raw) return false;
    const parsed: EntitlementState = JSON.parse(raw);
    return Boolean(parsed.isPro);
  } catch {
    return false;
  }
}

/**
 * Updates the user's Pro entitlement (mocking RevenueCat customerInfo update)
 */
export function setProEntitlement(isPro: boolean, details?: Partial<EntitlementState>): void {
  if (typeof window === 'undefined') return;
  try {
    const state: EntitlementState = {
      isPro,
      activeOfferingId: details?.activeOfferingId || 'nexus_pro_annual',
      purchasedAt: details?.purchasedAt || new Date().toISOString(),
      expiresAt: details?.expiresAt || new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString(),
      testStoreTransactionId: details?.testStoreTransactionId || `rc_test_${Math.random().toString(36).substring(2, 9)}`
    };
    localStorage.setItem(STORAGE_KEY_ENTITLEMENTS, JSON.stringify(state));
    window.dispatchEvent(new CustomEvent('nexus_entitlement_updated', { detail: state }));
  } catch (err) {
    console.error('Failed to save Pro entitlement:', err);
  }
}

/**
 * Check generation permission for an agent
 */
export function canGenerate(tier: 'free' | 'pro', agentId?: string): {
  allowed: boolean;
  reason?: 'pro_required' | 'daily_limit_reached';
} {
  // Hackathon Demo Mode unlocks everything for judges
  if (isDemoModeActive()) {
    return { allowed: true };
  }

  // Knowledge Base is always free and unrestricted
  if (agentId === 'knowledge_base') {
    return { allowed: true };
  }

  const isPro = isProEntitled();
  if (isPro) {
    return { allowed: true };
  }

  if (tier === 'pro') {
    return { allowed: false, reason: 'pro_required' };
  }

  // Free tier agent: check daily limit
  const remaining = getRemainingFreeGenerations();
  if (remaining <= 0) {
    return { allowed: false, reason: 'daily_limit_reached' };
  }

  return { allowed: true };
}

/**
 * Utility for demo testing to reset daily usage
 */
export function resetDailyUsageForTesting(): void {
  if (typeof window === 'undefined') return;
  const raw = localStorage.getItem(STORAGE_KEY_USAGE);
  const records = raw ? JSON.parse(raw) : {};
  const today = getTodayKey();
  delete records[today];
  localStorage.setItem(STORAGE_KEY_USAGE, JSON.stringify(records));
  window.dispatchEvent(new CustomEvent('nexus_limits_updated', {
    detail: { todayUsage: 0, remaining: FREE_DAILY_LIMIT }
  }));
}
