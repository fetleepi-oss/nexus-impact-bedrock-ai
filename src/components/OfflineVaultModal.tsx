/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  HardDrive,
  X,
  Search,
  Download,
  Trash2,
  RefreshCw,
  Cloud,
  Clock,
  CheckCircle2,
  FileText,
  Wifi,
  WifiOff
} from 'lucide-react';
import {
  CachedAgentOutput,
  QueuedOfflineRequest,
  searchCachedOutputs,
  deleteCachedOutput,
  getQueuedRequests,
  removeQueuedRequest,
  reRunSingleQueuedRequest,
  drainOfflineQueue,
  exportCachedItemToMarkdown,
  exportAllCachedItemsToMarkdown,
  isAppOnline,
  setSimulatedOffline
} from '../offlineStorage';

interface OfflineVaultModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectCachedItem?: (item: CachedAgentOutput) => void;
}

export const OfflineVaultModal: React.FC<OfflineVaultModalProps> = ({
  isOpen,
  onClose,
  onSelectCachedItem,
}) => {
  const [activeTab, setActiveTab] = useState<'archive' | 'queue'>('archive');
  const [searchQuery, setSearchQuery] = useState('');
  const [modelFilter, setModelFilter] = useState<'all' | 'cloud' | 'on_device'>('all');
  const [cachedOutputs, setCachedOutputs] = useState<CachedAgentOutput[]>([]);
  const [queuedRequests, setQueuedRequests] = useState<QueuedOfflineRequest[]>([]);
  const [selectedOutput, setSelectedOutput] = useState<CachedAgentOutput | null>(null);
  const [isDraining, setIsDraining] = useState(false);
  const [reRunningId, setReRunningId] = useState<string | null>(null);
  const [reRunMessage, setReRunMessage] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(isAppOnline());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const loadData = async () => {
    const outputs = await searchCachedOutputs(searchQuery, { modelCategory: modelFilter });
    setCachedOutputs(outputs);
    const queue = await getQueuedRequests();
    setQueuedRequests(queue);
    setIsOnline(isAppOnline());
  };

  useEffect(() => {
    if (isOpen) {
      loadData();
    }
    const handleCacheUpdate = () => loadData();
    const handleQueueUpdate = () => loadData();
    const handleNetChange = () => setIsOnline(isAppOnline());

    window.addEventListener('nexus_offline_cache_updated', handleCacheUpdate);
    window.addEventListener('nexus_offline_queue_updated', handleQueueUpdate);
    window.addEventListener('nexus_network_status_changed', handleNetChange);

    return () => {
      window.removeEventListener('nexus_offline_cache_updated', handleCacheUpdate);
      window.removeEventListener('nexus_offline_queue_updated', handleQueueUpdate);
      window.removeEventListener('nexus_network_status_changed', handleNetChange);
    };
  }, [isOpen, searchQuery, modelFilter]);

  if (!isOpen) return null;

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await deleteCachedOutput(id);
    if (selectedOutput?.id === id) setSelectedOutput(null);
    loadData();
  };

  const handleReRunSingle = async (requestId: string) => {
    if (!isAppOnline()) {
      setReRunMessage('Cannot re-run with Bedrock while offline. Please toggle online mode first.');
      return;
    }
    setReRunningId(requestId);
    setReRunMessage(null);
    const result = await reRunSingleQueuedRequest(requestId);
    setReRunningId(null);
    if (result.success) {
      setReRunMessage('Successfully re-run with Amazon Bedrock! Result saved to Archive.');
      loadData();
    } else {
      setReRunMessage(result.error || 'Failed to re-run request with Bedrock');
    }
  };

  const handleDrainAll = async () => {
    if (!isAppOnline()) {
      setReRunMessage('Cannot drain queue while offline.');
      return;
    }
    setIsDraining(true);
    setReRunMessage(null);
    const result = await drainOfflineQueue();
    setIsDraining(false);
    setReRunMessage(`Processed ${result.processed} requests with Amazon Bedrock.`);
    loadData();
  };

  const pendingCount = queuedRequests.filter((r) => r.status === 'pending').length;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="vault-modal-title"
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-5 animate-fade-in"
    >
      <div className="bg-[#1C2541] border border-[#2E3C62] rounded-3xl w-full max-w-5xl h-[88vh] flex flex-col shadow-2xl overflow-hidden relative text-slate-100">
        {/* Top Header */}
        <div className="p-4 sm:p-5 border-b border-[#2E3C62] flex items-center justify-between bg-[#0B132B]">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-500/20 border border-amber-500/40 text-amber-300 flex items-center justify-center font-bold">
              <HardDrive className="w-5 h-5" aria-hidden="true" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 id="vault-modal-title" className="text-base font-bold text-white">
                  IndexedDB Evidence Vault &amp; Sync Queue
                </h2>
                <button
                  type="button"
                  onClick={() => {
                    const next = !isOnline;
                    setSimulatedOffline(!next);
                    setIsOnline(next);
                  }}
                  className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border transition-colors cursor-pointer ${
                    isOnline
                      ? 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/30'
                      : 'bg-amber-500/20 border-amber-500/40 text-amber-200 hover:bg-amber-500/30'
                  }`}
                  title="Toggle Simulated Online/Offline Mode"
                >
                  {isOnline ? <Wifi className="w-3 h-3 text-emerald-400" /> : <WifiOff className="w-3 h-3 text-amber-400" />}
                  <span>{isOnline ? 'Online' : 'Offline Mode'}</span>
                </button>
              </div>
              <p className="text-xs text-slate-300">
                Local-first IndexedDB storage with full-text search, Markdown export, and cloud re-run
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

        {/* Tab Switcher & Action Toolbar */}
        <div className="p-3 border-b border-[#2E3C62] bg-[#0B132B]/60 flex flex-wrap items-center justify-between gap-2.5">
          <div className="flex items-center gap-1 bg-[#1C2541] p-1 rounded-2xl border border-[#2E3C62]">
            <button
              type="button"
              onClick={() => setActiveTab('archive')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'archive'
                  ? 'bg-teal-500 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              <span>Saved Archive ({cachedOutputs.length})</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveTab('queue')}
              className={`min-h-[40px] px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all cursor-pointer flex items-center gap-1.5 ${
                activeTab === 'queue'
                  ? 'bg-amber-400 text-slate-950 shadow-sm'
                  : 'text-slate-300 hover:text-white'
              }`}
            >
              <Clock className="w-3.5 h-3.5" />
              <span>Sync Queue</span>
              {pendingCount > 0 && (
                <span className="px-1.5 py-0.2 rounded-full bg-rose-500 text-white text-[10px] font-mono">
                  {pendingCount}
                </span>
              )}
            </button>
          </div>

          {activeTab === 'archive' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => exportAllCachedItemsToMarkdown(cachedOutputs)}
                disabled={cachedOutputs.length === 0}
                className="min-h-[40px] px-3 py-1.5 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-slate-200 border border-[#2E3C62] text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-40"
              >
                <Download className="w-3.5 h-3.5 text-teal-400" />
                <span>Export All (.md)</span>
              </button>
            </div>
          )}

          {activeTab === 'queue' && (
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleDrainAll}
                disabled={isDraining || pendingCount === 0 || !isOnline}
                className="min-h-[40px] px-3.5 py-1.5 rounded-xl bg-amber-400 hover:bg-amber-300 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
              >
                {isDraining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Draining Queue...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Re-run All with Cloud (Bedrock)</span>
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Status / Notice Message */}
        {reRunMessage && (
          <div className="px-4 py-2.5 bg-teal-500/15 border-b border-teal-500/30 text-teal-200 text-xs flex items-center justify-between">
            <span>{reRunMessage}</span>
            <button
              type="button"
              onClick={() => setReRunMessage(null)}
              className="text-teal-300 hover:text-white cursor-pointer"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Tab 1: Saved Outputs Archive */}
        {activeTab === 'archive' && (
          <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
            {/* Left Filter & List */}
            <div className="w-full md:w-80 border-r border-[#2E3C62] bg-[#0B132B]/40 flex flex-col">
              <div className="p-3 border-b border-[#2E3C62] space-y-2">
                <div className="relative">
                  <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search title, prompt, text..."
                    className="w-full pl-8 pr-3 py-1.5 rounded-xl bg-[#1C2541] border border-[#2E3C62] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                  />
                </div>
                <div className="flex items-center gap-1 text-[10px]">
                  <button
                    type="button"
                    onClick={() => setModelFilter('all')}
                    className={`px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer ${
                      modelFilter === 'all' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    All ({cachedOutputs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelFilter('cloud')}
                    className={`px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer ${
                      modelFilter === 'cloud' ? 'bg-teal-500 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    Cloud
                  </button>
                  <button
                    type="button"
                    onClick={() => setModelFilter('on_device')}
                    className={`px-2 py-0.5 rounded-lg font-mono transition-colors cursor-pointer ${
                      modelFilter === 'on_device' ? 'bg-amber-400 text-slate-950 font-bold' : 'text-slate-300 hover:text-white'
                    }`}
                  >
                    On-Device
                  </button>
                </div>
              </div>

              {/* Items List */}
              <div className="flex-1 overflow-y-auto p-3 space-y-2">
                {cachedOutputs.length === 0 ? (
                  <div className="p-8 text-center text-xs text-slate-400 space-y-2">
                    <HardDrive className="w-8 h-8 mx-auto text-slate-500" />
                    <p>No saved outputs in IndexedDB.</p>
                  </div>
                ) : (
                  cachedOutputs.map((item) => {
                    const isSelected = selectedOutput?.id === item.id;
                    const isCloud = item.modelCategory === 'cloud';
                    return (
                      <div
                        key={item.id}
                        onClick={() => setSelectedOutput(item)}
                        className={`p-3 rounded-2xl transition-all cursor-pointer border space-y-1.5 ${
                          isSelected
                            ? 'bg-teal-500/15 border-teal-500/50 text-white'
                            : 'bg-[#1C2541]/50 border-transparent hover:border-[#2E3C62] text-slate-200 hover:text-white'
                        }`}
                      >
                        <div className="flex items-start justify-between gap-1.5">
                          <span className={`text-[9px] font-bold font-mono uppercase px-1.5 py-0.2 rounded border ${
                            isCloud
                              ? 'bg-teal-500/20 border-teal-500/40 text-teal-300'
                              : 'bg-amber-500/20 border-amber-500/40 text-amber-200'
                          }`}>
                            {isCloud ? 'Cloud' : 'On-Device'}
                          </span>
                          <span className="text-[9px] text-slate-400 font-mono">
                            {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <h3 className="text-xs font-bold leading-snug line-clamp-2">
                          {item.title}
                        </h3>
                        <div className="flex items-center justify-between pt-1">
                          <span className="text-[10px] text-slate-300 font-mono">
                            {item.agentName}
                          </span>
                          <button
                            type="button"
                            onClick={(e) => handleDelete(item.id, e)}
                            className="p-1 rounded-lg text-slate-400 hover:text-rose-400 transition-colors"
                            title="Delete item"
                          >
                            <Trash2 className="w-3 h-3" />
                          </button>
                        </div>
                      </div>
                    );
                  })
                )}
              </div>
            </div>

            {/* Right Document Detail Pane */}
            <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#1C2541]/60">
              {selectedOutput ? (
                <div className="space-y-4">
                  <div className="flex flex-wrap items-center justify-between gap-2 p-3.5 rounded-2xl bg-[#0B132B] border border-[#2E3C62]">
                    <div className="space-y-0.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold font-mono px-2 py-0.5 rounded-full bg-teal-500/20 border border-teal-500/40 text-teal-200">
                          {selectedOutput.model}
                        </span>
                      </div>
                      <h3 className="text-sm font-bold text-white pt-1">
                        {selectedOutput.title}
                      </h3>
                    </div>
                    <button
                      type="button"
                      onClick={() => exportCachedItemToMarkdown(selectedOutput)}
                      className="min-h-[40px] px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold flex items-center gap-1.5 transition-colors cursor-pointer"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Export .md</span>
                    </button>
                  </div>

                  <div className="p-3 rounded-xl bg-[#0B132B]/60 border border-[#2E3C62] text-xs text-slate-200 space-y-1">
                    <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Input Scenario:</span>
                    <p className="font-mono text-[11px] text-slate-200">{selectedOutput.prompt}</p>
                  </div>

                  <div className="p-4 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-3 font-mono text-xs">
                    <pre className="whitespace-pre-wrap leading-relaxed text-slate-200 text-xs overflow-x-auto max-h-[500px]">
                      {selectedOutput.output}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="h-full flex flex-col items-center justify-center text-center p-8 text-slate-400 space-y-3">
                  <FileText className="w-12 h-12 text-slate-500" />
                  <div>
                    <h3 className="text-sm font-bold text-slate-200">Select an item from the left</h3>
                    <p className="text-xs text-slate-300 max-w-sm mt-1">
                      Browse on-device or cloud-generated outputs, inspect citations, or export them to Markdown.
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Tab 2: Pending Offline Sync Queue */}
        {activeTab === 'queue' && (
          <div className="flex-1 overflow-y-auto p-5 space-y-4 bg-[#1C2541]/70">
            <div className="p-4 rounded-2xl bg-[#0B132B] border border-[#2E3C62] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <span>Pending Cloud Sync Queue</span>
                  <span className="px-2 py-0.5 rounded-full bg-amber-400/20 text-amber-200 text-xs font-mono font-bold">
                    {queuedRequests.length} Requests
                  </span>
                </h3>
                <p className="text-xs text-slate-300 mt-0.5">
                  Requests created offline that can be re-run with Amazon Bedrock for full cloud accuracy
                </p>
              </div>
              <button
                type="button"
                onClick={handleDrainAll}
                disabled={isDraining || pendingCount === 0 || !isOnline}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-gradient-to-r from-amber-400 to-amber-500 hover:from-amber-300 hover:to-amber-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-all shadow-md cursor-pointer disabled:opacity-50"
              >
                {isDraining ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Re-running with Bedrock...</span>
                  </>
                ) : (
                  <>
                    <Cloud className="w-3.5 h-3.5" />
                    <span>Re-run All with Cloud (Bedrock)</span>
                  </>
                )}
              </button>
            </div>

            {queuedRequests.length === 0 ? (
              <div className="p-12 text-center text-xs text-slate-400 space-y-2 bg-[#0B132B]/40 rounded-2xl border border-[#2E3C62]">
                <CheckCircle2 className="w-10 h-10 mx-auto text-emerald-400" />
                <h3 className="text-sm font-bold text-slate-200">Sync Queue is Empty</h3>
                <p className="text-xs text-slate-300 max-w-md mx-auto">
                  When you generate answers while offline, requests are automatically saved here so you can re-run them with Amazon Bedrock when connectivity is restored.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                {queuedRequests.map((req) => (
                  <div
                    key={req.id}
                    className="p-4 rounded-2xl bg-[#0B132B] border border-[#2E3C62] space-y-3 hover:border-amber-400/40 transition-all"
                  >
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 border-b border-[#2E3C62]/60 pb-2.5">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase tracking-wider font-mono text-teal-300">
                          {req.agentName}
                        </span>
                        <span className="text-slate-500">&middot;</span>
                        <span className="text-[10px] font-mono text-slate-400">
                          Queued: {new Date(req.createdAt).toLocaleString()}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          type="button"
                          onClick={() => handleReRunSingle(req.id)}
                          disabled={reRunningId === req.id || !isOnline}
                          className="min-h-[38px] px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {reRunningId === req.id ? (
                            <>
                              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                              <span>Calling Bedrock...</span>
                            </>
                          ) : (
                            <>
                              <Cloud className="w-3.5 h-3.5" />
                              <span>Re-run Cloud</span>
                            </>
                          )}
                        </button>
                        <button
                          type="button"
                          onClick={() => removeQueuedRequest(req.id)}
                          className="p-1.5 rounded-xl text-slate-400 hover:text-rose-400 hover:bg-[#1C2541] transition-colors"
                          title="Remove from queue"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[10px] font-mono text-slate-400 uppercase font-bold">Prompt:</span>
                      <p className="text-xs text-white font-mono bg-[#1C2541]/50 p-2.5 rounded-xl border border-[#2E3C62]">
                        {req.userPrompt}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-3.5 border-t border-[#2E3C62] bg-[#0B132B] flex items-center justify-between text-xs text-slate-300">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-teal-400" />
            <span className="font-mono text-[11px]">IndexedDB: nexus_impact_offline_v2</span>
          </div>
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
