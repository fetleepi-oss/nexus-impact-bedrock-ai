/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  Sparkles,
  Crown,
  CheckCircle2,
  Info,
  Cloud,
  Calculator,
  Radio,
  Users,
  Zap,
  Play
} from 'lucide-react';
import { AGENTS, AgentConfig, getAgentById } from './agents';
import {
  isProEntitled,
  isDemoModeActive,
  getRemainingFreeGenerations,
  FREE_DAILY_LIMIT
} from './limits';
import { getKnowledgeItems, KnowledgeItem } from './knowledgeBase';
import { getQueuedRequests } from './offlineStorage';
import { Header } from './components/Header';
import { BottomNav, NavTab } from './components/BottomNav';
import { AgentCard } from './components/AgentCard';
import { AgentWorkspace } from './components/AgentWorkspace';
import { KnowledgeBaseTab } from './components/KnowledgeBaseTab';
import { PaywallModal } from './components/PaywallModal';
import { AwsArchitectureTab } from './components/AwsArchitectureTab';
import { SphereToolsTab } from './components/SphereToolsTab';
import { AlexaSimulatorTab } from './components/AlexaSimulatorTab';
import { WhoThisHelpsModal } from './components/WhoThisHelpsModal';
import { OnDeviceModelModal } from './components/OnDeviceModelModal';
import { OfflineKnowledgePackModal } from './components/OfflineKnowledgePackModal';
import { OfflineVaultModal } from './components/OfflineVaultModal';
import { EvaluationTab } from './components/EvaluationTab';
import { AuditTrailModal } from './components/AuditTrailModal';
import { ImpactTrackerModal } from './components/ImpactTrackerModal';
import { LegalPoliciesModal } from './components/LegalPoliciesModal';
import { StorageConsentBanner } from './components/StorageConsentBanner';
import { SelfTestModal } from './components/SelfTestModal';
import { runAutoClearHistory } from './offlineStorage';

