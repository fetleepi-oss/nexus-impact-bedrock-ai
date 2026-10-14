/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Shield,
  Download,
  Trash2,
  Search,
  Cpu
} from 'lucide-react';
import {
  AuditLogEntry,
  getAuditLogs,
  clearAuditLogs,
  exportAuditLogsJson,
  getCurrentUserRole,
  setCurrentUserRole,
  COMMON_USER_ROLES
} from '../auditTrail';

interface AuditTrailModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AuditTrailModal: React.FC<AuditTrailModalProps> = ({ isOpen, onClose }) => {
  const [logs, setLogs] = useState<AuditLogEntry[]>([]);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [currentUserRole, setUserRole] = useState<string>(getCurrentUserRole());

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      setLogs(getAuditLogs());
    }
    const handleUpdate = () => {
      setLogs(getAuditLogs());
    };
    window.addEventListener('nexus_audit_log_updated', handleUpdate);
    return () => window.removeEventListener('nexus_audit_log_updated', handleUpdate);
  }, [isOpen]);

  if (!isOpen) return null;

  const handleRoleChange = (role: string) => {
    setUserRole(role);
    setCurrentUserRole(role);
  };

  const filteredLogs = logs.filter(log => {
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      return (
        log.promptSummary.toLowerCase().includes(q) ||
        log.userRole.toLowerCase().includes(q) ||
        log.model.toLowerCase().includes(q) ||
        log.guardrailFired.toLowerCase().includes(q)
      );
    }
    return true;
  });

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="audit-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-slate-950/80 backdrop-blur-md animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-2xl max-h-[90vh] bg-[#0E172E] border border-[#2E3C62] rounded-2xl shadow-2xl flex flex-col overflow-hidden text-slate-100">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-[#1C2541] bg-[#121D38]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-500/15 border border-teal-500/30 flex items-center justify-center text-teal-300">
              <Shield className="w-4.5 h-4.5" aria-hidden="true" />
            </div>
            <div>
              <h2 id="audit-modal-title" className="text-base font-bold text-white flex items-center gap-2">
                <span>Local Operational Audit Trail</span>
                <span className="text-[10px] font-mono font-normal px-2 py-0.5 rounded-full bg-teal-500/15 text-teal-200 border border-teal-500/30">
                  {logs.length} logged
                </span>
              </h2>
              <p className="text-xs text-slate-300">
                Tamper-evident local record of operator prompts, models invoked, and safety guardrails.
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

        {/* Current Operator Role Selector */}
        <div className="px-5 py-2.5 bg-[#172342]/60 border-b border-[#1C2541] flex items-center justify-between gap-3 text-xs">
          <span className="font-mono text-[11px] text-slate-200">Active Operator Role:</span>
          <select
            value={currentUserRole}
            onChange={(e) => handleRoleChange(e.target.value)}
            className="px-2.5 py-1 rounded-lg bg-[#0E172E] border border-[#2E3C62] text-xs font-mono text-teal-300 focus:outline-none focus:border-teal-400 cursor-pointer"
          >
            {COMMON_USER_ROLES.map(role => (
              <option key={role} value={role}>{role}</option>
            ))}
          </select>
        </div>

        {/* Filters and Search Bar */}
        <div className="p-3 border-b border-[#1C2541] flex items-center gap-2 bg-[#0E172E]">
          <div className="relative flex-1">
            <Search className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
            <input
              type="text"
              placeholder="Search prompt, model, guardrail, or role..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-1.5 rounded-xl bg-[#172342] border border-[#2E3C62] text-xs text-slate-100 placeholder-slate-400 focus:outline-none focus:border-teal-400 font-sans"
            />
          </div>
          <button
            type="button"
            onClick={exportAuditLogsJson}
            disabled={logs.length === 0}
            className="min-h-[36px] px-3 py-1.5 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-950 text-xs font-bold font-mono transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-40"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Export</span>
          </button>
          <button
            type="button"
            onClick={() => {
              if (confirm('Clear local audit trail log?')) {
                clearAuditLogs();
              }
            }}
            disabled={logs.length === 0}
            className="min-h-[36px] px-2.5 py-1.5 rounded-xl bg-[#1C2541] hover:bg-rose-900/40 text-rose-300 text-xs font-mono border border-rose-500/30 transition-all flex items-center gap-1 cursor-pointer disabled:opacity-40"
            title="Clear all logs"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* Audit Log Events List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2.5 max-h-[55vh]">
          {filteredLogs.length === 0 ? (
            <div className="p-8 text-center text-slate-400 text-xs font-mono space-y-1">
              <Shield className="w-8 h-8 text-slate-500 mx-auto mb-2" />
              <div className="text-white font-bold">No audit events recorded yet.</div>
              <div className="text-[11px] text-slate-400">Prompt executions and safety checks record here automatically.</div>
            </div>
          ) : (
            filteredLogs.map(entry => {
              const hasGuardrail = !entry.guardrailFired.includes('None');
              return (
                <div
                  key={entry.id}
                  className={`p-3 rounded-xl border text-xs space-y-2 ${
                    entry.status === 'blocked'
                      ? 'bg-rose-950/20 border-rose-500/40'
                      : hasGuardrail
                      ? 'bg-amber-950/20 border-amber-500/40'
                      : 'bg-[#15203D] border-[#25355B]'
                  }`}
                >
                  <div className="flex items-center justify-between text-[11px] flex-wrap gap-1">
                    <div className="flex items-center gap-2">
                      <span className="font-mono text-slate-300">
                        {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="font-bold text-white px-2 py-0.5 rounded bg-slate-800 border border-slate-700">
                        {entry.agentName}
                      </span>
                      <span className="text-teal-300 font-mono">
                        by {entry.userRole}
                      </span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-full font-mono text-[10px] font-bold ${
                      hasGuardrail
                        ? 'bg-amber-500/20 text-amber-200 border border-amber-500/30'
                        : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                    }`}>
                      {entry.guardrailFired}
                    </span>
                  </div>
                  <p className="text-slate-200 font-mono text-[11px] bg-[#0C1428] p-2 rounded-lg border border-[#1E2B4D] line-clamp-2">
                    &ldquo;{entry.promptSummary}&rdquo;
                  </p>
                  <div className="flex items-center justify-between text-[10px] font-mono text-slate-300 border-t border-[#1C2541]/70 pt-1.5">
                    <span className="flex items-center gap-1">
                      <Cpu className="w-3 h-3 text-cyan-400" />
                      <span>{entry.model}</span>
                    </span>
                    <span>Latency: {entry.latencyMs}ms</span>
                    <span>State: {entry.networkState}</span>
                  </div>
                </div>
              );
            })
          )}
        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 border-t border-[#1C2541] bg-[#121D38] flex items-center justify-between text-[11px] text-slate-300 font-mono">
          <span>Integrity: Local IndexedDB Stored</span>
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
