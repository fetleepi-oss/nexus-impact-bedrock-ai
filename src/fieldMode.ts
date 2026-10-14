/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

export interface FieldModeConfig {
  enabled: boolean;
  lowBandwidth: boolean;
  highContrast: boolean;
  largeText: boolean;
  oneHandedLayout: boolean;
}

const FIELD_MODE_KEY = 'nexus_field_mode_config_v1';

export const DEFAULT_FIELD_CONFIG: FieldModeConfig = {
  enabled: false,
  lowBandwidth: false,
  highContrast: false,
  largeText: false,
  oneHandedLayout: false
};

export function getFieldModeConfig(): FieldModeConfig {
  if (typeof window === 'undefined') return DEFAULT_FIELD_CONFIG;
  try {
    const raw = localStorage.getItem(FIELD_MODE_KEY);
    if (!raw) return DEFAULT_FIELD_CONFIG;
    return { ...DEFAULT_FIELD_CONFIG, ...JSON.parse(raw) };
  } catch (err) {
    return DEFAULT_FIELD_CONFIG;
  }
}

export function saveFieldModeConfig(config: Partial<FieldModeConfig>): FieldModeConfig {
  const current = getFieldModeConfig();
  const updated = { ...current, ...config };
  if (typeof window !== 'undefined') {
    localStorage.setItem(FIELD_MODE_KEY, JSON.stringify(updated));
    if (document.documentElement) {
      if (updated.enabled && updated.highContrast) {
        document.documentElement.classList.add('nexus-high-contrast');
      } else {
        document.documentElement.classList.remove('nexus-high-contrast');
      }
      if (updated.enabled && updated.largeText) {
        document.documentElement.classList.add('nexus-large-text');
      } else {
        document.documentElement.classList.remove('nexus-large-text');
      }
    }
    window.dispatchEvent(new CustomEvent('nexus_field_mode_changed', { detail: updated }));
  }
  return updated;
}
