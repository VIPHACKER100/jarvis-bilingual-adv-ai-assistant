import { FC } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Battery, Network, Globe, Activity, Zap, ShieldAlert } from 'lucide-react';
import { PerformanceHistory } from './PerformanceHistory';
import { CommandInsights } from './CommandInsights';
import { PersonalitySwitcher } from './PersonalitySwitcher';

interface SystemDiagnosticsProps {
  systemStatus: {
    cpu: { percent: number; count: number };
    memory: { used: number; total: number; percent: number };
    disk?: { used: number; total: number; percent: number };
    network?: { bytes_sent: number; bytes_recv: number };
    battery?: { percent: number | null; is_charging: boolean | null };
    volume?: number;
    uptime?: number;
    platform?: string;
    active_window?: { title: string; process: string } | string | null;
    context_suggestion?: string | null;
    event_loop_lag?: number;
    personality?: { id: string; name: string; accent: string; primary: string; style: string } | string;
  } | null;
}

export const SystemDiagnostics: FC<SystemDiagnosticsProps> = ({ systemStatus }) => {
  if (!systemStatus) return null;

  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const Gauge = ({ percent, label, sublabel, index, color = "var(--accent)" }: { percent: number; label: string; sublabel: string; index: number; color?: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <motion.div 
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        transition={{ delay: index * 0.1 }}
        className="flex flex-col items-center justify-center p-4 rounded-sm border border-white/5 bg-white/[0.01] relative overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-white/20" />
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="rgba(255,255,255,0.05)"
              strokeWidth="4"
              fill="transparent"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "circOut" }}
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth="4"
              strokeDasharray={circumference}
              fill="transparent"
              strokeLinecap="butt"
              className="drop-shadow-[0_0_8px_rgba(76,215,246,0.3)]"
            />
            {/* Tick Markers */}
            {[0, 90, 180, 270].map(angle => (
              <line
                key={angle}
                x1="48" y1="8" x2="48" y2="12"
                stroke="white" strokeOpacity="0.2" strokeWidth="1"
                transform={`rotate(${angle} 48 48)`}
              />
            ))}
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-xl font-bold text-foreground font-mono tracking-tighter">{Math.round(percent)}<span className="text-[10px] opacity-40">%</span></span>
            <span className="label-caps text-[8px] text-foreground-subtle mt-1">{label}</span>
          </div>
        </div>
        <span className="text-[9px] text-foreground-muted font-mono mt-3 opacity-60 tracking-wider bg-white/5 px-2 py-0.5 rounded-full">{sublabel}</span>
      </motion.div>
    );
  };

  return (
    <motion.div 
      initial={{ opacity: 0, x: -20 }}
      animate={{ opacity: 1, x: 0 }}
      className="w-full flex flex-col gap-6"
    >
      {/* Header Badge */}
      <div className="flex items-center gap-4 px-2">
        <div className="w-8 h-8 rounded-sm bg-accent/10 flex items-center justify-center border border-accent/30">
          <Activity className="w-4 h-4 text-accent" />
        </div>
        <div className="flex flex-col">
          <h3 className="label-caps text-xs font-bold text-foreground tracking-[0.2em]">Diagnostics_Terminal</h3>
          <p className="text-[8px] font-mono text-foreground-muted opacity-50 uppercase">Session: {new Date().toISOString().split('T')[0]} // Kernel: V3.9.0</p>
        </div>
        <div className="h-px flex-1 bg-gradient-to-r from-accent/30 to-transparent ml-4"></div>
      </div>

      {/* Main Stats Card */}
      <div className="hud-panel p-6 space-y-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-2 opacity-10 pointer-events-none">
          <Zap className="w-16 h-16 text-accent" />
        </div>
        
        <div className="grid grid-cols-2 gap-4">
          <Gauge 
            percent={systemStatus.cpu.percent} 
            label="CPU_LOAD" 
            sublabel={`${systemStatus.cpu.count} CORES_ACTIVE`} 
            index={0}
          />
          <Gauge 
            percent={systemStatus.memory.percent} 
            label="MEMORY_BUFFER" 
            sublabel={formatBytes(systemStatus.memory.used)} 
            index={1}
            color="var(--neural-purple)"
          />
        </div>

        {/* List Stats */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 pt-6 border-t border-white/5">
          {systemStatus.battery && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-foreground-subtle">
                  <Battery className="w-3.5 h-3.5 text-accent" />
                  <span className="label-caps text-[9px] tracking-widest font-bold">ARC_CORE_CHARGE</span>
                </div>
                <span className={`font-mono text-xs ${systemStatus.battery.is_charging ? "text-accent animate-pulse" : "text-foreground"}`}>
                  {systemStatus.battery.percent}%
                </span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${systemStatus.battery.percent || 0}%` }}
                  className="h-full bg-accent shadow-[0_0_12px_rgba(76,215,246,0.5)] rounded-full"
                />
              </div>
            </div>
          )}

          {systemStatus.disk && (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-2 text-foreground-subtle">
                  <HardDrive className="w-3.5 h-3.5 text-neural-purple" />
                  <span className="label-caps text-[9px] tracking-widest font-bold">DATAFRAME_STABILITY</span>
                </div>
                <span className="font-mono text-xs text-foreground">{systemStatus.disk.percent}%</span>
              </div>
              <div className="h-1.5 bg-white/5 rounded-full overflow-hidden border border-white/5 p-[1px]">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${systemStatus.disk.percent}%` }}
                  className="h-full bg-neural-purple shadow-[0_0_12px_rgba(168,85,247,0.4)] rounded-full"
                />
              </div>
            </div>
          )}
        </div>

        {systemStatus.network && (
          <div className="pt-4 border-t border-white/5">
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-white/[0.02] p-3 border border-white/5 rounded-sm">
                <span className="label-caps text-[8px] text-foreground-muted block mb-2">Network_Inbound</span>
                <div className="flex items-center justify-between">
                  <Network className="w-3 h-3 text-accent opacity-50" />
                  <span className="text-xs font-mono text-foreground">{formatBytes(systemStatus.network.bytes_recv)}</span>
                </div>
              </div>
              <div className="bg-white/[0.02] p-3 border border-white/5 rounded-sm">
                <span className="label-caps text-[8px] text-foreground-muted block mb-2">Network_Outbound</span>
                <div className="flex items-center justify-between">
                  <Globe className="w-3 h-3 text-neural-purple opacity-50" />
                  <span className="text-xs font-mono text-foreground">{formatBytes(systemStatus.network.bytes_sent)}</span>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Loop Health Indicators */}
        {systemStatus.event_loop_lag !== undefined && (
          <div className="pt-6 border-t border-white/5 space-y-4">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-3">
                <div className={`p-2 rounded-sm ${systemStatus.event_loop_lag > 50 ? 'bg-security-rose/10 border border-security-rose/30' : 'bg-accent/10 border border-accent/30'}`}>
                  <Activity className={`w-4 h-4 ${systemStatus.event_loop_lag > 50 ? 'text-security-rose animate-pulse' : 'text-accent'}`} />
                </div>
                <div>
                  <span className="label-caps text-[10px] font-bold block">Kernel_Heartbeat</span>
                  <span className="text-[8px] font-mono text-foreground-muted uppercase opacity-40">System_Event_Loop_Monitor</span>
                </div>
              </div>
              <div className="text-right">
                <span className={`text-lg font-mono font-bold block leading-none ${systemStatus.event_loop_lag > 50 ? "text-security-rose" : "text-accent"}`}>
                  {systemStatus.event_loop_lag.toFixed(1)}<span className="text-[10px] font-normal opacity-50 ml-1">ms</span>
                </span>
                <span className={`label-caps text-[8px] font-bold ${systemStatus.event_loop_lag < 20 ? "text-accent" : (systemStatus.event_loop_lag < 100 ? "text-yellow-500" : "text-security-rose")}`}>
                  {systemStatus.event_loop_lag < 20 ? "STATUS: OPTIMAL" : (systemStatus.event_loop_lag < 100 ? "STATUS: DEGRADED" : "STATUS: CRITICAL")}
                </span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Performance Analytics Chart */}
      <PerformanceHistory />

      {/* Command Behavioral Insights */}
      <CommandInsights />

      {/* Personality / Theme Switcher */}
      <PersonalitySwitcher
        currentPersonality={typeof systemStatus.personality === 'string' ? systemStatus.personality : systemStatus.personality?.id}
        onSwitch={(id) => console.info('[JARVIS] Personality switched to:', id)}
      />

      {/* Platform & Context Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {systemStatus.active_window && (
          <div className="hud-panel p-4 bg-accent/5 border-l-4 border-l-accent border-white/10">
            <div className="flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <span className="label-caps text-[9px] text-accent font-bold">Active_Runtime_Context</span>
                <ShieldAlert className="w-3 h-3 text-accent/40" />
              </div>
              <span className="text-xs text-foreground truncate font-mono bg-black/20 p-2 rounded-sm border border-white/5">
                {typeof systemStatus.active_window === 'object' ? systemStatus.active_window.title : systemStatus.active_window}
              </span>
              <span className="text-[8px] text-foreground-muted uppercase tracking-widest font-mono opacity-40">
                PROCES_ID: {typeof systemStatus.active_window === 'object' ? systemStatus.active_window.process : 'INTERNAL_KERNEL'}
              </span>
            </div>
          </div>
        )}

        {systemStatus.context_suggestion && (
          <motion.div 
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="hud-panel p-4 bg-neural-purple/[0.08] border-l-4 border-l-neural-purple border-white/10 relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 p-2 opacity-10">
              <Activity className="w-8 h-8 text-neural-purple" />
            </div>
            <div className="flex flex-col gap-2">
              <span className="label-caps text-[9px] text-neural-purple font-bold animate-pulse tracking-[0.2em]">Heuristic_Insight</span>
              <p className="text-[10px] text-foreground leading-relaxed font-sans italic opacity-90">
                "{systemStatus.context_suggestion}"
              </p>
            </div>
          </motion.div>
        )}
      </div>

      <div className="hud-panel p-4 flex justify-between items-center border-white/10 bg-white/[0.01]">
        <div className="flex items-center gap-3">
          <div className="w-6 h-6 rounded-sm bg-white/5 flex items-center justify-center border border-white/10">
            <Globe className="w-3 h-3 text-foreground-subtle" />
          </div>
          <span className="label-caps text-[9px] font-bold text-foreground-muted tracking-widest">{systemStatus.platform || 'LOCAL_NEURAL_HOST'}</span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse shadow-[0_0_8px_var(--accent)]" />
          <span className="label-caps text-[9px] font-bold text-accent tracking-[0.2em]">CONNECTION: STABLE</span>
        </div>
      </div>
    </motion.div>
  );
};
