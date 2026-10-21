/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import { Layers, Terminal, Radio, Calculator, Cloud, Award } from 'lucide-react';
import { t } from '../i18n';

export type NavTab = 'agents' | 'workspace' | 'alexa' | 'sphere' | 'knowledge' | 'aws' | 'eval';

interface BottomNavProps {
  activeTab: NavTab;
  onChangeTab: (tab: NavTab) => void;
  knowledgeCount: number;
  hasActiveAgent: boolean;
  queuedRequestsCount?: number;
}

export const BottomNav: React.FC<BottomNavProps> = ({
  activeTab,
  onChangeTab,
  hasActiveAgent,
  queuedRequestsCount = 0,
}) => {
  return (
    <nav
      role="navigation"
      aria-label="Bottom Navigation"
      className="fixed bottom-0 left-0 right-0 z-30 bg-[#0B132B]/95 backdrop-blur-lg border-t border-[#1C2541] safe-area-pb"
    >
      <div className="max-w-md mx-auto grid grid-cols-6 h-16 px-0.5">
        {/* Tab 1: Agents */}
        <button
          type="button"
          onClick={() => onChangeTab('agents')}
          aria-label="Agents Catalog Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'agents'
              ? 'text-teal-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Layers className={`w-4.5 h-4.5 ${activeTab === 'agents' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">{t('agentsTab')}</span>
        </button>

        {/* Tab 2: Workspace */}
        <button
          type="button"
          onClick={() => onChangeTab('workspace')}
          aria-label="Agent Workspace Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'workspace'
              ? 'text-teal-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Terminal className={`w-4.5 h-4.5 ${activeTab === 'workspace' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
            {hasActiveAgent && activeTab !== 'workspace' && (
              <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-teal-400 animate-pulse" />
            )}
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">{t('workspaceTab')}</span>
        </button>

        {/* Tab 3: Alexa+ Voice & MCP Simulator */}
        <button
          type="button"
          onClick={() => onChangeTab('alexa')}
          aria-label="Alexa Voice Simulator Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'alexa'
              ? 'text-cyan-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Radio className={`w-4.5 h-4.5 ${activeTab === 'alexa' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-cyan-400" />
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">Alexa+</span>
        </button>

        {/* Tab 4: Sphere Tools */}
        <button
          type="button"
          onClick={() => onChangeTab('sphere')}
          aria-label="Sphere Standards Calculator Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'sphere'
              ? 'text-teal-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Calculator className={`w-4.5 h-4.5 ${activeTab === 'sphere' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
            {queuedRequestsCount > 0 && (
              <span className="absolute -top-1 -right-2 px-1 py-0.2 rounded-full bg-amber-400 text-slate-950 text-[8px] font-bold min-w-3.5 text-center">
                {queuedRequestsCount}
              </span>
            )}
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">Sphere</span>
        </button>

        {/* Tab 5: Built-in Empirical Evaluations */}
        <button
          type="button"
          onClick={() => onChangeTab('eval')}
          aria-label="Evaluations Benchmark Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'eval'
              ? 'text-amber-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Award className={`w-4.5 h-4.5 ${activeTab === 'eval' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
            <span className="absolute -top-1 -right-1 w-1.5 h-1.5 rounded-full bg-amber-400" />
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">{t('evalTab')}</span>
        </button>

        {/* Tab 6: Technical Architecture */}
        <button
          type="button"
          onClick={() => onChangeTab('aws')}
          aria-label="Architecture Tab"
          className={`flex flex-col items-center justify-center gap-1 transition-all min-h-[48px] select-none cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 ${
            activeTab === 'aws'
              ? 'text-teal-300 font-bold'
              : 'text-slate-300 hover:text-white'
          }`}
        >
          <div className="relative">
            <Layers className={`w-4.5 h-4.5 ${activeTab === 'aws' ? 'stroke-[2.5]' : 'stroke-2'}`} aria-hidden="true" />
          </div>
          <span className="text-[9px] tracking-tight truncate max-w-full">Arch</span>
        </button>
      </div>
    </nav>
  );
};
