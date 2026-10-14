/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface RedactionItem {
  type: 'email' | 'phone' | 'gps' | 'id' | 'name';
  original: string;
  replacement: string;
}

export interface RedactionResult {
  sanitizedText: string;
  redactions: RedactionItem[];
  wasRedacted: boolean;
}

const STORAGE_KEY_KEEP_ON_DEVICE_ONLY = 'nexus_keep_on_device_only_v1';
const STORAGE_KEY_AUTO_CLEAR = 'nexus_auto_clear_history_v1';

// Strict on-device preference
export function isKeepOnDeviceOnly(): boolean {
  if (typeof window === 'undefined') return false;
  return localStorage.getItem(STORAGE_KEY_KEEP_ON_DEVICE_ONLY) === 'true';
}

export function setKeepOnDeviceOnly(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_KEEP_ON_DEVICE_ONLY, enabled ? 'true' : 'false');
  window.dispatchEvent(new CustomEvent('nexus_privacy_settings_changed', {
    detail: { keepOnDeviceOnly: enabled }
  }));
}

// Auto-clear setting: '1h' | '1d' | 'never'
export type AutoClearInterval = '1h' | '1d' | 'never';

export function getAutoClearSetting(): AutoClearInterval {
  if (typeof window === 'undefined') return '1d';
  return (localStorage.getItem(STORAGE_KEY_AUTO_CLEAR) as AutoClearInterval) || '1d';
}

export function setAutoClearSetting(interval: AutoClearInterval): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY_AUTO_CLEAR, interval);
}

/**
 * Redacts personal identifiers (names, phone numbers, emails, national/UNHCR IDs, GPS coords)
 * before any outbound cloud communication.
 */
export function redactPersonalData(text: string): RedactionResult {
  if (!text) {
    return { sanitizedText: '', redactions: [], wasRedacted: false };
  }

  const redactions: RedactionItem[] = [];
  let sanitized = text;

  // 1. Email addresses
  const emailRegex = /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g;
  sanitized = sanitized.replace(emailRegex, (match) => {
    redactions.push({ type: 'email', original: match, replacement: '[REDACTED_EMAIL]' });
    return '[REDACTED_EMAIL]';
  });

  // 2. Phone numbers (international, sub-Saharan Africa +254, +252, +251, +250, +234, etc. and general numbers)
  const phoneRegex = /(?:\+?\d{1,3}[-.\s]?)?\(?\d{2,4}\)?[-.\s]?\d{3,4}[-.\s]?\d{3,4}\b/g;
  sanitized = sanitized.replace(phoneRegex, (match) => {
    // Avoid redacting short standalone numbers or percentages
    if (match.trim().length >= 8 && /\d{7,}/.test(match.replace(/\D/g, ''))) {
      redactions.push({ type: 'phone', original: match, replacement: '[REDACTED_PHONE]' });
      return '[REDACTED_PHONE]';
    }
    return match;
  });

  // 3. GPS Coordinates: e.g. -4.1234, 39.5678 or 0°21'N 32°34'E
  const gpsDecimalRegex = /[-+]?([1-8]?\d(\.\d+)?|90(\.0+)?),\s*[-+]?(180(\.0+)?|((1[0-7]\d)|([1-9]?\d))(\.\d+)?)/g;
  sanitized = sanitized.replace(gpsDecimalRegex, (match) => {
    redactions.push({ type: 'gps', original: match, replacement: '[REDACTED_GPS_COORDINATES]' });
    return '[REDACTED_GPS_COORDINATES]';
  });

  // 4. Refugee / UNHCR / National ID / Passport IDs
  // e.g. UNHCR-1234567, ID: 987654321, Passport: A1234567
  const idRegex = /\b(?:UNHCR|REF|ID|PASSPORT|NID|NIN)[-:\s#]*([A-Z0-9]{5,15})\b/gi;
  sanitized = sanitized.replace(idRegex, (match, idVal) => {
    redactions.push({ type: 'id', original: match, replacement: '[REDACTED_IDENTIFIER]' });
    return '[REDACTED_IDENTIFIER]';
  });

  // 5. Explicit Person Identifiers: "Patient: John Doe", "Client: Jane Smith", "Informant: Mary"
  const nameLabelRegex = /\b(Patient|Client|Informant|Victim|Beneficiary|Survivor|Officer):\s*([A-Z][a-z]+(?:\s+[A-Z][a-z]+){1,3})/g;
  sanitized = sanitized.replace(nameLabelRegex, (match, label, name) => {
    redactions.push({ type: 'name', original: name, replacement: `[REDACTED_${label.toUpperCase()}_NAME]` });
    return `${label}: [REDACTED_${label.toUpperCase()}_NAME]`;
  });

  return {
    sanitizedText: sanitized,
    redactions,
    wasRedacted: redactions.length > 0
  };
}

/**
 * Panic wipe routine: Clears IndexedDB, CacheStorage, localStorage, and sessionStorage,
 * then instantly redirects to a neutral URL.
 */
export async function executePanicWipe(redirectUrl: string = 'https://en.wikipedia.org'): Promise<void> {
  try {
    // 1. Wipe IndexedDB databases
    if (typeof window !== 'undefined' && window.indexedDB) {
      if (indexedDB.databases) {
        try {
          const dbs = await indexedDB.databases();
          for (const db of dbs) {
            if (db.name) {
              indexedDB.deleteDatabase(db.name);
            }
          }
        } catch {
          indexedDB.deleteDatabase('nexus_impact_offline_v2');
          indexedDB.deleteDatabase('nexus_encrypted_vault');
        }
      } else {
        indexedDB.deleteDatabase('nexus_impact_offline_v2');
        indexedDB.deleteDatabase('nexus_encrypted_vault');
      }
    }

    // 2. Wipe Service Worker caches
    if (typeof window !== 'undefined' && 'caches' in window) {
      const keys = await caches.keys();
      for (const k of keys) {
        await caches.delete(k);
      }
    }

    // 3. Wipe localStorage & sessionStorage
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  } catch (err) {
    console.error('Error during panic wipe:', err);
  } finally {
    if (typeof window !== 'undefined') {
      window.location.replace(redirectUrl);
    }
  }
}
