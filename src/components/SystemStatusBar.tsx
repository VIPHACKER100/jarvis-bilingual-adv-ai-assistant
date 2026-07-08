// ==========================================================================
// JARVIS v4.0 — COMP-1: SystemStatusBar
// CPU%, RAM%, battery%, volume, uptime — updated via WS
// ==========================================================================

import type { SystemStatusResponse } from '../types';
import { formatUptime, formatPercent } from '../utils/formatters';
import { Cpu, MemoryStick, Battery, Volume2, Clock, Wifi } from 'lucide-react';

interface SystemStatusBarProps {
  status: SystemStatusResponse | null;
  isLoading?: boolean;
}

function SkeletonBar() {
  return (
    <div className="flex items-center gap-4 p-3 glass-panel rounded-lg animate-pulse">
      {[1, 2, 3, 4, 5].map((i) => (
        <div key={i} className="h-4 bg-cyan-900/30 rounded w-16" />
      ))}
    </div>
  );
}

export function SystemStatusBar({ status, isLoading }: SystemStatusBarProps) {
  if (isLoading || !status) return <SkeletonBar />;

  const cpu = status.cpu?.percent ?? 0;
  const mem = status.memory?.percent ?? 0;
  const bat = status.battery?.percent ?? 0;
  const charging = status.battery?.is_charging ?? false;
  const vol = status.volume ?? 0;
  const uptime = status.uptime ?? 0;

  const cpuWarning = cpu > 80;
  const memWarning = mem > 80;
  const batWarning = bat < 20 && !charging;

  return (
    <div className="flex flex-wrap items-center gap-3 md:gap-5 p-3 glass-panel rounded-lg text-xs md:text-sm font-mono">
      {/* CPU */}
      <div
        className={`flex items-center gap-1.5 ${cpuWarning ? 'text-neon-error' : 'text-cyan-300'}`}
        title={`CPU: ${cpu.toFixed(1)}%`}
        aria-label={`CPU usage ${cpu.toFixed(1)} percent`}
      >
        <Cpu className="w-3.5 h-3.5" />
        <span className="font-semibold">{formatPercent(cpu)}</span>
      </div>

      {/* Memory */}
      <div
        className={`flex items-center gap-1.5 ${memWarning ? 'text-neon-error' : 'text-cyan-300'}`}
        title={`Memory: ${mem.toFixed(1)}%`}
        aria-label={`Memory usage ${mem.toFixed(1)} percent`}
      >
        <MemoryStick className="w-3.5 h-3.5" />
        <span className="font-semibold">{formatPercent(mem)}</span>
      </div>

      {/* Battery */}
      <div
        className={`flex items-center gap-1.5 ${batWarning ? 'text-neon-warning animate-pulse' : 'text-cyan-300'}`}
        title={`Battery: ${bat}% ${charging ? '(charging)' : ''}`}
        aria-label={`Battery ${bat} percent${charging ? ', charging' : ''}`}
      >
        <Battery className="w-3.5 h-3.5" />
        <span className="font-semibold">
          {formatPercent(bat)}
          {charging && <span className="text-neon-success text-[10px] ml-0.5">⚡</span>}
        </span>
      </div>

      {/* Volume */}
      <div className="flex items-center gap-1.5 text-cyan-300" title={`Volume: ${vol}%`} aria-label={`Volume ${vol} percent`}>
        <Volume2 className="w-3.5 h-3.5" />
        <span className="font-semibold">{formatPercent(vol)}</span>
      </div>

      {/* Uptime */}
      <div className="flex items-center gap-1.5 text-cyan-400/70" title={`Uptime: ${formatUptime(uptime)}`} aria-label={`System uptime ${formatUptime(uptime)}`}>
        <Clock className="w-3.5 h-3.5" />
        <span className="text-[10px] md:text-xs">{formatUptime(uptime)}</span>
      </div>

      {/* Network */}
      {status.network && (
        <div className="flex items-center gap-1.5 text-cyan-400/70 ml-auto" title={`${status.network.hostname} — ${status.network.ip}`} aria-label={`Network: ${status.network.ip}`}>
          <Wifi className="w-3.5 h-3.5" />
          <span className="text-[10px] md:text-xs hidden md:inline">{status.network.ip}</span>
        </div>
      )}

      {/* Active Window */}
      {status.active_window && (
        <div className="hidden lg:flex items-center gap-2 text-[10px] text-slate-400 border-l border-cyan-800/30 pl-3 max-w-[200px] truncate">
          <span className="truncate">{status.active_window.title}</span>
        </div>
      )}
    </div>
  );
}
