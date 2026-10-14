/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState } from 'react';
import {
  CheckCircle2,
  XCircle,
  Play,
  Download,
  ShieldCheck
} from 'lucide-react';
import {
  BENCHMARK_TESTS_BY_AGENT,
  TestCase,
  TestResult,
  runSingleBenchmarkTest
} from '../evaluationSuite';
import { AGENTS } from '../agents';
import { isAppOnline } from '../offlineStorage';

interface EvaluationTabProps {
  selectedModel: string;
}

export const EvaluationTab: React.FC<EvaluationTabProps> = ({ selectedModel }) => {
  const [selectedAgentId, setSelectedAgentId] = useState<string>('humanitarian');
  const [testResults, setTestResults] = useState<Record<string, TestResult>>({});
  const [isRunningAll, setIsRunningAll] = useState<boolean>(false);
  const [runningTestId, setRunningTestId] = useState<string | null>(null);
  const [filterStatus, setFilterStatus] = useState<'all' | 'passed' | 'partial' | 'failed'>('all');
  const [progressCount, setProgressCount] = useState<number>(0);

  const isOnline = isAppOnline();
  const currentTests = BENCHMARK_TESTS_BY_AGENT[selectedAgentId] || [];

  const handleRunSingle = async (testCase: TestCase) => {
    setRunningTestId(testCase.id);
    try {
      const res = await runSingleBenchmarkTest(testCase, selectedModel, isOnline);
      setTestResults(prev => ({ ...prev, [testCase.id]: res }));
    } finally {
      setRunningTestId(null);
    }
  };

  const handleRunAll = async () => {
    setIsRunningAll(true);
    setProgressCount(0);
    const resultsMap: Record<string, TestResult> = { ...testResults };
    for (let i = 0; i < currentTests.length; i++) {
      const tc = currentTests[i];
      setRunningTestId(tc.id);
      try {
        const res = await runSingleBenchmarkTest(tc, selectedModel, isOnline);
        resultsMap[tc.id] = res;
        setTestResults({ ...resultsMap });
      } catch (err) {
        console.error('Error running test', tc.id, err);
      }
      setProgressCount(i + 1);
    }
    setRunningTestId(null);
    setIsRunningAll(false);
  };

  const filteredTests = currentTests.filter(tc => {
    const res = testResults[tc.id];
    if (filterStatus === 'all') return true;
    if (!res) return false;
    return res.status === filterStatus;
  });

  const executedCount = Object.keys(testResults).filter(id => id.startsWith(selectedAgentId.slice(0, 3))).length;
  const passedCount = Object.values(testResults).filter(r => r.agentId === selectedAgentId && r.status === 'passed').length;
  const partialCount = Object.values(testResults).filter(r => r.agentId === selectedAgentId && r.status === 'partial').length;
  const failedCount = Object.values(testResults).filter(r => r.agentId === selectedAgentId && r.status === 'failed').length;
  const passRate = executedCount > 0 ? Math.round((passedCount / executedCount) * 100) : 0;

  const handleExportReportMarkdown = () => {
    const agent = AGENTS.find(a => a.id === selectedAgentId);
    let md = `# Nexus Impact AI Evaluation Report: ${agent?.name || selectedAgentId}\n\n`;
    md += `**Date:** ${new Date().toISOString()}\n`;
    md += `**Model Evaluated:** ${isOnline ? `Amazon Bedrock (${selectedModel})` : 'On-Device Model (Offline)'}\n`;
    md += `**Executed:** ${executedCount} | **Passed:** ${passedCount} (${passRate}%) | **Partial:** ${partialCount} | **Failed:** ${failedCount}\n\n`;
    md += `> **Evaluation Methodology:** Evaluates model output against strict empirical rubric points (Sphere quantities, clinical protocols, treaty articles). Quality is measured directly, never claimed.\n\n`;

    const blob = new Blob([md], { type: 'text/markdown;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `nexus_evaluation_${selectedAgentId}_${new Date().toISOString().slice(0, 10)}.md`;
    document.body.appendChild(a);
    a.click();
    a.remove();
  };

  return (
    <div className="space-y-3.5 pb-24 text-slate-100 max-w-md w-full mx-auto">
      {/* Header Banner */}
      <div className="rounded-2xl bg-gradient-to-br from-[#1C2541] to-[#121A30] border border-[#2E3C62] p-4 shadow-sm relative overflow-hidden">
        <div className="relative z-10 space-y-2">
          <div className="flex items-center justify-between">
            <span className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-teal-500/15 border border-teal-500/30 text-teal-200 text-[10px] font-bold font-mono">
              <ShieldCheck className="w-3 h-3 text-teal-400" />
              <span>Rigorous Empirical Rubric Suite</span>
            </span>
            <span className="text-[10px] font-mono text-slate-300">
              {isOnline ? 'Online (Bedrock)' : 'Offline (On-Device)'}
            </span>
          </div>
          <h1 className="text-lg font-black tracking-tight text-white flex items-center gap-2">
            <span>Built-in Quality Evaluations</span>
          </h1>
          <p className="text-xs text-slate-200 leading-relaxed">
            Run empirical test questions per agent against the current model. Quality is measured against verified operational standards (Sphere, WHO, Istanbul Protocol).
          </p>
        </div>
      </div>

      {/* Agent Selector Carousel */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 no-scrollbar text-xs">
        {AGENTS.filter(a => BENCHMARK_TESTS_BY_AGENT[a.id]).map(agent => (
          <button
            key={agent.id}
            type="button"
            onClick={() => setSelectedAgentId(agent.id)}
            className={`min-h-[44px] px-3.5 py-1.5 rounded-xl font-bold transition-all whitespace-nowrap cursor-pointer select-none flex items-center gap-1.5 ${
              selectedAgentId === agent.id
                ? 'bg-teal-500 text-slate-950 shadow-sm'
                : 'bg-[#1C2541] text-slate-200 hover:text-white border border-[#2E3C62]'
            }`}
          >
            <span>{agent.shortName}</span>
            <span className="text-[10px] opacity-75 font-mono">({BENCHMARK_TESTS_BY_AGENT[agent.id]?.length || 0})</span>
          </button>
        ))}
      </div>

      {/* Summary Scorecard Bar */}
      <div className="grid grid-cols-4 gap-1.5 text-center">
        <div className="p-2.5 rounded-xl bg-[#1C2541]/90 border border-[#2E3C62]">
          <div className="text-[10px] text-slate-300 font-mono">Suite</div>
          <div className="text-sm font-black text-white">{currentTests.length}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#1C2541]/90 border border-[#2E3C62]">
          <div className="text-[10px] text-emerald-400 font-mono">Pass (&ge;80%)</div>
          <div className="text-sm font-black text-emerald-300">{passedCount}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#1C2541]/90 border border-[#2E3C62]">
          <div className="text-[10px] text-amber-400 font-mono">Partial</div>
          <div className="text-sm font-black text-amber-300">{partialCount}</div>
        </div>
        <div className="p-2.5 rounded-xl bg-[#1C2541]/90 border border-[#2E3C62]">
          <div className="text-[10px] text-rose-400 font-mono">Failed</div>
          <div className="text-sm font-black text-rose-300">{failedCount}</div>
        </div>
      </div>

      {/* Action Controls & Progress */}
      <div className="flex flex-col gap-2 p-3 rounded-xl bg-[#131D38] border border-[#243356]">
        <div className="flex items-center justify-between">
          <div className="text-xs font-bold text-slate-200">
            {isRunningAll ? (
              <span className="text-teal-300 font-mono animate-pulse">
                Running Test {progressCount} of {currentTests.length}...
              </span>
            ) : (
              <span>Status: {executedCount} of {currentTests.length} Executed</span>
            )}
          </div>
          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={handleExportReportMarkdown}
              disabled={executedCount === 0}
              className="min-h-[38px] px-2.5 py-1 rounded-lg bg-[#1C2541] hover:bg-[#253358] text-[11px] font-mono text-slate-200 border border-[#2E3C62] disabled:opacity-40 flex items-center gap-1 cursor-pointer"
            >
              <Download className="w-3 h-3 text-teal-400" />
              <span>MD</span>
            </button>
            <button
              type="button"
              onClick={handleRunAll}
              disabled={isRunningAll || currentTests.length === 0}
              className="min-h-[38px] px-3.5 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold transition-all shadow-sm flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
            >
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>{isRunningAll ? 'Testing...' : 'Run Suite'}</span>
            </button>
          </div>
        </div>
      </div>

      {/* Test Questions List */}
      <div className="space-y-2.5">
        {filteredTests.map((tc, idx) => {
          const res = testResults[tc.id];
          const isCurrentRunning = runningTestId === tc.id;
          return (
            <div
              key={tc.id}
              className={`p-3.5 rounded-xl border transition-all ${
                res?.status === 'passed'
                  ? 'bg-[#15233E]/80 border-emerald-500/40'
                  : res?.status === 'partial'
                  ? 'bg-[#222135]/80 border-amber-500/40'
                  : res?.status === 'failed'
                  ? 'bg-[#281A25]/80 border-rose-500/40'
                  : 'bg-[#1C2541]/70 border-[#2E3C62]'
              }`}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="space-y-1 flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-slate-800 text-slate-200 border border-slate-700">
                      Test {idx + 1}
                    </span>
                    <span className="text-xs font-bold text-white truncate">{tc.category}</span>
                    {res && (
                      <span
                        className={`text-[10px] font-mono font-bold px-1.5 py-0.2 rounded ${
                          res.status === 'passed'
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : res.status === 'partial'
                            ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                            : 'bg-rose-500/20 text-rose-300 border border-rose-500/40'
                        }`}
                      >
                        {res.status.toUpperCase()} ({res.scorePercent}%)
                      </span>
                    )}
                  </div>
                  <p className="text-xs text-slate-200 font-sans leading-relaxed">
                    {tc.prompt}
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => handleRunSingle(tc)}
                  disabled={isCurrentRunning || isRunningAll}
                  className="min-h-[38px] px-2.5 py-1.5 rounded-lg bg-[#2E3C62] hover:bg-teal-600 hover:text-slate-950 text-slate-200 text-xs font-mono transition-all flex items-center gap-1 cursor-pointer shrink-0 disabled:opacity-50"
                >
                  <Play className="w-3 h-3" />
                  <span>{isCurrentRunning ? 'Testing...' : 'Run'}</span>
                </button>
              </div>

              {/* Rubric Criteria Checklist */}
              <div className="mt-2.5 pt-2 border-t border-[#2E3C62]/60 space-y-1">
                {tc.expectedKeyPoints.map(kp => {
                  const isMatched = res && res.matchedPoints.includes(kp.description);
                  const isMissed = res && res.missedPoints.includes(kp.description);
                  return (
                    <div
                      key={kp.id}
                      className="text-[11px] flex items-start gap-1.5 text-slate-200"
                    >
                      {res ? (
                        isMatched ? (
                          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0 mt-0.5" />
                        ) : (
                          <XCircle className="w-3.5 h-3.5 text-rose-400 shrink-0 mt-0.5" />
                        )
                      ) : (
                        <span className="w-3.5 h-3.5 rounded-full border border-slate-500 inline-block shrink-0 mt-0.5" />
                      )}
                      <span className={isMatched ? 'text-emerald-200 font-medium' : isMissed ? 'text-rose-200' : 'text-slate-300'}>
                        {kp.description}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
