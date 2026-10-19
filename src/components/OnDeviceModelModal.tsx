/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Cpu,
  Download,
  CheckCircle2,
  AlertTriangle,
  HardDrive,
  Zap,
  X,
  RefreshCw,
  Trash2,
  Sparkles
} from 'lucide-react';
import {
  OnDeviceModelStatus,
  subscribeToModelStatus,
  initializeOnDeviceModel,
  detectDeviceBackend,
  BackendType
} from '../onDeviceModel';

interface OnDeviceModelModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnDeviceModelModal: React.FC<OnDeviceModelModalProps> = ({ isOpen, onClose }) => {
  const [status, setStatus] = useState<OnDeviceModelStatus | null>(null);
  const [hardwareBackend, setHardwareBackend] = useState<BackendType>('wasm');

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    const unsub = subscribeToModelStatus((s) => {
      setStatus(s);
    });
    detectDeviceBackend().then(setHardwareBackend);
    return unsub;
  }, []);

  if (!isOpen) return null;

  const handleStartDownload = async () => {
    await initializeOnDeviceModel();
  };

  const handleClearModelCache = () => {
    if (typeof caches !== 'undefined') {
      caches.keys().then((keys) => {
        keys.forEach((k) => {
          if (k.includes('transformers') || k.includes('onnx')) {
            caches.delete(k);
          }
        });
      });
    }
    localStorage.removeItem('nexus_ondevice_model_v1');
    window.location.reload();
  };

  const isReady = status?.state === 'ready';
  const isDownloading = status?.state === 'downloading';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="ondevice-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-4 animate-fade-in"
    >
      <div className="bg-[#1C2541] border border-[#2E3C62] rounded-3xl w-full max-w-lg p-5 sm:p-6 space-y-4 shadow-2xl relative max-h-[92vh] overflow-y-auto text-slate-100">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#2E3C62] pb-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold">
              <Cpu className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="ondevice-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>On-Device Neural Model</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-teal-500/20 text-teal-200 font-mono uppercase font-bold">
                  {hardwareBackend.toUpperCase()}
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                On-device inference directly in browser (compact model + offline pack; lower accuracy than cloud)
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-xl bg-[#0B132B] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Storage Size & Wi-Fi Warning */}
        <div className="p-3.5 rounded-2xl bg-amber-500/15 border border-amber-500/40 space-y-1.5 text-xs text-amber-100">
          <div className="flex items-center gap-2 text-amber-300 font-bold">
            <AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" aria-hidden="true" />
            <span>Storage Notice (~145 MB Download)</span>
          </div>
          <p className="text-[11px] leading-relaxed">
            This on-device model ({status?.modelId || 'SmolLM-135M'}) is downloaded <strong>once</strong> and stored securely inside your browser's CacheStorage.
            Wi-Fi is recommended to preserve mobile data.
          </p>
          <div className="flex items-center gap-3 text-[10px] text-amber-200 font-mono pt-1 flex-wrap">
            <span className="flex items-center gap-1">
              <HardDrive className="w-3 h-3" /> Storage: ~{status?.storageSizeMB || 145} MB
            </span>
            <span>&middot;</span>
            <span className="flex items-center gap-1">
              <Zap className="w-3 h-3 text-teal-400" /> Acceleration: {hardwareBackend === 'webgpu' ? 'WebGPU (Hardware GPU)' : 'WASM (Universal CPU)'}
            </span>
          </div>
        </div>

        {/* Current State / Download Progress */}
        <div className="p-4 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-2.5">
          <div className="flex items-center justify-between text-xs font-mono">
            <span className="text-slate-300 font-bold">Model Runtime Status:</span>
            {isReady ? (
              <span className="text-emerald-300 font-bold flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" /> Ready (Active)
              </span>
            ) : isDownloading ? (
              <span className="text-amber-300 font-bold flex items-center gap-1">
                <RefreshCw className="w-3.5 h-3.5 animate-spin" /> Downloading {status?.progress}%
              </span>
            ) : (
              <span className="text-slate-400">Ready to Activate</span>
            )}
          </div>

          {/* Progress Bar */}
          {isDownloading && (
            <div className="space-y-1.5 pt-1">
              <div className="w-full h-2.5 rounded-full bg-[#1C2541] overflow-hidden border border-[#2E3C62]">
                <div
                  className="h-full bg-gradient-to-r from-teal-500 to-emerald-400 transition-all duration-300 rounded-full"
                  style={{ width: `${status?.progress || 10}%` }}
                />
              </div>
              <div className="flex justify-between text-[10px] text-slate-400 font-mono">
                <span>{(status?.downloadedBytes ? (status.downloadedBytes / (1024 * 1024)).toFixed(1) : '0')} MB</span>
                <span>{(status?.totalBytes ? (status.totalBytes / (1024 * 1024)).toFixed(1) : '145.0')} MB</span>
              </div>
            </div>
          )}

          <p className="text-[11px] text-slate-300 leading-relaxed font-mono">
            {status?.statusText || 'Ready to run on-device execution.'}
          </p>
        </div>

        {/* Offline RAG Knowledge Pack Integration Banner */}
        <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/30 flex items-start gap-2.5 text-xs">
          <Sparkles className="w-4 h-4 text-teal-300 shrink-0 mt-0.5" aria-hidden="true" />
          <div className="space-y-0.5">
            <h4 className="font-bold text-teal-200">Offline RAG Knowledge Pack Pre-Bundled</h4>
            <p className="text-[11px] text-slate-300 leading-relaxed">
              Sphere 2018 Standards, WHO Epidemic Guidelines, and USAID BHA indicators are bundled in the app shell. On-device answers cite exact sections with open licenses.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="pt-2 flex flex-col sm:flex-row items-center justify-between gap-2.5 border-t border-[#2E3C62]">
          {isReady ? (
            <div className="flex items-center gap-2 w-full justify-between">
              <button
                type="button"
                onClick={handleClearModelCache}
                className="min-h-[44px] px-3 py-2 rounded-xl bg-rose-500/15 hover:bg-rose-500/25 text-rose-200 border border-rose-500/30 text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Clear Cache</span>
              </button>
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs transition-colors cursor-pointer"
              >
                Done
              </button>
            </div>
          ) : isDownloading ? (
            <div className="flex items-center gap-2 text-xs text-amber-200 font-mono w-full justify-center py-2">
              <RefreshCw className="w-4 h-4 animate-spin text-amber-300" />
              <span>Downloading weights... Please keep this window open.</span>
            </div>
          ) : (
            <div className="flex items-center justify-between gap-2 w-full">
              <button
                type="button"
                onClick={onClose}
                className="min-h-[44px] px-4 py-2.5 rounded-xl bg-[#0B132B] hover:bg-[#152238] text-slate-200 text-xs font-semibold cursor-pointer"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleStartDownload}
                className="min-h-[44px] px-5 py-2.5 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 font-bold text-xs flex items-center gap-2 shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" />
                <span>Confirm &amp; Download (~145 MB)</span>
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
