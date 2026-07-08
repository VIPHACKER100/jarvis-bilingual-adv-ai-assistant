// ==========================================================================
// JARVIS v4.0 — COMP-8: ProcessTable
// Sortable table of running processes with action buttons
// ==========================================================================

import { useState, useMemo } from 'react';
import type { ProcessInfo } from '../types';
import { ArrowUpDown, Play, Pause, Skull } from 'lucide-react';

interface ProcessTableProps {
  processes: ProcessInfo[];
  onAction: (pid: number, action: 'suspend' | 'resume' | 'terminate') => void;
  isLoading?: boolean;
  actionLoadingPid?: number | null;
}

type SortKey = 'pid' | 'name' | 'cpu_percent' | 'memory_mb' | 'status' | 'threat_level';
type SortDir = 'asc' | 'desc';

function TableSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-4 animate-pulse space-y-3">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-8 bg-cyan-900/10 rounded" />
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-center h-32">
      <p className="text-sm font-mono text-slate-500">No processes available</p>
    </div>
  );
}

export function ProcessTable({ processes, onAction, isLoading = false, actionLoadingPid = null }: ProcessTableProps) {
  const [sortKey, setSortKey] = useState<SortKey>('cpu_percent');
  const [sortDir, setSortDir] = useState<SortDir>('desc');

  const handleSort = (key: SortKey) => {
    if (sortKey === key) {
      setSortDir((prev) => (prev === 'asc' ? 'desc' : 'asc'));
    } else {
      setSortKey(key);
      setSortDir('desc');
    }
  };

  const sorted = useMemo(() => {
    return [...processes].sort((a, b) => {
      const aVal = a[sortKey];
      const bVal = b[sortKey];
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return sortDir === 'asc' ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      return sortDir === 'asc'
        ? (aVal as number) - (bVal as number)
        : (bVal as number) - (aVal as number);
    });
  }, [processes, sortKey, sortDir]);

  const SortHeader = ({ label, sortKey: sk }: { label: string; sortKey: SortKey }) => (
    <th
      className="px-3 py-2 text-left text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400 cursor-pointer hover:text-cyan-300 transition-colors"
      onClick={() => handleSort(sk)}
    >
      <div className="flex items-center gap-1">
        {label}
        <ArrowUpDown className="w-3 h-3 opacity-50" />
      </div>
    </th>
  );

  if (isLoading) return <TableSkeleton />;
  if (processes.length === 0) return <EmptyState />;

  const isSuspended = (status: string) => status?.toLowerCase() === 'suspended' || status?.toLowerCase() === 'stopped';

  return (
    <div className="glass-panel rounded-xl overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-cyan-900/30">
              <SortHeader label="PID" sortKey="pid" />
              <SortHeader label="Name" sortKey="name" />
              <SortHeader label="CPU%" sortKey="cpu_percent" />
              <SortHeader label="Memory" sortKey="memory_mb" />
              <SortHeader label="Status" sortKey="status" />
              <SortHeader label="Threat" sortKey="threat_level" />
              <th className="px-3 py-2 text-right text-[10px] font-mono font-semibold uppercase tracking-wider text-slate-400">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-cyan-900/20">
            {sorted.map((proc) => (
              <tr
                key={proc.pid}
                className={`transition-colors hover:bg-cyan-950/20 ${
                  isSuspended(proc.status) ? 'opacity-50' : ''
                }`}
              >
                <td className="px-3 py-2 text-xs font-mono text-slate-400">{proc.pid}</td>
                <td className="px-3 py-2 text-xs font-mono text-slate-200 truncate max-w-[150px]" title={proc.name}>
                  {proc.name}
                </td>
                <td className="px-3 py-2 text-xs font-mono text-cyan-300">
                  {proc.cpu_percent.toFixed(1)}%
                </td>
                <td className="px-3 py-2 text-xs font-mono text-slate-300">
                  {proc.memory_mb.toFixed(1)} MB
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    isSuspended(proc.status)
                      ? 'border-yellow-700/40 text-yellow-400 bg-yellow-900/20'
                      : 'border-green-700/40 text-green-400 bg-green-900/20'
                  }`}>
                    {proc.status}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${
                    proc.threat_level === 'malicious'
                      ? 'border-rose-700/40 text-rose-400 bg-rose-900/20'
                      : proc.threat_level === 'suspicious'
                      ? 'border-yellow-700/40 text-yellow-400 bg-yellow-900/20'
                      : 'border-slate-700/40 text-slate-400 bg-slate-900/20'
                  }`}>
                    {proc.threat_level}
                  </span>
                </td>
                <td className="px-3 py-2">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => onAction(proc.pid, isSuspended(proc.status) ? 'resume' : 'suspend')}
                      disabled={actionLoadingPid === proc.pid}
                      title={isSuspended(proc.status) ? 'Resume process' : 'Suspend process'}
                      aria-label={`${isSuspended(proc.status) ? 'Resume' : 'Suspend'} process ${proc.name}`}
                      className="p-1.5 rounded-md text-slate-500 hover:text-yellow-400 hover:bg-yellow-900/20 transition-colors disabled:opacity-40"
                    >
                      {isSuspended(proc.status) ? <Play className="w-3.5 h-3.5" /> : <Pause className="w-3.5 h-3.5" />}
                    </button>
                    <button
                      onClick={() => onAction(proc.pid, 'terminate')}
                      disabled={actionLoadingPid === proc.pid}
                      title="Terminate process"
                      aria-label={`Terminate process ${proc.name}`}
                      className="p-1.5 rounded-md text-slate-500 hover:text-rose-400 hover:bg-rose-900/20 transition-colors disabled:opacity-40"
                    >
                      <Skull className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
