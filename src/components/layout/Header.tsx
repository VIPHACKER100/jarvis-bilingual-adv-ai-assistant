import React from "react";
import { useStore } from "../../store";
import { Settings, Wifi, WifiOff, Bell, Sun } from "lucide-react";
import { Button } from "../ui/Button";
import { Link } from "react-router-dom";

export function Header() {
  const isConnected = useStore((state) => state.isConnected);
  const status = useStore((state) => state.connectionStatus);
  const systemStatus = useStore((state) => state.systemStatus);

  return (
    <header className="h-20 border-b border-cyan-900/30 bg-slate-950/80 backdrop-blur-xl flex items-center justify-between px-6 shrink-0 z-10">
      <div className="flex items-center gap-6">
        <div className="flex flex-col">
          <h1 className="text-3xl font-bold tracking-wider text-cyan-400 font-display text-shadow-cyan">
            JARVIS{" "}
            <span className="text-slate-400 border border-slate-700 rounded px-1.5 py-0.5 text-xs font-mono align-top ml-1">
              v4.0.0
            </span>
          </h1>
          <span className="text-cyan-500/70 text-xs tracking-[0.2em] uppercase font-mono">
            Neural Interface
          </span>
        </div>

        <div className="h-10 w-px bg-cyan-900/50 mx-2" />

        <div className="flex flex-col items-center justify-center bg-cyan-950/30 border border-cyan-900/50 rounded-lg px-4 py-1.5">
          <div className="flex items-center gap-2">
            {isConnected ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
                </span>
                <span className="text-cyan-400 text-xs font-bold uppercase tracking-wider">
                  Connected
                </span>
              </>
            ) : (
              <>
                <WifiOff size={12} className="text-red-500" />
                <span className="text-red-500 text-xs font-bold uppercase tracking-wider">
                  {status === "connecting" ? "Reconnecting..." : "Offline"}
                </span>
              </>
            )}
          </div>
          <span className="text-slate-500 text-[10px] uppercase tracking-wide">
            WebSocket: {isConnected ? "Live" : "Dead"}
          </span>
        </div>
      </div>

      <div className="flex-1 flex justify-center gap-4 px-8">
        <MetricCard
          label="CPU"
          value={`${systemStatus?.cpu_percent ?? 0}%`}
          icon={
            <div className="w-10 h-6 bg-cyan-900/50 rounded-sm overflow-hidden flex items-end gap-0.5 px-0.5 pb-0.5">
              <div className="w-1 bg-cyan-500 h-2"></div>
              <div className="w-1 bg-cyan-400 h-4"></div>
              <div className="w-1 bg-cyan-500 h-3"></div>
              <div className="w-1 bg-cyan-300 h-5"></div>
            </div>
          }
        />
        <MetricCard
          label="MEMORY"
          value={`${systemStatus?.memory_percent ?? 0}`}
          unit="MB"
          icon={
            <div className="w-10 h-6 bg-cyan-900/50 rounded-sm overflow-hidden flex items-end gap-0.5 px-0.5 pb-0.5">
              <div className="w-1 bg-purple-500 h-3"></div>
              <div className="w-1 bg-purple-400 h-5"></div>
              <div className="w-1 bg-purple-500 h-2"></div>
              <div className="w-1 bg-purple-300 h-4"></div>
            </div>
          }
        />
        <MetricCard
          label="LATENCY"
          value={`${systemStatus?.event_loop_lag ?? 0}`}
          unit="ms"
          icon={
            <div className="w-10 h-6 bg-cyan-900/50 rounded-sm overflow-hidden flex items-end gap-0.5 px-0.5 pb-0.5">
              <div className="w-1 bg-emerald-500 h-4"></div>
              <div className="w-1 bg-emerald-400 h-2"></div>
              <div className="w-1 bg-emerald-500 h-3"></div>
              <div className="w-1 bg-emerald-300 h-1"></div>
            </div>
          }
        />
        <MetricCard
          label="DISK"
          value={`${systemStatus?.disk_percent ?? 0}%`}
          icon={
            <div className="w-10 h-6 bg-cyan-900/50 rounded-sm overflow-hidden flex items-end gap-0.5 px-0.5 pb-0.5">
              <div className="w-1 bg-amber-500 h-2"></div>
              <div className="w-1 bg-amber-400 h-3"></div>
              <div className="w-1 bg-amber-500 h-5"></div>
              <div className="w-1 bg-amber-300 h-4"></div>
            </div>
          }
        />
      </div>

      <div className="flex items-center gap-4">
        <div className="flex bg-slate-900 border border-slate-700 rounded-full p-0.5">
          <button className="px-3 py-1 text-xs font-mono font-bold tracking-widest rounded-full bg-slate-800 text-cyan-400">
            EN / HI
          </button>
        </div>
        <Button
          variant="ghost"
          size="sm"
          className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-cyan-400"
        >
          <Sun size={18} />
        </Button>
        <div className="relative">
          <Button
            variant="ghost"
            size="sm"
            className="rounded-full w-10 h-10 p-0 text-slate-400 hover:text-cyan-400"
          >
            <Bell size={18} />
          </Button>
          <span className="absolute top-1 right-1 w-4 h-4 bg-red-500 text-white text-[10px] font-bold flex items-center justify-center rounded-full border-2 border-slate-950">
            3
          </span>
        </div>
        <div className="w-10 h-10 rounded-full bg-cyan-950 border border-cyan-500/50 overflow-hidden shadow-[0_0_10px_rgba(6,182,212,0.3)]">
          <img
            src="https://api.dicebear.com/7.x/bottts/svg?seed=JARVIS&colors=cyan"
            alt="AI Core"
            className="w-full h-full object-cover p-1"
          />
        </div>
      </div>
    </header>
  );
}

function MetricCard({
  label,
  value,
  unit,
  icon,
}: {
  label: string;
  value: string;
  unit?: string;
  icon: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 bg-slate-900/50 border border-slate-800 rounded-lg px-4 py-2 min-w-[140px]">
      <div className="flex flex-col">
        <span className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">
          {label}
        </span>
        <div className="flex items-baseline gap-1">
          <span className="text-xl font-display font-bold text-slate-200">
            {value}
          </span>
          {unit && (
            <span className="text-xs text-slate-500 font-mono tracking-widest">{unit}</span>
          )}
        </div>
      </div>
      <div className="ml-auto opacity-70">{icon}</div>
    </div>
  );
}
