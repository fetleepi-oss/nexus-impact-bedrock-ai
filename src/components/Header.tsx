/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect, useRef } from 'react';
import {
  Crown,
  Sparkles,
  Zap,
  Cloud,
  Wifi,
  WifiOff,
  Users,
  HardDrive,
  Cpu,
  Globe,
  Sliders,
  ShieldCheck,
  TrendingUp,
  Award,
  ChevronDown,
  AlertTriangle,
  CheckCircle2,
  AlertOctagon,
  Lock,
  FileText
} from 'lucide-react';
import {
  isAppOnline,
  isSimulatedOffline,
  setSimulatedOffline,
  getQueuedRequests,
  getDataUsageBytes
} from '../offlineStorage';
import { subscribeToModelStatus, OnDeviceModelStatus } from '../onDeviceModel';
import { PWAInstallButton } from './PWAInstallButton';
import {
  SupportedLanguage,
  SUPPORTED_LANGUAGES,
  getActiveLanguage,
  setActiveLanguage,
  getLanguageWarning,
  t
} from '../i18n';
import { getFieldModeConfig, saveFieldModeConfig, FieldModeConfig } from '../fieldMode';
import { executePanicWipe } from '../privacyRedaction';

interface HeaderProps {
  onOpenAwsTab?: () => void;
  onOpenAlexaTab?: () => void;
  onOpenWhoThisHelps?: () => void;
  onOpenOfflineVault?: () => void;
  onOpenModelManager?: () => void;
  onOpenKnowledgePack?: () => void;
  onOpenAuditTrail?: () => void;
  onOpenImpactTracker?: () => void;
  onOpenEvaluations?: () => void;
  onOpenLegalModal?: () => void;
  onOpenSelfTest?: () => void;
  selectedModel?: string;
  configuredModelId?: string;
  configuredRegion?: string;
  bedrockConfigured?: boolean;
  isSimulatedMode?: boolean;
}