export default function App() {
  const [activeTab, setActiveTab] = useState<NavTab>('agents');
  const [selectedAgent, setSelectedAgent] = useState<AgentConfig>(AGENTS[0]);
  const [activeWorkspacePrompt, setActiveWorkspacePrompt] = useState<string>('');
  const [attachedKbItem, setAttachedKbItem] = useState<KnowledgeItem | null>(null);

  // AWS Bedrock Model Selection
  const [selectedModel, setSelectedModel] = useState<string>('');
  const [configuredModelId, setConfiguredModelId] = useState<string>('');
  const [configuredRegion, setConfiguredRegion] = useState<string>('us-east-1');

  // Tier & Usage state
  const [isPro, setIsPro] = useState<boolean>(true); // Default true under UNLOCK_ALL_AGENTS
  const [remainingGenerations, setRemainingGenerations] = useState<number>(FREE_DAILY_LIMIT);

  // Knowledge Base state
  const [knowledgeItems, setKnowledgeItems] = useState<KnowledgeItem[]>([]);
  const [queuedRequestsCount, setQueuedRequestsCount] = useState<number>(0);

  // State to immediately auto-execute 1-click sample scenario
  const [autoExecuteTrigger, setAutoExecuteTrigger] = useState<number>(0);

  // Modals state
  const [isPaywallOpen, setIsPaywallOpen] = useState<boolean>(false);
  const [pendingProAgent, setPendingProAgent] = useState<AgentConfig | null>(null);
  const [isWhoThisHelpsOpen, setIsWhoThisHelpsOpen] = useState<boolean>(false);
  const [isOnDeviceModalOpen, setIsOnDeviceModalOpen] = useState<boolean>(false);
  const [isKnowledgePackModalOpen, setIsKnowledgePackModalOpen] = useState<boolean>(false);
  const [isOfflineVaultModalOpen, setIsOfflineVaultModalOpen] = useState<boolean>(false);
  const [isAuditTrailOpen, setIsAuditTrailOpen] = useState<boolean>(false);
  const [isImpactTrackerOpen, setIsImpactTrackerOpen] = useState<boolean>(false);
  const [isLegalModalOpen, setIsLegalModalOpen] = useState<boolean>(false);
  const [isSelfTestOpen, setIsSelfTestOpen] = useState<boolean>(false);

  // Filter for agents home tab
  const [agentFilter, setAgentFilter] = useState<'all' | 'free' | 'pro'>('all');

  useEffect(() => {
    setIsPro(isProEntitled());
    setRemainingGenerations(getRemainingFreeGenerations());
    setKnowledgeItems(getKnowledgeItems());

    // Fetch server health to get live configured Bedrock model ID and region
    fetch('/api/health')
      .then((r) => r.json())
      .then((data) => {
        if (data.bedrockModelId) {
          setConfiguredModelId(data.bedrockModelId);
          setSelectedModel(data.bedrockModelId);
        }
        if (data.region) {
          setConfiguredRegion(data.region);
        }
      })
      .catch(() => {});

    // Auto-clear history if setting is 1h or 1d
    runAutoClearHistory();

    if (typeof window !== 'undefined' && (window.location.pathname === '/selftest' || window.location.hash === '#selftest')) {
      setIsSelfTestOpen(true);
    }

    const updateQueuedCount = async () => {
      const q = await getQueuedRequests();
      setQueuedRequestsCount(q.length);
    };
    updateQueuedCount();

    const handleLimitsUpdated = () => {
      setRemainingGenerations(getRemainingFreeGenerations());
    };
    const handleEntitlementUpdated = () => {
      setIsPro(isProEntitled());
    };
    const handleKbUpdated = (e: any) => {
      if (e.detail) {
        setKnowledgeItems(e.detail);
      } else {
        setKnowledgeItems(getKnowledgeItems());
      }
    };
    const handleQueueUpdated = () => {
      updateQueuedCount();
    };

    window.addEventListener('nexus_limits_updated', handleLimitsUpdated);
    window.addEventListener('nexus_entitlement_updated', handleEntitlementUpdated);
    window.addEventListener('nexus_kb_updated', handleKbUpdated);
    window.addEventListener('nexus_offline_queue_updated', handleQueueUpdated);

    return () => {
      window.removeEventListener('nexus_limits_updated', handleLimitsUpdated);
      window.removeEventListener('nexus_entitlement_updated', handleEntitlementUpdated);
      window.removeEventListener('nexus_kb_updated', handleKbUpdated);
      window.removeEventListener('nexus_offline_queue_updated', handleQueueUpdated);
    };
  }, []);

  const handleSelectAgent = (agent: AgentConfig, customPrompt?: string) => {
    if (agent.id === 'knowledge_base') {
      setActiveTab('knowledge');
      return;
    }
    if (agent.tier === 'pro' && !isPro && !isDemoModeActive()) {
      setPendingProAgent(agent);
      setIsPaywallOpen(true);
      return;
    }
    setSelectedAgent(agent);
    if (customPrompt) {
      setActiveWorkspacePrompt(customPrompt);
    } else {
      setActiveWorkspacePrompt(agent.sampleScenario?.fullPrompt || agent.samplePrompts[0] || '');
    }
    setActiveTab('workspace');
  };

  const handleRunSampleScenario = (agent: AgentConfig) => {
    setSelectedAgent(agent);
    const scenarioPrompt = agent.sampleScenario?.fullPrompt || agent.samplePrompts[0] || '';
    setActiveWorkspacePrompt(scenarioPrompt);
    setAutoExecuteTrigger(Date.now());
    setActiveTab('workspace');
  };

  const handleReuseAsContext = (item: KnowledgeItem, targetAgentId?: string) => {
    const target = getAgentById(targetAgentId || item.agentId) || AGENTS[0];
    if (target.tier === 'pro' && !isPro && !isDemoModeActive()) {
      setPendingProAgent(target);
      setIsPaywallOpen(true);
      return;
    }
    setSelectedAgent(target);
    setAttachedKbItem(item);
    setActiveTab('workspace');
  };

  const handleLaunchHumanitarianFromSphere = (population: string, calculatedSummary: string) => {
    const humanitarianAgent = getAgentById('humanitarian') || AGENTS[1];
    setSelectedAgent(humanitarianAgent);
    setActiveWorkspacePrompt(`Crisis Type: Flash Flood\nLocation: Lower Shabelle, Somalia\nPopulation Size: ${population}\n${calculatedSummary}`);
    setActiveTab('workspace');
  };

  const handlePaywallSuccess = () => {
    setIsPro(true);
    setIsPaywallOpen(false);
    if (pendingProAgent) {
      setSelectedAgent(pendingProAgent);
      setActiveWorkspacePrompt(pendingProAgent.sampleScenario?.fullPrompt || pendingProAgent.samplePrompts[0] || '');
      setPendingProAgent(null);
      setActiveTab('workspace');
    }
  };

  const filteredAgents = AGENTS.filter((agent) => {
    if (agentFilter === 'free') return agent.tier === 'free';
    if (agentFilter === 'pro') return agent.tier === 'pro';
    return true;
  });

  return (
    <div className="min-h-screen bg-[#0B132B] text-slate-100 font-sans antialiased flex flex-col selection:bg-teal-500 selection:text-slate-950 w-full overflow-x-hidden">
      {/* Top Header */}
      <Header
        remainingGenerations={remainingGenerations}
        isPro={isPro}
        onOpenPaywall={() => setIsPaywallOpen(true)}
        onOpenAwsTab={() => setActiveTab('aws')}
        onOpenAlexaTab={() => setActiveTab('alexa')}
        onOpenWhoThisHelps={() => setIsWhoThisHelpsOpen(true)}
        onOpenModelManager={() => setIsOnDeviceModalOpen(true)}
        onOpenKnowledgePack={() => setIsKnowledgePackModalOpen(true)}
        onOpenOfflineVault={() => setIsOfflineVaultModalOpen(true)}
        onOpenAuditTrail={() => setIsAuditTrailOpen(true)}
        onOpenImpactTracker={() => setIsImpactTrackerOpen(true)}
        onOpenEvaluations={() => setActiveTab('eval')}
        onOpenLegalModal={() => setIsLegalModalOpen(true)}
        onOpenSelfTest={() => setIsSelfTestOpen(true)}
        selectedModel={selectedModel}
      />

      {/* Main Content Area: Responsive at 360px+ */}
      <main className="flex-1 max-w-md w-full mx-auto px-2.5 sm:px-4 py-3">
        {/* TAB 1: AGENTS DIRECTORY (HOME) */}
        {activeTab === 'agents' && (
          <div className="space-y-3.5 pb-24">
            {/* Mission Hero Banner */}
            <div className="rounded-2xl bg-gradient-to-br from-[#1C2541] to-[#121A30] border border-[#2E3C62] p-4 shadow-sm relative overflow-hidden">
              <div className="relative z-10 space-y-2">
                <div className="flex items-center justify-between gap-1 flex-wrap">
                  <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-200 text-[10px] font-bold font-mono">
                    <Sparkles className="w-3 h-3 text-teal-300" aria-hidden="true" />
                    <span>Amazon Bedrock &middot; MCP (2025-11-25)</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setIsWhoThisHelpsOpen(true)}
                      className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <Users className="w-3 h-3" aria-hidden="true" />
                      <span>Personas</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('alexa')}
                      className="text-[11px] font-mono text-cyan-300 hover:text-cyan-200 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <Radio className="w-3 h-3" aria-hidden="true" />
                      <span>Alexa+</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => setActiveTab('aws')}
                      className="text-[11px] font-mono text-amber-300 hover:text-amber-200 flex items-center gap-1 cursor-pointer focus-visible:ring-2 focus-visible:ring-teal-400"
                    >
                      <Cloud className="w-3 h-3" aria-hidden="true" />
                      <span>AWS</span>
                    </button>
                  </div>
                </div>

                <h1 className="text-lg font-black tracking-tight text-white">
                  Nexus Impact AI Agents
                </h1>
                <p className="text-xs text-slate-200 leading-relaxed">
                  Specialized social-impact AI agents for research synthesis, emergency humanitarian response, epidemiology, and donor proposals. Works online and offline.
                </p>

                {/* Free quota indicator & Judge demo banner */}
                <div className="pt-2 flex items-center justify-between text-[11px] text-slate-300 border-t border-[#2E3C62] gap-2 flex-wrap">
                  <span className="flex items-center gap-1.5 font-medium">
                    <span className="w-2 h-2 rounded-full bg-teal-400" />
                    <span>Judge Access: <strong className="text-white">Demo Mode Active (All 7 Unlocked)</strong></span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveTab('alexa')}
                    className="text-cyan-300 hover:text-cyan-200 font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Radio className="w-3 h-3" aria-hidden="true" />
                    <span>Alexa+ Simulator</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Category Filter Pills (Large Touch Targets >= 44px) */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
              <button
                type="button"
                onClick={() => setAgentFilter('all')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                  agentFilter === 'all'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-[#1C2541] text-slate-200 hover:text-white border border-[#2E3C62]'
                }`}
              >
                All 7 Agents
              </button>
              <button
                type="button"
                onClick={() => setAgentFilter('free')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer select-none ${
                  agentFilter === 'free'
                    ? 'bg-teal-500 text-slate-950 shadow-sm'
                    : 'bg-[#1C2541] text-slate-200 hover:text-white border border-[#2E3C62]'
                }`}
              >
                Free Tier (4)
              </button>
              <button
                type="button"
                onClick={() => setAgentFilter('pro')}
                className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-1.5 ${
                  agentFilter === 'pro'
                    ? 'bg-amber-400 text-slate-950 shadow-sm'
                    : 'bg-[#1C2541] text-slate-200 hover:text-white border border-[#2E3C62]'
                }`}
              >
                <Crown className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
                <span>Pro Agents (3)</span>
              </button>
            </div>

            {/* Agent Cards Grid with 1-Click Scenarios */}
            <div className="space-y-3">
              {filteredAgents.map((agent) => {
                const isLocked = agent.tier === 'pro' && !isPro && !isDemoModeActive();
                return (
                  <AgentCard
                    key={agent.id}
                    agent={agent}
                    isLocked={isLocked}
                    onSelect={(ag) => handleSelectAgent(ag)}
                    onSelectPrompt={(ag, pr) => handleSelectAgent(ag, pr)}
                    onRunSampleScenario={(ag) => handleRunSampleScenario(ag)}
                  />
                );
              })}
            </div>
          </div>
        )}

        {/* TAB 2: WORKSPACE (ACTIVE GENERATOR & STRUCTURED OUTPUT VIEW) */}
        {activeTab === 'workspace' && (
          <AgentWorkspace
            agent={selectedAgent}
            isPro={isPro}
            initialPrompt={activeWorkspacePrompt}
            autoExecuteTrigger={autoExecuteTrigger}
            attachedKbItem={attachedKbItem}
            onDetachKbItem={() => setAttachedKbItem(null)}
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onBack={() => setActiveTab('agents')}
            onOpenPaywall={() => {
              setPendingProAgent(selectedAgent);
              setIsPaywallOpen(true);
            }}
            onSavedToKnowledgeBase={() => {
              setKnowledgeItems(getKnowledgeItems());
            }}
          />
        )}

        {/* TAB 3: ALEXA+ VOICE & STREAMABLE HTTP MCP SIMULATOR */}
        {activeTab === 'alexa' && (
          <AlexaSimulatorTab />
        )}

        {/* TAB 4: SPHERE TOOLS (RAPID EMERGENCY CALCULATOR) */}
        {activeTab === 'sphere' && (
          <SphereToolsTab
            onLaunchHumanitarianWithParams={handleLaunchHumanitarianFromSphere}
            onSavedToKnowledgeBase={() => {
              setKnowledgeItems(getKnowledgeItems());
            }}
          />
        )}

        {/* TAB 5: KNOWLEDGE BASE (SAVED ITEMS & EXPORT) */}
        {activeTab === 'knowledge' && (
          <KnowledgeBaseTab
            items={knowledgeItems}
            onOpenAgentWithPrompt={(agentId, pr) => {
              const target = getAgentById(agentId) || AGENTS[0];
              handleSelectAgent(target, pr);
            }}
            onReuseAsContext={handleReuseAsContext}
            onRefreshItems={() => {
              setKnowledgeItems(getKnowledgeItems());
            }}
          />
        )}

        {/* TAB 6: AWS CLOUD & MCP ARCHITECTURE */}
        {activeTab === 'aws' && (
          <AwsArchitectureTab
            selectedModel={selectedModel}
            onSelectModel={setSelectedModel}
            onNavigateToWorkspaceWithTool={(toolName, input) => {
              const target = toolName.includes('grant')
                ? getAgentById('grant_proposal')
                : toolName.includes('humanitarian')
                ? getAgentById('humanitarian')
                : getAgentById('research');
              if (target) {
                handleSelectAgent(target, input);
              }
            }}
          />
        )}

        {/* TAB 7: EMPIRICAL BENCHMARK EVALUATIONS */}
        {activeTab === 'eval' && (
          <EvaluationTab
            selectedModel={selectedModel}
          />
        )}
      </main>

      {/* Modals */}
      <WhoThisHelpsModal
        isOpen={isWhoThisHelpsOpen}
        onClose={() => setIsWhoThisHelpsOpen(false)}
        onSelectAgentWithPrompt={(agentId, pr) => {
          const target = getAgentById(agentId);
          if (target) {
            handleSelectAgent(target, pr);
          }
        }}
      />

      <PaywallModal
        isOpen={isPaywallOpen}
        onClose={() => {
          setIsPaywallOpen(false);
          setPendingProAgent(null);
        }}
        onSuccess={handlePaywallSuccess}
        targetAgentName={pendingProAgent?.name}
        isProActive={isPro}
      />

      <OnDeviceModelModal
        isOpen={isOnDeviceModalOpen}
        onClose={() => setIsOnDeviceModalOpen(false)}
      />

      <OfflineKnowledgePackModal
        isOpen={isKnowledgePackModalOpen}
        onClose={() => setIsKnowledgePackModalOpen(false)}
      />

      <OfflineVaultModal
        isOpen={isOfflineVaultModalOpen}
        onClose={() => setIsOfflineVaultModalOpen(false)}
        onSelectCachedItem={(item) => {
          const target = getAgentById(item.agentId);
          if (target) {
            setSelectedAgent(target);
            setActiveWorkspacePrompt(item.prompt);
            setActiveTab('workspace');
            setIsOfflineVaultModalOpen(false);
          }
        }}
      />

      <AuditTrailModal
        isOpen={isAuditTrailOpen}
        onClose={() => setIsAuditTrailOpen(false)}
      />

      <ImpactTrackerModal
        isOpen={isImpactTrackerOpen}
        onClose={() => setIsImpactTrackerOpen(false)}
      />

      <LegalPoliciesModal
        isOpen={isLegalModalOpen}
        onClose={() => setIsLegalModalOpen(false)}
      />

      <SelfTestModal
        isOpen={isSelfTestOpen}
        onClose={() => setIsSelfTestOpen(false)}
      />

      <StorageConsentBanner
        onOpenLegalModal={() => setIsLegalModalOpen(true)}
      />

      {/* Bottom Tab Bar */}
      <BottomNav
        activeTab={activeTab}
        onChangeTab={(t) => setActiveTab(t)}
        knowledgeCount={knowledgeItems.length}
        hasActiveAgent={Boolean(selectedAgent)}
        isPro={isPro}
        queuedRequestsCount={queuedRequestsCount}
      />
    </div>
  );
}
