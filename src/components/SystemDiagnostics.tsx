import { FC } from 'react';
import { motion } from 'framer-motion';
import { Cpu, HardDrive, Battery, Network, Globe, Activity } from 'lucide-react';

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
    active_window?: { title: string; process: string } | null;
    context_suggestion?: string | null;
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

  const Gauge = ({ percent, label, sublabel, index }: { percent: number; label: string; sublabel: string; index: number }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: index * 0.1, duration: 0.5 }}
        className="flex flex-col items-center justify-center"
      >
        <div className="relative w-20 h-20 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            <circle
              cx="40"
              cy="40"
              r={radius}
              stroke="var(--border-default)"
              strokeWidth="3"
              fill="transparent"
            />
            <motion.circle
              initial={{ strokeDashoffset: circumference }}
              animate={{ strokeDashoffset: offset }}
              transition={{ duration: 1.5, ease: "easeInOut" }}
              cx="40"
              cy="40"
              r={radius}
              stroke="var(--accent)"
              strokeWidth="3"
              strokeDasharray={circumference}
              fill="transparent"
              strokeLinecap="round"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-sm font-bold text-foreground">{Math.round(percent)}%</span>
            <span className="text-[7px] text-foreground-muted uppercase tracking-widest">{label}</span>
          </div>
        </div>
        <span className="text-[9px] text-foreground-muted font-mono mt-1 opacity-60">{sublabel}</span>
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
      <div className="flex items-center gap-3">
        <Activity className="w-4 h-4 text-accent" />
        <h3 className="text-xs font-bold uppercase tracking-[0.2em] text-foreground">Diagnostics</h3>
        <div className="h-px flex-1 bg-border-default"></div>
      </div>

      {/* Main Stats Card */}
      <div className="glass-panel p-5 space-y-6">
        <div className="flex justify-around items-center">
          <Gauge 
            percent={systemStatus.cpu.percent} 
            label="CPU" 
            sublabel={`${systemStatus.cpu.count} Cores`} 
            index={0}
          />
          <Gauge 
            percent={systemStatus.memory.percent} 
            label="RAM" 
            sublabel={formatBytes(systemStatus.memory.used)} 
            index={1}
          />
        </div>

        {/* List Stats */}
        <div className="space-y-4 pt-4 border-t border-border-default">
          {systemStatus.battery && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <div className="flex items-center gap-2 text-foreground-muted">
                  <Battery className="w-3 h-3" />
                  <span>GRID_ENERGY</span>
                </div>
                <span className={systemStatus.battery.is_charging ? "text-accent" : "text-foreground"}>
                  {systemStatus.battery.percent}%
                </span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${systemStatus.battery.percent || 0}%` }}
                  className="h-full bg-accent shadow-[0_0_8px_var(--accent)]"
                />
              </div>
            </div>
          )}

          {systemStatus.disk && (
            <div className="space-y-1.5">
              <div className="flex justify-between items-center text-[10px] font-mono">
                <div className="flex items-center gap-2 text-foreground-muted">
                  <HardDrive className="w-3 h-3" />
                  <span>MASS_STORAGE</span>
                </div>
                <span className="text-foreground">{systemStatus.disk.percent}%</span>
              </div>
              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                <motion.div 
                  initial={{ width: 0 }}
                  animate={{ width: `${systemStatus.disk.percent}%` }}
                  className="h-full bg-accent/60"
                />
              </div>
            </div>
          )}

          {systemStatus.network && (
            <div className="pt-2">
              <div className="flex justify-between items-center text-[9px] font-mono text-foreground-muted uppercase tracking-tight">
                <div className="flex items-center gap-4">
                   <div className="flex flex-col">
                      <span>Up: {formatBytes(systemStatus.network.bytes_sent)}</span>
                   </div>
                   <div className="flex flex-col">
                      <span>Down: {formatBytes(systemStatus.network.bytes_recv)}</span>
                   </div>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse"></div>
                  <span>Uplink_Active</span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Platform & Context Information */}
      <div className="space-y-3">
        {systemStatus.active_window && (
          <div className="glass-panel p-3 bg-white/[0.02] border-l-2 border-accent/40">
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-accent uppercase tracking-widest font-bold">Active_Context</span>
              <span className="text-[10px] text-foreground truncate font-mono">
                {systemStatus.active_window.title}
              </span>
              <span className="text-[8px] text-foreground-muted uppercase tracking-tighter">
                PID: {systemStatus.active_window.process}
              </span>
            </div>
          </div>
        )}

        {systemStatus.context_suggestion && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-panel p-3 bg-accent/5 border border-accent/20"
          >
            <div className="flex flex-col gap-1">
              <span className="text-[7px] text-accent uppercase tracking-widest font-bold animate-pulse">Proactive_Insight</span>
              <p className="text-[10px] text-foreground leading-relaxed">
                {systemStatus.context_suggestion}
              </p>
            </div>
          </motion.div>
        )}

        <div className="glass-panel p-3 flex justify-between items-center bg-white/[0.02]">
          <div className="flex items-center gap-2">
            <Globe className="w-3 h-3 text-foreground-muted" />
            <span className="text-[9px] font-mono text-foreground-muted uppercase tracking-widest">{systemStatus.platform || 'LOCAL_HOST'}</span>
          </div>
          <span className="text-[9px] font-mono text-accent">STABLE</span>
        </div>
      </div>
    </motion.div>
  );
};
