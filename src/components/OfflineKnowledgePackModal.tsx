/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  BookOpen,
  X,
  Search,
  ExternalLink,
  ShieldCheck,
  Check,
  Copy,
  Layers,
  Scale
} from 'lucide-react';
import { OFFLINE_KNOWLEDGE_PACK, KnowledgeDocument } from '../offlineKnowledgePack';

interface OfflineKnowledgePackModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OfflineKnowledgePackModal: React.FC<OfflineKnowledgePackModalProps> = ({ isOpen, onClose }) => {
  const [selectedDoc, setSelectedDoc] = useState<KnowledgeDocument>(OFFLINE_KNOWLEDGE_PACK[0]);
  const [searchQuery, setSearchQuery] = useState('');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const filteredDocs = OFFLINE_KNOWLEDGE_PACK.filter((d) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      d.title.toLowerCase().includes(q) ||
      d.organization.toLowerCase().includes(q) ||
      d.summary.toLowerCase().includes(q) ||
      d.sections.some((s) => s.sectionTitle.toLowerCase().includes(q) || s.keywords.some((k) => k.includes(q)))
    );
  });

  const handleCopyCitation = (secTitle: string, content: string, license: string, org: string) => {
    const text = `Citation: ${secTitle} (${org})\nLicense: ${license}\nText: "${content}"`;
    navigator.clipboard.writeText(text);
    setCopiedId(secTitle);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="knowledge-pack-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
    >
      <div className="bg-[#1C2541] border border-[#2E3C62] rounded-3xl w-full max-w-4xl h-[85vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#2E3C62] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-teal-500/20 border border-teal-500/40 text-teal-300 flex items-center justify-center font-bold">
              <BookOpen className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="knowledge-pack-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Bundled Offline Knowledge Pack</span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-emerald-500/20 text-emerald-300 font-mono">
                  100% Offline RAG
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Public-domain &amp; openly licensed reference documents embedded in client bundle
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-2 rounded-xl bg-[#1C2541] text-slate-300 hover:text-white transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search Bar */}
        <div className="p-3 border-b border-[#2E3C62] bg-[#0B132B]/60 flex items-center gap-2">
          <Search className="w-4 h-4 text-slate-400 ml-2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search standards (e.g. 'water 15 liters', 'cold chain', 'cholera', 'logframe')..."
            className="w-full bg-transparent border-none text-xs text-white placeholder-slate-400 focus:outline-none"
          />
          {searchQuery && (
            <button
              type="button"
              onClick={() => setSearchQuery('')}
              className="text-xs text-slate-300 hover:text-white mr-2 cursor-pointer font-semibold"
            >
              Clear
            </button>
          )}
        </div>

        {/* Content Layout */}
        <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
          {/* Documents Sidebar */}
          <div className="w-full md:w-72 border-r border-[#2E3C62] bg-[#0B132B]/40 overflow-y-auto p-3 space-y-2">
            <span className="text-[10px] font-mono text-slate-300 uppercase tracking-wider px-2 font-bold">
              Reference Libraries ({filteredDocs.length})
            </span>
            {filteredDocs.map((doc) => {
              const isSelected = selectedDoc.id === doc.id;
              return (
                <button
                  key={doc.id}
                  type="button"
                  onClick={() => setSelectedDoc(doc)}
                  className={`w-full text-left p-3 rounded-2xl transition-all cursor-pointer border ${
                    isSelected
                      ? 'bg-teal-500/15 border-teal-500/40 text-white'
                      : 'bg-[#1C2541]/50 border-transparent hover:border-[#2E3C62] text-slate-300 hover:text-white'
                  }`}
                >
                  <div className="text-[10px] font-mono text-teal-300 uppercase tracking-wider font-bold">
                    {doc.organization}
                  </div>
                  <h3 className="text-xs font-bold leading-snug mt-0.5 line-clamp-2">
                    {doc.shortTitle}
                  </h3>
                  <div className="mt-1 text-[9px] text-slate-300 line-clamp-1">
                    {doc.license}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Document Content Pane */}
          <div className="flex-1 overflow-y-auto p-5 space-y-5 bg-[#1C2541]/70">
            <div className="p-4 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-2.5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="text-xs font-bold text-teal-200 uppercase tracking-wider font-mono">
                  {selectedDoc.organization} &middot; {selectedDoc.versionOrYear}
                </span>
                <a
                  href={selectedDoc.publicSourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-[11px] text-amber-300 hover:text-amber-200 underline font-mono"
                >
                  <span>Public Source Repository</span>
                  <ExternalLink className="w-3 h-3" />
                </a>
              </div>
              <h2 className="text-base font-black text-white">
                {selectedDoc.title}
              </h2>
              <p className="text-xs text-slate-200 leading-relaxed">
                {selectedDoc.summary}
              </p>
              <div className="p-2.5 rounded-xl bg-teal-950/50 border border-teal-500/30 flex items-start gap-2 text-[11px]">
                <Scale className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" />
                <div>
                  <span className="font-bold text-teal-200">Open License:</span>{' '}
                  <span className="text-slate-200">{selectedDoc.license}</span>{' '}
                  <a
                    href={selectedDoc.licenseUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-amber-300 hover:underline ml-1"
                  >
                    (View Legal Code)
                  </a>
                </div>
              </div>
            </div>

            {/* Sections */}
            <div className="space-y-3.5">
              <h3 className="text-xs font-bold text-slate-200 uppercase tracking-wider font-mono flex items-center gap-2">
                <Layers className="w-3.5 h-3.5 text-teal-400" />
                <span>Indexed Benchmark Sections ({selectedDoc.sections.length})</span>
              </h3>
              {selectedDoc.sections.map((sec, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#0B132B]/80 border border-[#2E3C62] space-y-2.5 hover:border-teal-500/30 transition-all"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h4 className="text-xs font-bold text-white leading-snug">
                      {sec.sectionTitle}
                    </h4>
                    <button
                      type="button"
                      onClick={() => handleCopyCitation(sec.sectionTitle, sec.content, selectedDoc.license, selectedDoc.organization)}
                      className="min-h-[36px] px-2.5 py-1 rounded-lg bg-[#1C2541] hover:bg-[#2E3C62] text-[11px] text-slate-200 hover:text-white flex items-center gap-1 transition-colors cursor-pointer shrink-0 font-semibold"
                    >
                      {copiedId === sec.sectionTitle ? (
                        <>
                          <Check className="w-3 h-3 text-emerald-400" />
                          <span className="text-emerald-300 font-bold">Copied</span>
                        </>
                      ) : (
                        <>
                          <Copy className="w-3 h-3" />
                          <span>Copy Citation</span>
                        </>
                      )}
                    </button>
                  </div>
                  <p className="text-xs text-slate-200 leading-relaxed font-mono bg-[#1C2541]/50 p-3 rounded-xl border border-[#2E3C62]">
                    {sec.content}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3.5 border-t border-[#2E3C62] bg-[#0B132B] flex items-center justify-between text-xs text-slate-300">
          <span className="flex items-center gap-1.5 font-medium">
            <ShieldCheck className="w-4 h-4 text-emerald-400" />
            <span>Open Access &amp; Public Domain verified for field deployment</span>
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
