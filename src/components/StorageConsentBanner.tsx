/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { ShieldCheck, HardDrive, Check, Info } from 'lucide-react';

const STORAGE_KEY_CONSENT = 'nexus_storage_notice_acknowledged_v1';

interface StorageConsentBannerProps {
  onOpenLegalModal: () => void;
}

export const StorageConsentBanner: React.FC<StorageConsentBannerProps> = ({
  onOpenLegalModal
}) => {
  const [acknowledged, setAcknowledged] = useState<boolean>(true);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem(STORAGE_KEY_CONSENT);
      if (!stored) {
        setAcknowledged(false);
      }
    }
  }, []);

  const handleAcknowledge = () => {
    if (typeof window !== 'undefined') {
      localStorage.setItem(STORAGE_KEY_CONSENT, 'true');
    }
    setAcknowledged(true);
  };

  if (acknowledged) return null;

  return (
    <div
      role="region"
      aria-label="Local storage notice"
      className="fixed bottom-16 sm:bottom-4 left-3 right-3 sm:left-auto sm:right-4 z-40 max-w-md bg-[#0E172E] border border-teal-500/40 rounded-2xl p-3.5 shadow-2xl backdrop-blur-md text-xs text-slate-200 animate-in slide-in-from-bottom"
    >
      <div className="flex items-start gap-2.5">
        <div className="w-7 h-7 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0 mt-0.5">
          <HardDrive className="w-4 h-4" aria-hidden="true" />
        </div>
        <div className="space-y-1.5 flex-1 min-w-0">
          <div className="flex items-center justify-between gap-1">
            <span className="font-bold text-white tracking-tight text-xs">
              Essential Local Storage Only
            </span>
            <span className="px-1.5 py-0.5 rounded text-[9px] font-mono bg-teal-500/20 text-teal-300 font-bold">
              0% Ads &middot; 0% Trackers
            </span>
          </div>
          <p className="text-[11px] text-slate-300 leading-snug">
            We store offline caches and emergency response guidelines strictly on this device (IndexedDB &amp; CacheStorage). No advertising or tracking cookies are ever used.
          </p>
          <div className="flex items-center justify-between gap-2 pt-1">
            <button
              type="button"
              onClick={onOpenLegalModal}
              className="text-[11px] text-teal-300 hover:text-teal-200 underline cursor-pointer"
            >
              Learn more in Storage Policy
            </button>
            <button
              type="button"
              onClick={handleAcknowledge}
              className="px-3 py-1 rounded-lg bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1 cursor-pointer transition-colors"
            >
              <Check className="w-3.5 h-3.5" />
              <span>Acknowledge</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