export const Header: React.FC<HeaderProps> = ({
  onOpenAwsTab,
  onOpenAlexaTab,
  onOpenWhoThisHelps,
  onOpenOfflineVault,
  onOpenModelManager,
  onOpenKnowledgePack,
  onOpenAuditTrail,
  onOpenImpactTracker,
  onOpenEvaluations,
  onOpenLegalModal,
  onOpenSelfTest,
  selectedModel = '',
  configuredModelId = '',
  configuredRegion = 'us-east-1',
  bedrockConfigured = false,
  isSimulatedMode = false
}) => {
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isSimOffline, setIsSimOffline] = useState<boolean>(false);
  const [queuedCount, setQueuedCount] = useState<number>(0);
  const [modelStatus, setModelStatus] = useState<OnDeviceModelStatus | null>(null);
  const [dataUsageBytes, setDataUsageBytes] = useState<number>(getDataUsageBytes());

  // Live health state from /api/health
  const [healthBedrockConfigured, setHealthBedrockConfigured] = useState<boolean>(bedrockConfigured);
  const [healthSimulatedMode, setHealthSimulatedMode] = useState<boolean>(isSimulatedMode);
  const [healthModelId, setHealthModelId] = useState<string>(configuredModelId);
  const [connectionTestPassed, setConnectionTestPassed] = useState<boolean>(() => {
    try {
      return localStorage.getItem('nexus_bedrock_test_passed') === 'true';
    } catch {
      return false;
    }
  });

  // Multilingual state
  const [activeLang, setActiveLang] = useState<SupportedLanguage>(getActiveLanguage());
  const [isLangMenuOpen, setIsLangMenuOpen] = useState<boolean>(false);

  // Field Mode state
  const [fieldConfig, setFieldConfig] = useState<FieldModeConfig>(getFieldModeConfig());

  // Offline Ready state (active only when service worker controller or shell cache is ready)
  const [isOfflineReady, setIsOfflineReady] = useState<boolean>(() => {
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
      return true;
    }
    return false;
  });

  // Panic wipe key listener: 3 Esc presses within 1.5 seconds
  const escPressesRef = useRef<number[]>([]);

  const effectiveBedrockConfigured = healthBedrockConfigured || bedrockConfigured;
  const activeModelId = healthModelId || configuredModelId || selectedModel;
  // Use "Amazon Bedrock (model ID)" wording only when Bedrock is configured AND connection test succeeded
  const isBedrockActive = Boolean(effectiveBedrockConfigured && activeModelId && connectionTestPassed);

  const modeHeaderLabel = !isOnline
    ? 'On-device (offline, lower accuracy)'
    : isBedrockActive
      ? `Amazon Bedrock (${activeModelId})`
      : 'Simulated mode (no cloud AI)';

  useEffect(() => {
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (typeof data.bedrockConfigured === 'boolean') {
          setHealthBedrockConfigured(data.bedrockConfigured);
        }
        if (typeof data.allowSimulatedResponses === 'boolean') {
          setHealthSimulatedMode(data.allowSimulatedResponses);
        }
        if (data.bedrockModelId) {
          setHealthModelId(data.bedrockModelId);
        }
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    const checkOfflineReady = async () => {
      try {
        if (typeof window !== 'undefined' && 'caches' in window) {
          const keys = await caches.keys();
          const hasCache = keys.some((k) => k.startsWith('nexus-impact-shell'));
          if (hasCache) {
            setIsOfflineReady(true);
            return;
          }
        }
        if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator && navigator.serviceWorker.controller) {
          setIsOfflineReady(true);
        }
      } catch {
        // Fallback
      }
    };
    checkOfflineReady();

    const updateNetworkStatus = () => {
      setIsOnline(isAppOnline());
      setIsSimOffline(isSimulatedOffline());
    };
    const updateQueueCount = async () => {
      const queued = await getQueuedRequests();
      setQueuedCount(queued.length);
    };
    const handleLangChanged = (e: any) => {
      if (e.detail?.language) setActiveLang(e.detail.language);
    };
    const handleFieldChanged = (e: any) => {
      if (e.detail) setFieldConfig(e.detail);
    };
    const handleDataUsage = (e: any) => {
      if (e.detail?.bytes !== undefined) setDataUsageBytes(e.detail.bytes);
    };

    updateNetworkStatus();
    updateQueueCount();

    const unsubModel = subscribeToModelStatus((s) => setModelStatus(s));
    window.addEventListener('online', updateNetworkStatus);
    window.addEventListener('offline', updateNetworkStatus);
    window.addEventListener('nexus_network_status_changed', updateNetworkStatus);
    window.addEventListener('nexus_offline_queue_updated', updateQueueCount);
    window.addEventListener('nexus_language_changed', handleLangChanged);
    window.addEventListener('nexus_field_mode_changed', handleFieldChanged);
    window.addEventListener('nexus_data_usage_updated', handleDataUsage);
    if (typeof navigator !== 'undefined' && 'serviceWorker' in navigator) {
      navigator.serviceWorker.addEventListener('controllerchange', checkOfflineReady);
    }

    // Esc x 3 Panic Wipe listener
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        const now = Date.now();
        escPressesRef.current = escPressesRef.current.filter((t) => now - t < 1500);
        escPressesRef.current.push(now);
        if (escPressesRef.current.length >= 3) {
          executePanicWipe();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);

    return () => {
      unsubModel();
      window.removeEventListener('online', updateNetworkStatus);
      window.removeEventListener('offline', updateNetworkStatus);
      window.removeEventListener('nexus_network_status_changed', updateNetworkStatus);
      window.removeEventListener('nexus_offline_queue_updated', updateQueueCount);
      window.removeEventListener('nexus_language_changed', handleLangChanged);
      window.removeEventListener('nexus_field_mode_changed', handleFieldChanged);
      window.removeEventListener('nexus_data_usage_updated', handleDataUsage);
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, []);

  const handleToggleOfflineSimulation = () => {
    const nextSimState = !isSimOffline;
    setSimulatedOffline(nextSimState);
  };

  const handleSelectLanguage = (lang: SupportedLanguage) => {
    setActiveLanguage(lang);
    setActiveLang(lang);
    setIsLangMenuOpen(false);
  };

  const handleToggleFieldMode = () => {
    const nextEnabled = !fieldConfig.enabled;
    const updated = saveFieldModeConfig({
      enabled: nextEnabled,
      lowBandwidth: nextEnabled ? true : fieldConfig.lowBandwidth,
      highContrast: nextEnabled ? true : fieldConfig.highContrast,
      largeText: nextEnabled ? true : fieldConfig.largeText,
      oneHandedLayout: nextEnabled ? true : fieldConfig.oneHandedLayout
    });
    setFieldConfig(updated);
  };

  const handlePanicWipeClick = () => {
    if (confirm('EMERGENCY PANIC WIPE: Instantly clear all cached data, offline records, and local history, and exit to a neutral site?')) {
      executePanicWipe();
    }
  };

  const offlineLanguageWarning = getLanguageWarning(activeLang, !isOnline);
  const dataKb = Math.round(dataUsageBytes / 1024);

  return (
    <header className="sticky top-0 z-30 bg-[#0B132B]/95 backdrop-blur-md border-b border-[#1C2541] px-2.5 sm:px-4 py-2 w-full max-w-full">
      <div className="max-w-4xl mx-auto space-y-1.5">
        {/* Top Row: Brand & Status Controls */}
        <div className="flex flex-wrap items-center justify-between gap-1.5">
          {/* Brand identity */}
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-[#0D9488] to-[#14B8A6] flex items-center justify-center text-slate-950 font-black text-sm shadow-sm shrink-0">
              N
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <span className="text-sm font-extrabold tracking-tight text-white leading-tight truncate">
                  Nexus Impact AI
                </span>
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-400/20 text-teal-300 border border-teal-400/40">
                  <CheckCircle2 className="w-2.5 h-2.5" aria-hidden="true" />
                  <span>Free &amp; Open Source</span>
                </span>
                {isOfflineReady && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/15 text-emerald-300 border border-emerald-500/30" title="Offline ready: App shell and knowledge pack cached locally">
                    <HardDrive className="w-2.5 h-2.5" aria-hidden="true" />
                    <span>Offline ready</span>
                  </span>
                )}
              </div>
              <p className="text-[10px] text-teal-200 font-medium leading-none flex items-center gap-1 mt-0.5 font-mono truncate">
                <span className="text-amber-300 font-semibold truncate max-w-[260px]" title={modeHeaderLabel}>
                  {modeHeaderLabel}
                </span>
                <span>&middot;</span>
                <span className="text-cyan-300">{SUPPORTED_LANGUAGES[activeLang].nativeName}</span>
                {fieldConfig.lowBandwidth && (
                  <>
                    <span>&middot;</span>
                    <span className="text-emerald-300">{dataKb} KB</span>
                  </>
                )}
              </p>
            </div>
          </div>

          {/* Right Action Toolbar */}
          <div className="flex items-center gap-1 sm:gap-1.5 flex-wrap">
            {/* Multilingual Selector (11 languages) */}
            <div className="relative">
              <button
                type="button"
                aria-expanded={isLangMenuOpen}
                aria-label="Select language"
                onClick={() => setIsLangMenuOpen(!isLangMenuOpen)}
                className="inline-flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] border border-[#2E3C62] text-slate-200 text-[10px] font-bold transition-colors cursor-pointer"
              >
                <Globe className="w-3 h-3 text-cyan-400" aria-hidden="true" />
                <span>{SUPPORTED_LANGUAGES[activeLang].name.slice(0, 3)}</span>
                <ChevronDown className="w-2.5 h-2.5 opacity-60" aria-hidden="true" />
              </button>

              {isLangMenuOpen && (
                <div className="absolute right-0 top-full mt-1.5 w-64 bg-[#0E172E] border border-[#2E3C62] rounded-xl shadow-2xl p-1.5 z-50 text-xs space-y-1 max-h-80 overflow-y-auto">
                  <div className="px-2 py-1 text-[10px] font-mono text-slate-300 uppercase tracking-wider border-b border-[#1C2541]">
                    UI &amp; Output Language (11 Supported)
                  </div>
                  {(Object.keys(SUPPORTED_LANGUAGES) as SupportedLanguage[]).map((langKey) => {
                    const l = SUPPORTED_LANGUAGES[langKey];
                    const isSelected = activeLang === langKey;
                    return (
                      <button
                        key={langKey}
                        type="button"
                        onClick={() => handleSelectLanguage(langKey)}
                        className={`w-full text-left px-2.5 py-1.5 rounded-lg flex items-center justify-between text-xs transition-colors cursor-pointer ${
                          isSelected ? 'bg-teal-500/20 text-teal-200 font-bold' : 'text-slate-200 hover:bg-[#1C2541]'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          <span className="font-bold">{l.nativeName}</span>
                          <span className="text-[10px] text-slate-400">({l.name})</span>
                        </div>
                        <span className={`text-[9px] font-mono ${
                          l.offlineSupport === 'strong' ? 'text-emerald-400' : l.offlineSupport === 'moderate' ? 'text-amber-400' : 'text-rose-400'
                        }`}>
                          {l.offlineSupport === 'weak' ? 'Cloud Only' : l.offlineSupport === 'moderate' ? 'Mod Offline' : 'Offline OK'}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Field Mode Quick Toggle */}
            <button
              type="button"
              aria-label="Toggle field mode"
              onClick={handleToggleFieldMode}
              className={`inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-xl text-[10px] font-bold border transition-colors cursor-pointer ${
                fieldConfig.enabled
                  ? 'bg-amber-500/20 border-amber-500/60 text-amber-200'
                  : 'bg-[#1C2541] border-[#2E3C62] text-slate-200 hover:text-white'
              }`}
            >
              <Sliders className="w-3 h-3 text-amber-400" aria-hidden="true" />
              <span>Field</span>
              {fieldConfig.enabled && (
                <span className="w-1.5 h-1.5 rounded-full bg-amber-400" />
              )}
            </button>

            {/* In-App PWA Install Button */}
            <PWAInstallButton />

            {/* Legal / Policy Modal Opener */}
            {onOpenLegalModal && (
              <button
                type="button"
                aria-label="Legal & Privacy Policy"
                onClick={onOpenLegalModal}
                className="inline-flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] border border-[#2E3C62] text-slate-300 hover:text-white text-[10px] font-semibold transition-colors cursor-pointer"
                title="Privacy, Storage Policy, Terms & Do No Harm Statement"
              >
                <FileText className="w-3 h-3 text-teal-400" aria-hidden="true" />
                <span className="hidden sm:inline">Policies</span>
              </button>
            )}

            {/* Self-Test (/selftest) Diagnostics Opener */}
            {onOpenSelfTest && (
              <button
                type="button"
                aria-label="Run automated system self-tests"
                onClick={onOpenSelfTest}
                className="inline-flex items-center gap-1 min-h-[36px] px-2 py-1 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] border border-[#2E3C62] text-emerald-300 hover:text-emerald-200 text-[10px] font-semibold transition-colors cursor-pointer"
                title="Automated Self-Test Diagnostics (/selftest)"
              >
                <ShieldCheck className="w-3 h-3 text-emerald-400" aria-hidden="true" />
                <span className="hidden sm:inline">Self-Test</span>
              </button>
            )}

            {/* Online / Offline Simulator Toggle */}
            <button
              type="button"
              aria-label={isOnline ? 'Online mode active, tap to simulate offline' : 'Offline mode active, tap to go online'}
              onClick={handleToggleOfflineSimulation}
              className={`inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-full text-[10px] font-bold transition-all border cursor-pointer ${
                isOnline
                  ? 'bg-teal-500/15 border-teal-500/40 text-teal-200 hover:bg-teal-500/25'
                  : 'bg-amber-500/20 border-amber-500/50 text-amber-200 hover:bg-amber-500/30'
              }`}
            >
              {isOnline ? (
                <>
                  <Wifi className="w-3 h-3 text-teal-400" aria-hidden="true" />
                  <span>Online</span>
                </>
              ) : (
                <>
                  <WifiOff className="w-3 h-3 text-amber-400" aria-hidden="true" />
                  <span>Offline</span>
                </>
              )}
            </button>

            {/* QUICK EXIT / PANIC WIPE BUTTON (On every screen + Esc x 3) */}
            <button
              type="button"
              aria-label="Quick Exit / Panic Wipe: Instantly wipe all local data and leave page (or press Esc 3 times)"
              onClick={handlePanicWipeClick}
              className="inline-flex items-center gap-1 min-h-[36px] px-2.5 py-1 rounded-xl bg-rose-600/80 hover:bg-rose-500 text-white text-[10px] font-black border border-rose-400 shadow-sm transition-all cursor-pointer"
              title="Panic Wipe: Instantly clears cache, IndexedDB, localStorage and exits (Esc x 3)"
            >
              <AlertOctagon className="w-3 h-3 fill-rose-200 text-rose-950" aria-hidden="true" />
              <span>Panic Wipe</span>
            </button>
          </div>
        </div>

        {/* Honest Architecture Routing Notice */}
        <div className="px-2.5 py-1 rounded-lg bg-[#111C3A] border border-[#21305A] text-[10px] font-mono text-slate-300 flex items-center justify-between gap-1 flex-wrap">
          <span className="flex items-center gap-1">
            <Lock className="w-2.5 h-2.5 text-teal-400 shrink-0" />
            <span>
              {!isOnline
                ? 'Offline mode never leaves this device (on-device local execution)'
                : isBedrockActive
                  ? `Online requests are processed by Amazon Bedrock (${activeModelId}). This app does not log prompt text.`
                  : 'Simulated answers from a bundled knowledge pack. No cloud AI is used. This app does not log prompt text.'}
            </span>
          </span>
          <span className="text-[9px] text-slate-400">
            Esc x 3 for Panic Wipe
          </span>
        </div>

        {/* Honest Offline Weak Language Warning Banner */}
        {offlineLanguageWarning && (
          <div className="flex items-start gap-1.5 px-3 py-1.5 rounded-xl bg-rose-950/80 border border-rose-500/40 text-[11px] text-rose-200 font-mono">
            <AlertTriangle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" aria-hidden="true" />
            <div>
              <strong>MODEL NOTICE ({SUPPORTED_LANGUAGES[activeLang].name}):</strong> {offlineLanguageWarning}
            </div>
          </div>
        )}

        {/* Offline Banner Bar if offline */}
        {!isOnline && (
          <div className="flex items-center justify-between px-3 py-1.5 rounded-xl bg-amber-950/80 border border-amber-500/40 text-[11px] text-amber-200">
            <span className="flex items-center gap-1.5 font-mono truncate mr-2">
              <span className="w-2 h-2 rounded-full bg-amber-400 shrink-0" />
              <span className="truncate">On-device (offline, lower accuracy) &middot; Bundled Sphere/WHO standards</span>
            </span>
            <div className="flex items-center gap-2 shrink-0">
              {queuedCount > 0 && (
                <span className="text-[10px] text-amber-300 font-bold font-mono">
                  ({queuedCount} queued)
                </span>
              )}
              <button
                type="button"
                onClick={handleToggleOfflineSimulation}
                className="text-[10px] px-2 py-0.5 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 font-bold border border-amber-500/40 cursor-pointer"
              >
                Go Online
              </button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
};
