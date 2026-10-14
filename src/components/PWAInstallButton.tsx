/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import { Download, Smartphone, X } from 'lucide-react';
import { usePWAInstall } from '../usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 hover:from-teal-400 hover:to-emerald-400 text-slate-950 text-xs font-bold transition-all shadow-md cursor-pointer"
        title="Install Nexus Impact AI as a native desktop/mobile app"
      >
        <Download className="w-3.5 h-3.5" aria-hidden="true" />
        <span>Install</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="inline-flex items-center gap-1.5 min-h-[36px] px-2.5 py-1 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-slate-200 border border-[#2E3C62] text-xs font-semibold transition-colors cursor-pointer"
        >
          <Smartphone className="w-3.5 h-3.5 text-teal-400" aria-hidden="true" />
          <span>Install</span>
        </button>
        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 backdrop-blur-sm p-4 animate-fade-in">
            <div className="w-full max-w-sm rounded-3xl bg-[#1C2541] border border-[#2E3C62] p-6 shadow-2xl text-white space-y-4">
              <div className="flex items-center justify-between border-b border-[#2E3C62] pb-3">
                <h3 className="text-sm font-bold flex items-center gap-2">
                  <Smartphone className="w-4 h-4 text-teal-400" />
                  <span>Install on iPhone / iPad</span>
                </h3>
                <button
                  type="button"
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <div className="space-y-3 text-xs text-slate-300 leading-relaxed">
                <div className="p-3 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">1</span>
                    Tap Safari Share Button
                  </span>
                  <p className="text-[11px] text-slate-400 pl-6.5">
                    Tap the square share icon with an arrow at the bottom of Safari.
                  </p>
                </div>
                <div className="p-3 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-1.5">
                  <span className="font-bold text-white flex items-center gap-1.5">
                    <span className="w-5 h-5 rounded-full bg-teal-500 text-slate-950 font-bold flex items-center justify-center text-[10px]">2</span>
                    Select 'Add to Home Screen'
                  </span>
                  <p className="text-[11px] text-slate-400 pl-6.5">
                    Scroll down in the action sheet and select <strong>Add to Home Screen</strong>.
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full min-h-[44px] py-2.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer"
              >
                Got It
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
