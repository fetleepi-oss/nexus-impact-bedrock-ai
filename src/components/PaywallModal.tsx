/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Crown,
  Check,
  X,
  CreditCard,
  RotateCcw,
  RefreshCw,
  ShieldCheck,
  Sparkles,
  CheckCircle2
} from 'lucide-react';
import { setProEntitlement, isDemoModeActive, setDemoMode } from '../limits';

interface PaywallModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  targetAgentName?: string;
  isProActive: boolean;
}

export const PaywallModal: React.FC<PaywallModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  targetAgentName,
  isProActive
}) => {
  const [selectedPackage, setSelectedPackage] = useState<'annual' | 'monthly' | 'lifetime'>('annual');
  const [isProcessing, setIsProcessing] = useState(false);
  const [transactionSuccess, setTransactionSuccess] = useState(false);
  const isDemo = isDemoModeActive();

  // Handle Escape key to close modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleTestStorePurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      const txId = `rc_test_${Math.random().toString(36).substring(2, 9)}`;
      setProEntitlement(true, {
        activeOfferingId: selectedPackage,
        testStoreTransactionId: txId
      });
      setIsProcessing(false);
      setTransactionSuccess(true);
      setTimeout(() => {
        setTransactionSuccess(false);
        onSuccess();
      }, 800);
    }, 600);
  };

  const handleToggleDemoMode = () => {
    setDemoMode(!isDemo);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="paywall-title"
      className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/80 backdrop-blur-sm animate-fade-in"
    >
      <div className="w-full max-w-md max-h-[92vh] overflow-y-auto bg-[#0B132B] border border-[#2E3C62] rounded-t-3xl sm:rounded-3xl p-5 text-white shadow-2xl space-y-4">
        {/* Top Header */}
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-amber-400/15 border border-amber-400/30 text-amber-200 text-xs font-bold">
            <Crown className="w-3.5 h-3.5 fill-amber-300 text-amber-300" aria-hidden="true" />
            <span>RevenueCat Default Offering</span>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-full bg-[#1C2541] hover:bg-[#2E3C62] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Demo Mode Notice for Judges */}
        {isDemo ? (
          <div className="p-3.5 rounded-2xl bg-teal-500/15 border border-teal-500/40 text-xs text-teal-100 space-y-1.5">
            <div className="flex items-center justify-between">
              <span className="font-bold text-teal-200 flex items-center gap-1.5">
                <CheckCircle2 className="w-4 h-4 text-teal-300" />
                <span>Hackathon Demo Mode Active</span>
              </span>
              <span className="px-2 py-0.5 rounded-full bg-teal-400 text-slate-950 font-black text-[9px]">
                ALL UNLOCKED
              </span>
            </div>
            <p className="text-[11px] text-slate-200 leading-relaxed">
              Every specialized Pro agent (Grant Proposal Architect, Human Rights Monitor, and Women's Health Specialist) is currently unlocked for evaluation without payment.
            </p>
            <div className="pt-1 flex items-center justify-between text-[10px] text-teal-200">
              <span>Testing tier gating?</span>
              <button
                type="button"
                onClick={handleToggleDemoMode}
                className="text-amber-300 hover:text-amber-200 underline font-semibold cursor-pointer"
              >
                Disable Demo Mode to test paywall
              </button>
            </div>
          </div>
        ) : (
          <div className="p-3 rounded-xl bg-[#1C2541] border border-[#2E3C62] flex items-center justify-between text-xs">
            <span className="text-slate-300">Standard Tier Active</span>
            <button
              type="button"
              onClick={handleToggleDemoMode}
              className="px-2.5 py-1 rounded-lg bg-teal-500 text-slate-950 font-bold text-[11px] cursor-pointer"
            >
              Enable Demo Mode
            </button>
          </div>
        )}

        {/* Hero Banner */}
        <div className="text-center space-y-1.5 pt-1">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-amber-400 to-[#F59E0B] mx-auto flex items-center justify-center shadow-lg shadow-amber-400/20 text-slate-950">
            <Crown className="w-7 h-7 fill-slate-950" aria-hidden="true" />
          </div>
          <h2 id="paywall-title" className="text-xl font-black tracking-tight text-white">
            {targetAgentName ? `Unlock ${targetAgentName}` : 'Nexus Pro Tier'}
          </h2>
          <p className="text-xs text-slate-200 max-w-xs mx-auto leading-relaxed">
            {targetAgentName
              ? `Empower your mission with ${targetAgentName} and unlimited Amazon Bedrock AI inference.`
              : 'Institutional intelligence for research, humanitarian response, and donor grant design.'}
          </p>
        </div>

        {/* Pro Feature Highlights */}
        <div className="rounded-2xl bg-[#1C2541]/80 border border-[#2E3C62] p-3.5 space-y-2 text-xs">
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-slate-200">
              <strong className="text-white">Grant Proposal Architect:</strong> Draft $1M+ donor proposals, logframes, and M&amp;E plans.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-slate-200">
              <strong className="text-white">Human Rights Monitor:</strong> Istanbul Protocol &amp; international treaty legal briefs.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-slate-200">
              <strong className="text-white">Women's Health Specialist:</strong> Clinical CEmONC and 72-hour GBV survivor referral pathways.
            </span>
          </div>
          <div className="flex items-start gap-2.5">
            <Check className="w-4 h-4 text-amber-300 shrink-0 mt-0.5" aria-hidden="true" />
            <span className="text-slate-200">
              <strong className="text-white">Unlimited Daily Generations:</strong> Bypass standard limits with priority Bedrock inference.
            </span>
          </div>
        </div>

        {/* RevenueCat Packages Selector */}
        <div className="space-y-2">
          <div className="text-[10px] uppercase font-mono tracking-wider text-slate-300 font-bold">
            Select Offering (Test Store Sandbox):
          </div>

          {/* Annual */}
          <div
            tabIndex={0}
            role="radio"
            aria-checked={selectedPackage === 'annual'}
            onClick={() => setSelectedPackage('annual')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedPackage('annual');
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
              selectedPackage === 'annual'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                : 'bg-[#1C2541]/50 border-[#2E3C62] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPackage === 'annual'
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-slate-500'
                }`}
              >
                {selectedPackage === 'annual' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-xs font-bold text-white">Annual Mission Pass</span>
                  <span className="px-1.5 py-0.2 rounded bg-amber-400 text-slate-950 text-[9px] font-extrabold">
                    SAVE 58%
                  </span>
                </div>
                <p className="text-[11px] text-slate-300">7-Day Free Trial, then $199/year</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-amber-300">$16.58/mo</span>
            </div>
          </div>

          {/* Monthly */}
          <div
            tabIndex={0}
            role="radio"
            aria-checked={selectedPackage === 'monthly'}
            onClick={() => setSelectedPackage('monthly')}
            onKeyDown={(e) => {
              if (e.key === 'Enter' || e.key === ' ') setSelectedPackage('monthly');
            }}
            className={`p-3 rounded-2xl border transition-all cursor-pointer flex items-center justify-between focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none ${
              selectedPackage === 'monthly'
                ? 'bg-amber-500/15 border-amber-400 text-white shadow-sm'
                : 'bg-[#1C2541]/50 border-[#2E3C62] text-slate-300 hover:border-slate-500'
            }`}
          >
            <div className="flex items-center gap-3">
              <div
                className={`w-4 h-4 rounded-full border flex items-center justify-center ${
                  selectedPackage === 'monthly'
                    ? 'border-amber-400 bg-amber-400'
                    : 'border-slate-500'
                }`}
              >
                {selectedPackage === 'monthly' && (
                  <div className="w-1.5 h-1.5 rounded-full bg-slate-950" />
                )}
              </div>
              <div>
                <span className="text-xs font-bold text-white">Monthly Impact</span>
                <p className="text-[11px] text-slate-300">Flexible monthly billing, cancel anytime</p>
              </div>
            </div>
            <div className="text-right">
              <span className="text-xs font-bold text-white">$29/month</span>
            </div>
          </div>
        </div>

        {/* Purchase Action (RevenueCat Test Store Sandbox) */}
        <button
          type="button"
          onClick={handleTestStorePurchase}
          disabled={isProcessing}
          className="w-full min-h-[50px] px-4 py-3 rounded-xl bg-gradient-to-r from-amber-400 to-[#F59E0B] hover:from-amber-300 hover:to-amber-400 text-slate-950 font-black text-sm tracking-wide transition-all shadow-lg shadow-amber-400/20 flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {isProcessing ? (
            <>
              <RefreshCw className="w-4 h-4 animate-spin text-slate-950" />
              <span>Simulating RevenueCat Purchase...</span>
            </>
          ) : transactionSuccess ? (
            <>
              <Check className="w-4 h-4 stroke-[3] text-slate-950" />
              <span>Entitlement Granted: Pro Active!</span>
            </>
          ) : (
            <>
              <CreditCard className="w-4 h-4" />
              <span>Complete Test Store Purchase ($0 Sandbox)</span>
            </>
          )}
        </button>

        {/* Sandbox Guarantee & Testing Helpers */}
        <div className="pt-2 border-t border-[#2E3C62] flex items-center justify-between text-[11px] text-slate-300">
          <div className="flex items-center gap-1 font-mono text-[10px]">
            <ShieldCheck className="w-3.5 h-3.5 text-teal-400" />
            <span>RevenueCat Test Store Sandbox</span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-teal-300 hover:text-teal-200 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
