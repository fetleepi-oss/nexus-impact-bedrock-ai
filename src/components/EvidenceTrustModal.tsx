/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  X,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import { EvidenceClaim, ChallengeReport } from '../evidenceTrust';

interface EvidenceTrustModalProps {
  isOpen: boolean;
  onClose: () => void;
  claims: EvidenceClaim[];
  challengeReport: ChallengeReport | null;
  agentName: string;
}

export const EvidenceTrustModal: React.FC<EvidenceTrustModalProps> = ({
  isOpen,
  onClose,
  claims,
  challengeReport,
  agentName
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const citedCount = claims.filter(c => c.type === 'cited').length;
  const assumptionCount = claims.filter(c => c.type === 'assumption').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="trust-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0E172E] border border-[#2E3C62] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C2541] bg-[#121D38]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <ShieldCheck className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="trust-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Evidence Trust Layer &amp; Red-Team Audit</span>
              </h2>
              <p className="text-xs text-slate-300">
                Verification of cited international benchmarks vs. operational field assumptions.
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1C2541] transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Breakdown Summary */}
        <div className="grid grid-cols-3 p-4 gap-2 border-b border-[#1C2541] bg-[#121D38]/50 text-center">
          <div className="p-2.5 rounded-xl bg-[#1C2541] border border-[#2E3C62]">
            <div className="text-[10px] font-mono text-emerald-400 font-bold">Cited Standards</div>
            <div className="text-base font-black text-white">{citedCount} Verified</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1C2541] border border-[#2E3C62]">
            <div className="text-[10px] font-mono text-amber-400 font-bold">Field Assumptions</div>
            <div className="text-base font-black text-amber-200">{assumptionCount} Unverified</div>
          </div>
          <div className="p-2.5 rounded-xl bg-[#1C2541] border border-[#2E3C62]">
            <div className="text-[10px] font-mono text-cyan-400 font-bold">Red-Team Posture</div>
            <div className="text-base font-black text-white">
              {challengeReport ? challengeReport.overallVulnerability : 'Standard'}
            </div>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 max-h-[60vh]">
          {/* Adversarial Challenge Findings if run */}
          {challengeReport && (
            <div className="p-4 rounded-xl bg-[#2A1625]/90 border border-rose-500/40 space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                  <span className="text-xs font-bold text-rose-200 uppercase font-mono tracking-wider">
                    Second-Pass Adversarial Challenge Findings
                  </span>
                </div>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-rose-500/20 text-rose-300 border border-rose-500/40 font-bold">
                  {challengeReport.overallVulnerability.toUpperCase()} VULNERABILITY
                </span>
              </div>
              <p className="text-xs text-rose-100 leading-relaxed font-sans">
                {challengeReport.executiveCritique}
              </p>
              <div className="space-y-2 pt-1">
                {challengeReport.findings.map((f, idx) => (
                  <div key={idx} className="p-2.5 rounded-lg bg-[#1B101E] border border-rose-500/20 text-xs space-y-1">
                    <div className="flex items-center justify-between text-[10px] font-mono">
                      <span className="font-bold text-rose-300">{f.category}</span>
                      <span className={`px-1.5 py-0.2 rounded font-bold ${
                        f.severity === 'Critical'
                          ? 'bg-rose-600 text-white'
                          : f.severity === 'High'
                          ? 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                          : 'bg-amber-500/20 text-amber-300'
                      }`}>
                        {f.severity}
                      </span>
                    </div>
                    <div className="font-bold text-white text-[11px]">{f.issue}</div>
                    <div className="text-[11px] text-slate-300">
                      <strong>Consequence:</strong> {f.impactIfUnchecked}
                    </div>
                    <div className="text-[11px] text-teal-300">
                      <strong>Countermeasure:</strong> {f.recommendedCounterMeasure}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Evidence Claims List */}
          <div className="space-y-2.5">
            <div className="text-xs font-bold text-slate-300 uppercase font-mono tracking-wider">
              Itemized Claims, Standards &amp; Field Assumptions
            </div>
            {claims.map((claim) => (
              <div
                key={claim.id}
                className={`p-3.5 rounded-xl border text-xs space-y-2 ${
                  claim.type === 'cited'
                    ? 'bg-[#15233E]/90 border-emerald-500/30'
                    : 'bg-[#262033]/90 border-amber-500/30'
                }`}
              >
                <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
                  <span
                    className={`font-mono text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                      claim.type === 'cited'
                        ? 'bg-emerald-500/15 text-emerald-200 border-emerald-500/30'
                        : 'bg-amber-500/15 text-amber-200 border-amber-500/30'
                    }`}
                  >
                    {claim.type === 'cited' ? 'CITING RECOGNIZED STANDARD' : 'FIELD OPERATIONAL ASSUMPTION'}
                  </span>
                  <span className="font-mono text-[10px] text-slate-300">
                    Confidence: <strong className={claim.confidenceScore >= 90 ? 'text-emerald-300' : 'text-amber-200'}>{claim.confidenceLevel} ({claim.confidenceScore}%)</strong>
                  </span>
                </div>
                <div className="font-bold text-white text-[12px] leading-snug">
                  {claim.claim}
                </div>
                <div className="p-2 rounded-lg bg-[#0C152B] border border-[#1E2B4D] space-y-1 text-[11px]">
                  <div className="text-teal-300 font-mono text-[10px]">
                    <strong>Source:</strong> {claim.source}
                  </div>
                  <div className="text-slate-300">
                    <strong>Rationale:</strong> {claim.rationale}
                  </div>
                  <div className="text-cyan-300 text-[10px]">
                    <strong>Field Verification Step:</strong> {claim.verificationStep}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1C2541] bg-[#121D38] flex items-center justify-between text-[11px] text-slate-300 font-mono">
          <span>Adversarial Safety Protocol: Sphere / WHO Grounded</span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-1.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-white font-bold cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
