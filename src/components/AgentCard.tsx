/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';
import {
  BookOpen,
  LifeBuoy,
  Activity,
  Database,
  FileText,
  Scale,
  HeartHandshake,
  Lock,
  Sparkles,
  ArrowRight,
  Crown,
  Play,
  Zap,
  CheckCircle2
} from 'lucide-react';
import { AgentConfig } from '../agents';
import { isDemoModeActive } from '../limits';

interface AgentCardProps {
  agent: AgentConfig;
  isLocked: boolean;
  onSelect: (agent: AgentConfig) => void;
  onSelectPrompt?: (agent: AgentConfig, prompt: string) => void;
  onRunSampleScenario?: (agent: AgentConfig) => void;
}

export const AgentCard: React.FC<AgentCardProps> = ({
  agent,
  isLocked,
  onSelect,
  onSelectPrompt,
  onRunSampleScenario
}) => {
  const isDemo = isDemoModeActive();
  const effectivelyLocked = isLocked && !isDemo;

  const renderIcon = () => {
    const iconClass = `w-5 h-5 ${
      agent.tier === 'pro' ? 'text-amber-300' : 'text-teal-300'
    }`;
    switch (agent.iconName) {
      case 'BookOpen':
        return <BookOpen className={iconClass} aria-hidden="true" />;
      case 'LifeBuoy':
        return <LifeBuoy className={iconClass} aria-hidden="true" />;
      case 'Activity':
        return <Activity className={iconClass} aria-hidden="true" />;
      case 'Database':
        return <Database className={iconClass} aria-hidden="true" />;
      case 'FileText':
        return <FileText className={iconClass} aria-hidden="true" />;
      case 'Scale':
        return <Scale className={iconClass} aria-hidden="true" />;
      case 'HeartHandshake':
        return <HeartHandshake className={iconClass} aria-hidden="true" />;
      default:
        return <Sparkles className={iconClass} aria-hidden="true" />;
    }
  };

  return (
    <div
      tabIndex={0}
      role="article"
      aria-label={`${agent.name} - ${agent.category}`}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ') {
          e.preventDefault();
          onSelect(agent);
        }
      }}
      onClick={() => onSelect(agent)}
      className={`rounded-2xl p-4 transition-all border relative flex flex-col justify-between cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400 focus-visible:outline-none select-none ${
        effectivelyLocked
          ? 'bg-[#1C2541]/50 border-amber-500/30 hover:border-amber-500/50'
          : 'bg-[#1C2541]/90 hover:bg-[#1C2541] border-[#2E3C62] hover:border-teal-400/50 shadow-md'
      }`}
    >
      <div>
        {/* Header with icon and badges */}
        <div className="flex items-start justify-between gap-2 mb-2.5">
          <div className="flex items-center gap-3 min-w-0">
            <div
              className={`w-10 h-10 rounded-xl flex items-center justify-center border shrink-0 ${
                agent.tier === 'pro'
                  ? 'bg-amber-500/15 border-amber-500/30'
                  : 'bg-teal-500/15 border-teal-500/30'
              }`}
            >
              {renderIcon()}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-white tracking-tight leading-snug truncate">
                {agent.name}
              </h3>
              <span className="text-[11px] text-teal-300 font-medium">
                {agent.category}
              </span>
            </div>
          </div>

          {/* Tier badge */}
          {agent.tier === 'pro' ? (
            <span
              className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold border shrink-0 ${
                isDemo
                  ? 'bg-teal-500/20 text-teal-200 border-teal-500/40'
                  : effectivelyLocked
                  ? 'bg-amber-500/10 border-amber-500/30 text-amber-300'
                  : 'bg-amber-400 text-slate-950 border-amber-400 font-extrabold'
              }`}
            >
              {isDemo ? (
                <>
                  <CheckCircle2 className="w-3 h-3 text-teal-300" aria-hidden="true" />
                  <span>DEMO UNLOCKED</span>
                </>
              ) : effectivelyLocked ? (
                <>
                  <Lock className="w-2.5 h-2.5 text-amber-400" aria-hidden="true" />
                  <span>PRO LOCKED</span>
                </>
              ) : (
                <>
                  <Crown className="w-2.5 h-2.5 fill-slate-950" aria-hidden="true" />
                  <span>PRO ACTIVE</span>
                </>
              )}
            </span>
          ) : (
            <span className="inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-bold bg-teal-500/15 border border-teal-500/30 text-teal-200 shrink-0">
              FREE TIER
            </span>
          )}
        </div>

        {/* Description */}
        <p className="text-xs text-slate-200 leading-relaxed mb-3">
          {agent.description}
        </p>

        {/* 1-Click Sample Scenario Box for Judges */}
        {agent.sampleScenario && (
          <div className="mb-3 p-2.5 rounded-xl bg-[#0B132B]/80 border border-teal-500/30 hover:border-teal-400 transition-colors">
            <div className="flex items-center justify-between text-[10px] font-mono text-teal-300 mb-1">
              <span className="flex items-center gap-1 font-bold">
                <Zap className="w-3 h-3 text-amber-400 fill-amber-400" aria-hidden="true" />
                <span>1-Click Sample Scenario</span>
              </span>
              <span className="text-slate-300 font-bold">&lt; 30s Result</span>
            </div>
            <div className="text-xs font-bold text-white mb-0.5">
              {agent.sampleScenario.title}
            </div>
            <p className="text-[11px] text-slate-300 leading-snug line-clamp-2 mb-2">
              {agent.sampleScenario.shortDescription}
            </p>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                if (onRunSampleScenario) {
                  onRunSampleScenario(agent);
                } else if (onSelectPrompt) {
                  onSelectPrompt(agent, agent.sampleScenario.fullPrompt);
                } else {
                  onSelect(agent);
                }
              }}
              className="w-full min-h-[38px] px-3 py-1.5 rounded-lg bg-teal-500/20 hover:bg-teal-500 text-teal-200 hover:text-slate-950 border border-teal-500/40 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer shadow-xs active:scale-[0.98]"
            >
              <Play className="w-3 h-3 fill-current" aria-hidden="true" />
              <span>Run Sample Scenario Now</span>
            </button>
          </div>
        )}
      </div>

      {/* Action Footer */}
      <div className="pt-2 border-t border-[#2E3C62] flex items-center justify-between text-xs gap-2">
        <span className="text-[11px] text-slate-300 font-medium truncate">
          {isDemo
            ? 'All features unlocked (Demo Mode)'
            : effectivelyLocked
            ? 'Requires Nexus Pro'
            : 'Ready to run'}
        </span>
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onSelect(agent);
          }}
          className={`min-h-[44px] px-4 py-2 rounded-xl font-bold flex items-center gap-1.5 transition-all text-xs cursor-pointer shrink-0 ${
            effectivelyLocked
              ? 'bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/40 text-amber-200'
              : 'bg-teal-500 hover:bg-teal-400 text-slate-950 font-extrabold shadow-sm'
          }`}
        >
          {effectivelyLocked ? (
            <>
              <Lock className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Unlock Agent</span>
            </>
          ) : (
            <>
              <span>Open Workspace</span>
              <ArrowRight className="w-3.5 h-3.5" aria-hidden="true" />
            </>
          )}
        </button>
      </div>
    </div>
  );
};
