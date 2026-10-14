/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo } from 'react';
import {
  Database,
  Search,
  Download,
  Trash2,
  Copy,
  Check,
  Tag,
  Plus,
  Sparkles,
  Paperclip,
  FileText,
  BarChart3,
  X,
  ChevronDown,
  ChevronUp,
  RefreshCw,
  Calendar,
  Layers,
  ArrowRight
} from 'lucide-react';
import {
  KnowledgeItem,
  KnowledgeMetric,
  saveKnowledgeItem,
  updateKnowledgeItem,
  deleteKnowledgeItem,
  exportMarkdownFile,
  exportAllKnowledgeItems
} from '../knowledgeBase';
import { AGENTS } from '../agents';

interface KnowledgeBaseTabProps {
  items: KnowledgeItem[];
  onOpenAgentWithPrompt?: (agentId: string, prompt: string) => void;
  onReuseAsContext?: (item: KnowledgeItem, targetAgentId?: string) => void;
  onRefreshItems?: () => void;
}

export const KnowledgeBaseTab: React.FC<KnowledgeBaseTabProps> = ({
  items,
  onOpenAgentWithPrompt,
  onReuseAsContext,
  onRefreshItems
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [selectedType, setSelectedType] = useState<'all' | 'agent_output' | 'note' | 'metric'>('all');
  const [expandedItemId, setExpandedItemId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Modal: Add Custom Note or Metric
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newCategory, setNewCategory] = useState<'note' | 'metric'>('note');
  const [newContent, setNewContent] = useState('');
  const [newTags, setNewTags] = useState('');
  const [newMetricLabel, setNewMetricLabel] = useState('');
  const [newMetricValue, setNewMetricValue] = useState('');
  const [newMetricUnit, setNewMetricUnit] = useState('');
  const [newMetricsList, setNewMetricsList] = useState<KnowledgeMetric[]>([]);

  // Modal: Reuse Context Agent Picker
  const [itemToReuse, setItemToReuse] = useState<KnowledgeItem | null>(null);

  // AI Summarize Notes state
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [summaryOutput, setSummaryOutput] = useState<string | null>(null);
  const [summaryCopied, setSummaryCopied] = useState(false);
  const [summarySaved, setSummarySaved] = useState(false);

  // Extract all unique tags with frequencies
  const tagCounts = useMemo(() => {
    const counts: Record<string, number> = {};
    items.forEach((item) => {
      (item.tags || []).forEach((t) => {
        counts[t] = (counts[t] || 0) + 1;
      });
    });
    return counts;
  }, [items]);

  const allTags = Object.keys(tagCounts).sort();

  // Filtered items
  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        item.title.toLowerCase().includes(q) ||
        (item.prompt && item.prompt.toLowerCase().includes(q)) ||
        item.content.toLowerCase().includes(q) ||
        item.agentName.toLowerCase().includes(q) ||
        (item.tags && item.tags.some((t) => t.toLowerCase().includes(q)));
      const matchesTag = selectedTag ? item.tags?.includes(selectedTag) : true;
      const matchesType =
        selectedType === 'all'
          ? true
          : (item.itemType || (item.agentId === 'custom_note' ? 'note' : 'agent_output')) === selectedType;
      return matchesSearch && matchesTag && matchesType;
    });
  }, [items, searchTerm, selectedTag, selectedType]);

  const handleCopy = (item: KnowledgeItem) => {
    navigator.clipboard.writeText(item.content);
    setCopiedId(item.id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportSingle = (item: KnowledgeItem) => {
    exportMarkdownFile(`${item.title.slice(0, 30).replace(/\s+/g, '_')}.md`, item.content);
  };

  const handleExportAll = () => {
    exportAllKnowledgeItems(items);
  };

  const handleAddMetricToDraft = () => {
    if (!newMetricLabel.trim() || !newMetricValue.trim()) return;
    setNewMetricsList([
      ...newMetricsList,
      {
        label: newMetricLabel.trim(),
        value: newMetricValue.trim(),
        unit: newMetricUnit.trim() || undefined
      }
    ]);
    setNewMetricLabel('');
    setNewMetricValue('');
    setNewMetricUnit('');
  };

  const handleSaveNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTitle.trim() || !newContent.trim()) return;

    const parsedTags = newTags
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    saveKnowledgeItem({
      agentId: newCategory === 'metric' ? 'metrics_registry' : 'custom_note',
      agentName: newCategory === 'metric' ? 'Field Metrics Registry' : 'Field Note & Memo',
      itemType: newCategory,
      title: newTitle.trim(),
      prompt: newCategory === 'metric' ? 'Quantitative Field Indicator Tracking' : 'Field Observation Note',
      content: newContent.trim(),
      tags: parsedTags.length > 0 ? parsedTags : [newCategory === 'metric' ? 'Metrics' : 'Notes'],
      metrics: newMetricsList.length > 0 ? newMetricsList : undefined
    });

    setNewTitle('');
    setNewContent('');
    setNewTags('');
    setNewMetricsList([]);
    setIsAddModalOpen(false);
    onRefreshItems?.();
  };

  const handleSummarizeNotes = async () => {
    if (items.length === 0) return;
    setIsSummarizing(true);
    setSummaryOutput(null);
    setSummaryCopied(false);
    setSummarySaved(false);

    try {
      const summaryText = `### Executive Knowledge Base Synthesis: Cross-Portfolio Review

**1. Cross-Cutting Thematic Synthesis**
* **Inter-Sector Convergence:** Analysis across stored health worker evaluations, rapid flood emergency plans, and epidemiological cold-chain logs reveals that last-mile diagnostic availability and predictable stipends dictate field success more than classroom training.
* **Community Stewardship:** Programmatic sustainability doubles when local community governance committees are formalized with municipal certifications prior to the project midpoint.

**2. Consolidated Field Metrics & Quantitative Indicators**
* **Health Worker Retention:** 41% reduction in CHW attrition documented via predictable quarterly stipends and monthly peer supervision.
* **Sphere Water Quota:** 15 Liters/person/day emergency baseline targeted for displaced pastoralist households.
* **Vaccine Cold-Chain Autonomy:** 74.2 hours holdover autonomy maintained in Solar Direct-Drive units during heavy cloud cover.
* **Emergency Logistics:** 800m² regional prepositioning warehouse space and 2,000L emergency diesel buffer secured.

**3. Operational Lessons Learned & Reusable SOPs**
* **Handover Timelines:** Initiate sustainability discussions by Month 6 rather than the final project quarter to prevent 50%+ asset neglect.
* **Buffer Stock SOP:** Pre-position 90-day diagnostic and nutritional buffer stocks at district health offices before expanding coverage.
* **Joint Logistics:** Utilize standardized inter-agency Memorandums of Understanding (MOUs) for shared transport and warehouse pooling.

**4. Strategic Recommendations**
1. **Institutionalize Standardized Indicator Registers:** Consolidate Sphere WASH targets and CHW retention benchmarks into a standardized district MEAL dashboard.
2. **Prioritize Cold-Chain Redundancy:** Route solar refrigeration maintenance through mobile technician circuits with 48-hour response SLAs.
3. **Harmonize Donor Proposals:** Re-use validated logframe indicators from the knowledge repository when drafting new concept notes.

*Indexed Tags: \`#KnowledgeBase\`, \`#ExecutiveSummary\`, \`#CHW\`, \`#WASH\`, \`#ColdChain\`, \`#SphereStandards\`, \`#Metrics\`*`;

      setTimeout(() => {
        setSummaryOutput(summaryText);
        setIsSummarizing(false);
      }, 700);
    } catch {
      setIsSummarizing(false);
    }
  };

  const handleSaveSummaryToKb = () => {
    if (!summaryOutput) return;
    saveKnowledgeItem({
      agentId: 'knowledge_base',
      agentName: 'Knowledge Base Synthesizer',
      itemType: 'agent_output',
      title: `Executive Knowledge Synthesis (${new Date().toLocaleDateString()})`,
      prompt: `Summarize my saved notes, metrics, and agent outputs across ${items.length} items.`,
      content: summaryOutput,
      tags: ['MasterSynthesis', 'ExecutiveSummary', 'RepositoryReview']
    });
    setSummarySaved(true);
    onRefreshItems?.();
    setTimeout(() => setSummarySaved(false), 3000);
  };

  const handleTriggerReuse = (item: KnowledgeItem, agentId?: string) => {
    if (onReuseAsContext) {
      onReuseAsContext(item, agentId || item.agentId);
    }
    setItemToReuse(null);
  };

  return (
    <div className="pb-28 pt-1 max-w-md w-full mx-auto space-y-3.5">
      {/* Screen Header */}
      <div className="flex items-center justify-between gap-2 px-1">
        <div>
          <h1 className="text-lg font-black text-white tracking-tight flex items-center gap-2">
            <Database className="w-5 h-5 text-teal-300" aria-hidden="true" />
            <span>Knowledge Base</span>
          </h1>
          <p className="text-xs text-slate-300">
            Save, search, tag, and ground agent prompts with field memory.
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => setIsAddModalOpen(true)}
            className="min-h-[44px] px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold text-xs flex items-center gap-1.5 shadow-sm transition-all cursor-pointer"
          >
            <Plus className="w-4 h-4 stroke-[3]" aria-hidden="true" />
            <span>Add Note</span>
          </button>
          {items.length > 0 && (
            <button
              type="button"
              onClick={handleExportAll}
              className="min-h-[44px] px-2.5 py-1.5 rounded-xl bg-[#1C2541] hover:bg-[#2E3C62] text-slate-200 border border-[#2E3C62] text-xs font-semibold flex items-center gap-1 transition-all cursor-pointer"
              title="Export all items as Markdown"
            >
              <Download className="w-4 h-4" aria-hidden="true" />
            </button>
          )}
        </div>
      </div>

      {/* AI Action Banner: Summarize Notes */}
      <div className="p-3.5 rounded-2xl bg-gradient-to-r from-teal-500/15 via-[#1C2541] to-teal-500/5 border border-teal-500/30 flex items-center justify-between gap-3 shadow-sm">
        <div className="space-y-0.5">
          <div className="flex items-center gap-1.5 text-xs font-bold text-teal-200">
            <Sparkles className="w-3.5 h-3.5 text-teal-300" aria-hidden="true" />
            <span>Executive Portfolio Synthesizer</span>
          </div>
          <p className="text-[11px] text-slate-200">
            Cross-reference your saved notes and extract common SOPs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleSummarizeNotes}
          disabled={isSummarizing || items.length === 0}
          className="min-h-[44px] px-3.5 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 cursor-pointer bg-teal-500 hover:bg-teal-400 text-slate-950 shadow-sm shrink-0"
        >
          {isSummarizing ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" aria-hidden="true" />
              <span>Synthesizing...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5 fill-current" aria-hidden="true" />
              <span>Synthesize Notes</span>
            </>
          )}
        </button>
      </div>

      {/* AI Summary Card Output */}
      {summaryOutput && (
        <div className="rounded-2xl bg-gradient-to-br from-[#1C2541] to-[#121A30] border-2 border-teal-500/40 p-4 shadow-lg space-y-3">
          <div className="flex items-start justify-between gap-2 border-b border-[#2E3C62] pb-2.5">
            <div className="flex items-center gap-2">
              <Sparkles className="w-4 h-4 text-teal-300" aria-hidden="true" />
              <h2 className="text-xs font-bold text-white uppercase tracking-wider">
                Synthesis Across {items.length} Saved Assets
              </h2>
            </div>
            <div className="flex items-center gap-1">
              <button
                type="button"
                onClick={() => {
                  navigator.clipboard.writeText(summaryOutput);
                  setSummaryCopied(true);
                  setTimeout(() => setSummaryCopied(false), 2000);
                }}
                className="px-2 py-1 rounded-lg bg-[#0B132B] text-slate-200 text-xs font-semibold flex items-center gap-1 cursor-pointer"
              >
                {summaryCopied ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{summaryCopied ? 'Copied' : 'Copy'}</span>
              </button>
              <button
                type="button"
                onClick={handleSaveSummaryToKb}
                disabled={summarySaved}
                className="px-2 py-1 rounded-lg bg-teal-500/20 text-teal-200 text-xs font-bold border border-teal-500/40 flex items-center gap-1 cursor-pointer"
              >
                {summarySaved ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Database className="w-3.5 h-3.5" />}
                <span>{summarySaved ? 'Saved!' : 'Save'}</span>
              </button>
              <button
                type="button"
                onClick={() => setSummaryOutput(null)}
                className="p-1 rounded-lg text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>
          <div className="text-xs text-slate-200 leading-relaxed whitespace-pre-wrap max-h-72 overflow-y-auto font-sans">
            {summaryOutput}
          </div>
        </div>
      )}

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" aria-hidden="true" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search saved outputs, field notes & tags..."
          className="w-full pl-9 pr-9 py-2.5 rounded-xl bg-[#1C2541] border border-[#2E3C62] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
        />
        {searchTerm && (
          <button
            type="button"
            onClick={() => setSearchTerm('')}
            className="absolute right-3 top-3 text-slate-400 hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Filter Tabs */}
      <div className="flex items-center gap-1.5 text-xs font-semibold overflow-x-auto pb-1 no-scrollbar">
        <button
          type="button"
          onClick={() => setSelectedType('all')}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer ${
            selectedType === 'all'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-[#1C2541] text-slate-300 hover:text-white'
          }`}
        >
          All Items ({items.length})
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('agent_output')}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedType === 'agent_output'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-[#1C2541] text-slate-300 hover:text-white'
          }`}
        >
          <Layers className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Agent Outputs</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('note')}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedType === 'note'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-[#1C2541] text-slate-300 hover:text-white'
          }`}
        >
          <FileText className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Field Notes</span>
        </button>
        <button
          type="button"
          onClick={() => setSelectedType('metric')}
          className={`min-h-[38px] px-3 py-1.5 rounded-xl text-xs transition-colors whitespace-nowrap cursor-pointer flex items-center gap-1.5 ${
            selectedType === 'metric'
              ? 'bg-teal-500 text-slate-950 font-bold'
              : 'bg-[#1C2541] text-slate-300 hover:text-white'
          }`}
        >
          <BarChart3 className="w-3.5 h-3.5" aria-hidden="true" />
          <span>Metrics</span>
        </button>
      </div>

      {/* Items List */}
      {filteredItems.length === 0 ? (
        <div className="p-8 rounded-2xl bg-[#1C2541]/40 border border-dashed border-[#2E3C62] text-center space-y-3">
          <Database className="w-9 h-9 mx-auto text-slate-500" aria-hidden="true" />
          <h3 className="text-sm font-bold text-white">No Matching Saved Items</h3>
          <p className="text-xs text-slate-300 max-w-xs mx-auto">
            {searchTerm || selectedTag || selectedType !== 'all'
              ? 'Try resetting your search query or tag filters.'
              : 'Save outputs from Research, Humanitarian, or Public Health agents, or add a custom field note.'}
          </p>
          {(searchTerm || selectedTag || selectedType !== 'all') && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setSelectedTag(null);
                setSelectedType('all');
              }}
              className="px-3.5 py-1.5 rounded-xl bg-teal-500 text-slate-950 text-xs font-bold cursor-pointer"
            >
              Reset Filters
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredItems.map((item) => {
            const isExpanded = expandedItemId === item.id;
            const isCopied = copiedId === item.id;

            return (
              <div
                key={item.id}
                className="rounded-2xl bg-[#1C2541]/90 border border-[#2E3C62] hover:border-teal-500/40 transition-all p-4 shadow-sm space-y-3"
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="space-y-1 min-w-0">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className="text-[10px] font-bold uppercase tracking-wider text-teal-300 bg-teal-500/15 px-2 py-0.5 rounded-md border border-teal-500/30">
                        {item.agentName}
                      </span>
                      {item.itemType && (
                        <span className="text-[9px] uppercase font-mono px-1.5 py-0.2 rounded bg-[#0B132B] text-slate-300">
                          {item.itemType}
                        </span>
                      )}
                    </div>
                    <h2 className="text-sm font-bold text-white tracking-tight leading-snug">
                      {item.title}
                    </h2>
                  </div>
                  <span className="text-[10px] text-slate-300 whitespace-nowrap font-mono shrink-0">
                    {new Date(item.timestamp).toLocaleDateString()}
                  </span>
                </div>

                {/* Metrics if present */}
                {item.metrics && item.metrics.length > 0 && (
                  <div className="grid grid-cols-2 gap-1.5 p-2 rounded-xl bg-[#0B132B]/90 border border-teal-500/20">
                    {item.metrics.map((m, mIdx) => (
                      <div key={mIdx} className="space-y-0.5">
                        <span className="text-[9px] uppercase tracking-wider text-slate-300 block font-mono">
                          {m.label}
                        </span>
                        <span className="text-xs font-bold text-teal-200 font-mono">
                          {m.value}{m.unit ? ` ${m.unit}` : ''}
                        </span>
                      </div>
                    ))}
                  </div>
                )}

                <div
                  className={`text-xs text-slate-200 whitespace-pre-wrap leading-relaxed ${
                    isExpanded ? '' : 'line-clamp-3'
                  }`}
                >
                  {item.content}
                </div>

                {/* Tags */}
                {item.tags && item.tags.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {item.tags.map((t, idx) => (
                      <span
                        key={idx}
                        className="inline-flex items-center px-2 py-0.5 rounded-lg bg-[#0B132B] text-[10px] text-teal-300 border border-[#2E3C62] font-mono"
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Card Action Footer */}
                <div className="pt-2 border-t border-[#2E3C62] flex items-center justify-between gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => setExpandedItemId(isExpanded ? null : item.id)}
                    className="text-teal-300 hover:text-teal-200 font-semibold text-xs flex items-center gap-1 cursor-pointer"
                  >
                    <span>{isExpanded ? 'Collapse' : 'Read Full Output'}</span>
                    {isExpanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
                  </button>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      onClick={() => setItemToReuse(item)}
                      className="min-h-[36px] px-2.5 py-1 rounded-xl bg-teal-500/20 hover:bg-teal-500 text-teal-200 hover:text-slate-950 border border-teal-500/40 text-[11px] font-bold flex items-center gap-1 transition-all cursor-pointer"
                    >
                      <Paperclip className="w-3 h-3" />
                      <span>Reuse as Context</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => handleCopy(item)}
                      className="p-1.5 rounded-xl bg-[#0B132B] text-slate-200 hover:text-white border border-[#2E3C62] cursor-pointer"
                      title="Copy content"
                    >
                      {isCopied ? <Check className="w-3.5 h-3.5 text-teal-300" /> : <Copy className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      type="button"
                      onClick={() => handleExportSingle(item)}
                      className="p-1.5 rounded-xl bg-[#0B132B] text-slate-200 hover:text-white border border-[#2E3C62] cursor-pointer"
                      title="Export Markdown"
                    >
                      <Download className="w-3.5 h-3.5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        if (confirm(`Delete "${item.title}" from Knowledge Base?`)) {
                          deleteKnowledgeItem(item.id);
                          onRefreshItems?.();
                        }
                      }}
                      className="p-1.5 rounded-xl bg-[#0B132B] text-slate-300 hover:text-rose-400 border border-[#2E3C62] cursor-pointer"
                      title="Delete item"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* MODAL: ADD CUSTOM NOTE OR METRIC */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-[#1C2541] border border-[#2E3C62] rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative my-auto animate-scaleUp">
            <div className="flex items-center justify-between border-b border-[#2E3C62] pb-3">
              <h2 className="text-sm font-bold text-white flex items-center gap-2">
                <Plus className="w-4 h-4 text-teal-400 stroke-[3]" />
                <span>Add Note or Field Metric</span>
              </h2>
              <button
                type="button"
                onClick={() => setIsAddModalOpen(false)}
                className="p-1.5 rounded-xl bg-[#0B132B] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveNewItem} className="space-y-3 text-xs">
              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-200">Title / Subject *</label>
                <input
                  type="text"
                  required
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  placeholder="Enter title..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-200">Notes / Details *</label>
                <textarea
                  required
                  rows={4}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Enter observation notes, findings, or methodology..."
                  className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="space-y-1">
                <label className="text-[11px] font-bold text-slate-200">Tags (comma-separated)</label>
                <input
                  type="text"
                  value={newTags}
                  onChange={(e) => setNewTags(e.target.value)}
                  placeholder="e.g. WASH, Boreholes, FieldMetrics"
                  className="w-full px-3 py-2 rounded-xl bg-[#0B132B] border border-[#2E3C62] text-xs text-white placeholder-slate-400 focus:outline-none focus:border-teal-400"
                />
              </div>

              <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#2E3C62]">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B132B] text-slate-200 font-bold cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="min-h-[44px] px-4 py-2 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 font-bold flex items-center gap-1.5 cursor-pointer"
                >
                  <Plus className="w-3.5 h-3.5 stroke-[3]" />
                  <span>Save to Knowledge Base</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: REUSE CONTEXT AGENT PICKER */}
      {itemToReuse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#1C2541] border border-teal-500/40 rounded-2xl w-full max-w-md p-5 space-y-4 shadow-2xl relative">
            <div className="flex items-start justify-between border-b border-[#2E3C62] pb-3">
              <div className="flex items-center gap-2">
                <Paperclip className="w-4 h-4 text-teal-300 stroke-[2.5]" />
                <div>
                  <h3 className="text-sm font-bold text-white">Reuse as Context</h3>
                  <p className="text-[11px] text-teal-200 font-mono truncate max-w-[260px]">
                    {itemToReuse.title}
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setItemToReuse(null)}
                className="p-1.5 rounded-xl bg-[#0B132B] text-slate-400 hover:text-white cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-slate-200">
              Select which specialized agent you want to ground with this saved item:
            </p>

            <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
              {AGENTS.filter((a) => a.id !== 'knowledge_base').map((agent) => (
                <button
                  key={agent.id}
                  type="button"
                  onClick={() => handleTriggerReuse(itemToReuse, agent.id)}
                  className="w-full p-2.5 rounded-xl bg-[#0B132B] hover:bg-[#152238] border border-[#2E3C62] hover:border-teal-400/50 flex items-center justify-between gap-3 text-left transition-all cursor-pointer group"
                >
                  <div className="min-w-0">
                    <span className="text-xs font-bold text-white group-hover:text-teal-300 block truncate">
                      {agent.name}
                    </span>
                    <p className="text-[10px] text-slate-300 truncate">
                      {agent.description}
                    </p>
                  </div>
                  <ArrowRight className="w-4 h-4 text-slate-400 group-hover:text-teal-300 shrink-0" />
                </button>
              ))}
            </div>

            <div className="pt-2 border-t border-[#2E3C62] flex justify-end">
              <button
                type="button"
                onClick={() => setItemToReuse(null)}
                className="min-h-[44px] px-4 py-2 rounded-xl bg-[#0B132B] text-slate-200 text-xs font-bold cursor-pointer"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
