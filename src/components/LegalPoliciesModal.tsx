/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  Shield,
  FileText,
  Lock,
  HeartHandshake,
  Eye,
  AlertTriangle,
  X,
  Check,
  HardDrive,
  Scale
} from 'lucide-react';
import { getActiveLanguage, t } from '../i18n';

export type LegalTab =
  | 'privacy'
  | 'cookies'
  | 'terms'
  | 'donoharm'
  | 'accessibility'
  | 'responsible_ai';

interface LegalPoliciesModalProps {
  isOpen: boolean;
  onClose: () => void;
  initialTab?: LegalTab;
}

export const LegalPoliciesModal: React.FC<LegalPoliciesModalProps> = ({
  isOpen,
  onClose,
  initialTab = 'privacy'
}) => {
  const [activeTab, setActiveTab] = useState<LegalTab>(initialTab);
  const lang = getActiveLanguage();

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="legal-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in"
    >
      <div className="bg-[#0E172E] border border-[#2E3C62] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden text-slate-100">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[#1C2541] flex items-center justify-between gap-3 bg-[#0B132B]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-teal-500/20 text-teal-300 flex items-center justify-center shrink-0">
              <Shield className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="legal-modal-title" className="text-base font-bold text-white tracking-tight">
                Legal, Privacy &amp; Ethical Framework
              </h2>
              <p className="text-[11px] text-teal-300 font-mono">
                Plain-Language Governance &middot; Transparent Local Storage
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1C2541] cursor-pointer"
            aria-label="Close legal modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Legal Counsel Notice Disclaimer Banner */}
        <div className="px-5 py-2.5 bg-amber-500/15 border-b border-amber-500/30 flex items-center gap-2 text-xs text-amber-200">
          <AlertTriangle className="w-4 h-4 text-amber-400 shrink-0" aria-hidden="true" />
          <span className="font-semibold">
            Draft template, review with legal counsel before deployment.
          </span>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center overflow-x-auto border-b border-[#1C2541] px-4 py-2 gap-1.5 bg-[#0D152A] no-scrollbar">
          <button
            type="button"
            onClick={() => setActiveTab('privacy')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'privacy'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Privacy Policy
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('cookies')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'cookies'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Storage &amp; Cookies
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('donoharm')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'donoharm'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Do No Harm &amp; Protection
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('responsible_ai')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'responsible_ai'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Responsible AI
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('accessibility')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'accessibility'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Accessibility
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('terms')}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-colors cursor-pointer ${
              activeTab === 'terms'
                ? 'bg-teal-500 text-slate-950 font-bold'
                : 'text-slate-300 hover:bg-[#1C2541]'
            }`}
          >
            Terms of Use
          </button>
        </div>

        {/* Content Area */}
        <div className="p-5 overflow-y-auto space-y-4 text-xs sm:text-sm leading-relaxed text-slate-200">
          {activeTab === 'privacy' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Lock className="w-4 h-4 text-teal-400" />
                Privacy by Design: Anonymous, Local-First Architecture
              </h3>
              <p>
                Nexus Impact AI is engineered strictly for anonymous, account-less use in vulnerable displacement settings, crisis zones, and low-connectivity environments.
              </p>
              <div className="space-y-2 p-3 rounded-xl bg-[#1C2541]/70 border border-[#2E3C62]">
                <h4 className="font-bold text-teal-200">Core Privacy Principles:</h4>
                <ul className="list-disc pl-5 space-y-1 text-slate-300">
                  <li><strong>Zero Accounts &amp; Zero Login:</strong> We never ask for names, email addresses, phone numbers, or passwords.</li>
                  <li><strong>Zero Tracking &amp; Analytics:</strong> No tracking pixels, Google Analytics, social media trackers, or canvas fingerprinting.</li>
                  <li><strong>No Application Prompt Logging:</strong> This application does not log prompt text or generated answers. Note: Render and AWS infrastructure maintain standard network connection logs.</li>
                  <li><strong>Client-Side PII Redaction:</strong> Identifying details (emails, phone numbers, GPS coordinates, UNHCR numbers) are scrubbed in the browser before any cloud inference.</li>
                  <li><strong>Optional Web Crypto AES-GCM Encryption:</strong> All on-device cache can be sealed using your personal passphrase.</li>
                  <li><strong>Panic Wipe / Quick Exit:</strong> Pressing Esc 3 times or clicking Panic Wipe instantly erases all local caches, IndexedDB, and localStorage.</li>
                </ul>
              </div>
            </div>
          )}

          {activeTab === 'cookies' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HardDrive className="w-4 h-4 text-teal-400" />
                Storage &amp; Essential Cookies Policy
              </h3>
              <p>
                Nexus Impact AI does <strong>not</strong> use advertising cookies, marketing cookies, or third-party profiling cookies.
              </p>
              <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-[#2E3C62] space-y-2">
                <h4 className="font-bold text-teal-200">Exclusively Essential Storage Used:</h4>
                <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                  <li><strong>IndexedDB (nexus_impact_offline_v2):</strong> Stores cached agent outputs and queued offline requests on your phone/computer for field access without internet.</li>
                  <li><strong>CacheStorage (Service Worker):</strong> Caches the app shell HTML, JS, CSS, and icons so the application opens offline on 2G networks.</li>
                  <li><strong>localStorage:</strong> Stores your chosen UI language, high-contrast preference, and auto-clear interval.</li>
                </ul>
              </div>
              <p className="text-slate-400 text-[11px]">
                Under GDPR Article 6(1)(f) and ePrivacy Directive Article 5(3), strictly necessary local technical storage does not require advertising consent trackers.
              </p>
            </div>
          )}

          {activeTab === 'donoharm' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <HeartHandshake className="w-4 h-4 text-teal-400" />
                Data Protection &amp; &quot;Do No Harm&quot; Humanitarian Charter
              </h3>
              <p>
                In alignment with the ICRC Professional Standards for Protection Work and the Core Humanitarian Standard (CHS):
              </p>
              <div className="p-3 rounded-xl bg-[#1C2541]/70 border border-[#2E3C62] space-y-2 text-slate-300">
                <p>
                  <strong>1. No Kinetic or Military Targeting:</strong> The platform will strictly refuse and terminate any prompt requesting surveillance, military coordinates, or targeting of civilian IDP shelters.
                </p>
                <p>
                  <strong>2. Child Protection &amp; GBV Safeguarding:</strong> Case workers must never enter identifiable survivor names, case numbers, or location coordinates of safe houses.
                </p>
                <p>
                  <strong>3. Cultural Neutrality &amp; Inclusivity:</strong> Agent prompts are reviewed to eliminate discriminatory, age-insensitive, or stigmatizing terminology.
                </p>
              </div>
            </div>
          )}

          {activeTab === 'responsible_ai' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Scale className="w-4 h-4 text-teal-400" />
                Responsible-AI Decision Support Notice
              </h3>
              <div className="p-3 rounded-xl bg-amber-500/15 border border-amber-500/30 text-amber-200 space-y-2">
                <p className="font-bold">
                  Decision Support Only &mdash; Never Primary Clinical Diagnosis or Dosing
                </p>
                <p className="text-xs text-amber-100">
                  Nexus Impact AI produces research syntheses and procedural templates for qualified field professionals. It is not an autonomous medical device, diagnostic instrument, or legal advocate.
                </p>
              </div>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>All clinical information must be verified with certified medical officers and national clinical guidelines before treatment.</li>
                <li>Individual drug dosing is blocked by automated guardrails to prevent patient harm.</li>
                <li>Every assertion provides confidence ratings and citations, alongside an adversarial &quot;Challenge this Answer&quot; feature.</li>
              </ul>
            </div>
          )}

          {activeTab === 'accessibility' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <Eye className="w-4 h-4 text-teal-400" />
                Accessibility Statement (Designed toward WCAG 2.1 AA &amp; Offline Inclusivity)
              </h3>
              <p>
                We are committed to digital accessibility for crisis responders, persons with disabilities, and low-literacy users. Accessibility features are designed toward WCAG 2.1 AA guidelines (not formally audited by an external third party):
              </p>
              <ul className="list-disc pl-5 space-y-1.5 text-slate-300">
                <li><strong>Mobile Viewport:</strong> Fully operational at 360px viewport width without horizontal scroll.</li>
                <li><strong>High Contrast Mode:</strong> High contrast color palette (&gt;4.5:1 / 7:1) available with one tap.</li>
                <li><strong>Screen Readers &amp; ARIA:</strong> Semantic HTML landmarks, ARIA labels, and live regions.</li>
                <li><strong>Reduced Motion:</strong> Automatically honors user OS prefers-reduced-motion preferences.</li>
                <li><strong>Speech &amp; Audio:</strong> Built-in voice input and audio readout for low-literacy field volunteers.</li>
                <li><strong>Plain-Language Mode:</strong> Generates concise summaries with simplified grammar for rapid comprehension.</li>
              </ul>
            </div>
          )}

          {activeTab === 'terms' && (
            <div className="space-y-3">
              <h3 className="text-base font-bold text-white flex items-center gap-2">
                <FileText className="w-4 h-4 text-teal-400" />
                Terms of Use
              </h3>
              <p>
                By using Nexus Impact AI, you agree to deploy this system solely for humanitarian, scientific, public health, educational, and disaster relief purposes.
              </p>
              <ul className="list-disc pl-5 space-y-1 text-slate-300">
                <li>You may not use this system for unlawful surveillance, harassment, commercial exploitation of displaced persons, or military operations.</li>
                <li>The software is provided &quot;AS IS&quot; under the MIT License without warranty of any kind.</li>
                <li>Field personnel retain full human responsibility for all operational decisions.</li>
              </ul>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 py-3 border-t border-[#1C2541] bg-[#0B132B] flex flex-col sm:flex-row items-center justify-between gap-2">
          <span className="text-[11px] text-slate-400">
            Nexus Impact AI &middot; Humanitarian Open Technology &middot; <span className="italic text-teal-300">All translations are machine-assisted and under community review.</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-colors cursor-pointer shrink-0"
          >
            Understood
          </button>
        </div>
      </div>
    </div>
  );
};
