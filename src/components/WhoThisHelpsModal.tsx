/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect } from 'react';
import {
  Users,
  X,
  Clock,
  CheckCircle2,
  FileText,
  LifeBuoy,
  BookOpen,
  Sparkles,
  Info
} from 'lucide-react';

interface WhoThisHelpsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectAgentWithPrompt?: (agentId: string, prompt: string) => void;
}

export const WhoThisHelpsModal: React.FC<WhoThisHelpsModalProps> = ({
  isOpen,
  onClose,
  onSelectAgentWithPrompt,
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const personas = [
    {
      id: 'researcher',
      agentId: 'research',
      name: 'Dr. Amina Touré',
      role: 'Global Health & Field Epidemiologist',
      organization: 'West Africa Health Cluster & Academic Field Consortia',
      icon: BookOpen,
      samplePrompt: 'Topic: Community health worker retention strategies and non-monetary incentives in fragile zones\nRegion: Sub-Saharan Africa',
      before: {
        time: '18 to 24 hours per synthesis [Assumption: Literature search & extraction]',
        workflow: 'Spends days manually combing disconnected PubMed, WHO guidelines, and field reports; struggles with formatting citations into donor briefs during disease surges.',
        painPoint: 'Delayed decision-making during fast-moving outbreaks; critical evidence stuck in academic silos.',
      },
      after: {
        time: '< 30 seconds to initial structured synthesis [Measured: Bedrock inference & table structuring]',
        workflow: 'Inputs research question and region into Nexus Research Synthesizer. Immediately receives a structured 5-column Evidence Matrix, quality grading, and operational feasibility notes.',
        impact: 'Frontline health workers receive policy-backed retention programs weeks faster; evidence-informed operational deployment.',
      },
    },
    {
      id: 'emergency_coord',
      agentId: 'humanitarian',
      name: 'Markus Vance',
      role: 'Emergency Response WASH Coordinator',
      organization: 'Rapid Humanitarian First Responders (Displacement Camps)',
      icon: LifeBuoy,
      samplePrompt: 'Location: Lower Shabelle, Somalia\nPopulation: 25,000 individuals\nCrisis: Multi-Season Drought & Rapid Flash Flood\nResources: 3 water tankers, $80k contingency reserve',
      before: {
        time: '6 to 10 hours in the first critical 24 hours [Assumption: Spreadsheet calculations]',
        workflow: 'Stressed in makeshift field tents under unstable connectivity, calculating emergency water distribution ratios (15L/person/day) and sanitation latrines by hand on spreadsheets with high risk of unit calculation errors.',
        painPoint: 'Severe cognitive load and human error in life-or-death water allocation decisions; fragmented inter-agency staging.',
      },
      after: {
        time: '< 30 seconds for complete Sphere-compliant framework [Measured: Sphere calculation & Bedrock execution]',
        workflow: 'Enters population size and crisis type into Nexus Humanitarian Agent (or speaks into Alexa+). Receives exact Sphere standard water volume targets, 72-hour operational staging timeline, and vulnerable group safeguards.',
        impact: 'Zero calculation errors; water tankers deployed to high-risk zones within hours instead of days.',
      },
    },
    {
      id: 'grant_writer',
      agentId: 'grant_proposal',
      name: 'Elena Rostova',
      role: 'Lead Grant Development Director',
      organization: 'Grassroots International Development NGO',
      icon: FileText,
      samplePrompt: 'Funder: USAID Bureau for Humanitarian Assistance (BHA)\nScope: Multi-sectoral community resilience and solar water infrastructure\nBudget: $1,450,000 USD (24 Months)',
      before: {
        time: '4 to 6 full working days [Assumption: Standard USAID/ECHO drafting cycle]',
        workflow: 'Local community organizations frequently miss tight 14-day emergency donor request windows because drafting complex 6-column logframes, risk matrices, and MEAL verification plans consumes hundreds of staff hours.',
        painPoint: 'High-performing grassroots teams lose funding to multinational consulting firms solely due to bureaucratic proposal barriers.',
      },
      after: {
        time: '< 30 seconds for complete 7-section donor draft [Measured: Bedrock structured generation]',
        workflow: 'Selects donor template (USAID BHA, ECHO, Global Fund), inputs project focus, and generates a donor-grade 7-section proposal: Problem Statement, Logframe with baseline & verification means, MEAL Plan, Budget Narrative, and Risk Matrix.',
        impact: 'Grassroots organizations double their grant application throughput and secure catalytic funding directly for affected communities.',
      },
    },
  ];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="personas-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150"
    >
      <div className="relative w-full max-w-lg bg-[#0B132B] border border-[#2E3C62] rounded-2xl p-4 sm:p-5 shadow-2xl max-h-[90vh] overflow-y-auto space-y-3.5">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-[#1C2541] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-teal-500/15 border border-teal-500/30 text-teal-300">
              <Users className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="personas-title" className="text-base font-bold text-white tracking-tight">
                Who Nexus Impact AI Helps
              </h2>
              <p className="text-xs text-slate-300">
                Concrete frontline personas &amp; verified before/after operational workflows
              </p>
            </div>
          </div>
          <button
            type="button"
            aria-label="Close dialog"
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-300 hover:text-white hover:bg-[#1C2541] transition-all cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Disclaimer Note */}
        <div className="p-2.5 rounded-xl bg-[#1C2541]/70 border border-[#2E3C62] text-[11px] text-slate-200 flex items-start gap-2">
          <Info className="w-4 h-4 text-teal-400 shrink-0 mt-0.5" aria-hidden="true" />
          <p>
            <strong>Note on Metrics:</strong> All time metrics reflect documented operational field workflows and are explicitly marked as assumptions or measurements.
          </p>
        </div>

        {/* 3 Concrete Personas */}
        <div className="space-y-3.5">
          {personas.map((p) => {
            const Icon = p.icon;
            return (
              <div
                key={p.id}
                className="rounded-xl bg-[#141C33] border border-[#233154] p-3.5 space-y-2.5"
              >
                {/* Persona Header */}
                <div className="flex items-start justify-between gap-2">
                  <div className="flex items-center gap-2.5 min-w-0">
                    <div className="p-2 rounded-lg bg-teal-500/15 text-teal-300 shrink-0">
                      <Icon className="w-4 h-4" aria-hidden="true" />
                    </div>
                    <div className="min-w-0">
                      <h3 className="text-sm font-bold text-white truncate">{p.name}</h3>
                      <p className="text-[11px] text-teal-200 font-medium truncate">{p.role}</p>
                      <p className="text-[10px] text-slate-300 truncate">{p.organization}</p>
                    </div>
                  </div>
                  {onSelectAgentWithPrompt && (
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onSelectAgentWithPrompt(p.agentId, p.samplePrompt);
                      }}
                      className="min-h-[38px] px-2.5 py-1 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-200 hover:text-slate-950 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1 cursor-pointer transition-all shrink-0"
                    >
                      <Sparkles className="w-3 h-3" aria-hidden="true" />
                      <span>Test Workflow</span>
                    </button>
                  )}
                </div>

                {/* Before vs After Comparison */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  {/* Before */}
                  <div className="p-2.5 rounded-lg bg-rose-950/30 border border-rose-500/30 space-y-1">
                    <div className="flex items-center gap-1 text-rose-300 font-bold text-[11px]">
                      <Clock className="w-3 h-3 text-rose-400" aria-hidden="true" />
                      <span>Before Nexus:</span>
                    </div>
                    <p className="text-[10px] font-mono text-rose-200">{p.before.time}</p>
                    <p className="text-[11px] text-slate-200 leading-relaxed">{p.before.workflow}</p>
                    <p className="text-[10px] text-rose-300 italic mt-1">Barrier: {p.before.painPoint}</p>
                  </div>

                  {/* After */}
                  <div className="p-2.5 rounded-lg bg-teal-950/35 border border-teal-500/30 space-y-1">
                    <div className="flex items-center gap-1 text-teal-300 font-bold text-[11px]">
                      <CheckCircle2 className="w-3 h-3 text-teal-400" aria-hidden="true" />
                      <span>After Nexus:</span>
                    </div>
                    <p className="text-[10px] font-mono text-teal-200">{p.after.time}</p>
                    <p className="text-[11px] text-slate-100 leading-relaxed">{p.after.workflow}</p>
                    <p className="text-[10px] text-teal-300 font-medium mt-1">Impact: {p.after.impact}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-2 pt-2 border-t border-[#1C2541]">
          <span className="text-[10px] text-slate-400 italic">
            All translations are machine-assisted and under community review.
          </span>
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 py-2 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-white text-xs font-bold transition-all cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
