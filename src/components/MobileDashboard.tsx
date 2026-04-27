import { FC, useEffect, useState, memo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Activity, Zap, Shield, Cpu, Database, Wifi, AlertTriangle } from 'lucide-react';
import { useJarvisBridge } from '../hooks/useJarvisBridge';

export const MobileDashboard: FC = () => {
  const { isConnected, systemStatus, connectionStatus } = useJarvisBridge();
  const { notifications } = useNotifications();
  const [lastUpdate, setLastUpdate] = useState<string>(new Date().toLocaleTimeString());

  useEffect(() => {
    if (systemStatus) {
      setLastUpdate(new Date().toLocaleTimeString());
    }
  }, [systemStatus]);

  if (connectionStatus === 'connecting') {
    return (
      <div className="min-h-screen bg-[#030508] flex flex-col items-center justify-center p-6 text-center">
        <div className="w-16 h-16 border-4 border-accent/20 border-t-accent rounded-full animate-spin mb-6" />
        <h1 className="text-xl font-bold text-foreground mb-2">Neural Link Initiating</h1>
        <p className="text-sm text-foreground-muted">Synchronizing with JARVIS-MAIN...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#030508] text-foreground font-sans overflow-x-hidden pb-10">
      {/* Header */}
      <header className="p-6 border-b border-white/5 bg-black/40 backdrop-blur-xl sticky top-0 z-50 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20">
            <Smartphone className="w-6 h-6 text-accent" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight uppercase">JARVIS Lite</h1>
            <p className="text-[10px] font-mono text-accent tracking-widest uppercase">Remote_Sync: {isConnected ? 'Active' : 'Offline'}</p>
          </div>
        </div>
        <div className={`px-3 py-1 rounded-full text-[10px] font-bold border transition-colors ${isConnected ? 'bg-green-500/10 border-green-500/30 text-green-400' : 'bg-red-500/10 border-red-500/30 text-red-400'}`}>
          {isConnected ? 'STABLE' : 'LOST'}
        </div>
      </header>

      <main className="p-4 space-y-4 max-w-md mx-auto">
        {/* Proactive Alerts Feed */}
        <AnimatePresence>
          {notifications.filter(n => n.type === 'error' || n.type === 'warning').map((notif, idx) => (
            <motion.div
              key={notif.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 20 }}
              className={`p-4 rounded-2xl border flex gap-3 ${
                notif.type === 'error' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'
              }`}
            >
              <AlertTriangle className={`w-5 h-5 shrink-0 ${notif.type === 'error' ? 'text-red-500' : 'text-amber-500'}`} />
              <div>
                <h4 className={`text-[10px] font-bold uppercase tracking-widest ${notif.type === 'error' ? 'text-red-400' : 'text-amber-400'}`}>
                  {notif.title}
                </h4>
                <p className="text-xs text-white/80 mt-1">{notif.message}</p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {/* Core Stats Grid */}
        <div className="grid grid-cols-2 gap-3">
          <StatCard 
            icon={<Cpu className="w-4 h-4" />} 
            label="Processor" 
            value={systemStatus?.cpu_percent || 0} 
            unit="%" 
            color={systemStatus?.cpu_percent && systemStatus.cpu_percent > 80 ? "red" : "indigo"} 
          />
          <StatCard 
            icon={<Database className="w-4 h-4" />} 
            label="Memory" 
            value={systemStatus?.memory_percent || 0} 
            unit="%" 
            color={systemStatus?.memory_percent && systemStatus.memory_percent > 85 ? "red" : "purple"} 
          />
        </div>

        {/* Neural Security Status */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 border-red-500/20 bg-red-500/5 rounded-2xl"
        >
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-red-500" />
              <h2 className="text-xs font-bold uppercase tracking-widest text-red-500">Neural Security</h2>
            </div>
            <span className="px-2 py-0.5 rounded-full bg-green-500/20 text-green-400 text-[8px] font-bold uppercase tracking-widest">Encrypted</span>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Process Guardian</span>
                <span className="text-[8px] text-foreground-muted font-mono uppercase tracking-widest mt-0.5">Monitoring Active PIDs</span>
              </div>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
            </div>
            <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
              <div className="flex flex-col">
                <span className="text-[10px] text-white/90 font-bold uppercase tracking-widest">Deep Network Scan</span>
                <span className="text-[8px] text-foreground-muted font-mono uppercase tracking-widest mt-0.5">Established Connections</span>
              </div>
              <span className="text-[10px] font-mono text-cyan-400 font-bold">SCANNING</span>
            </div>
          </div>
        </motion.div>

        {/* Active Context Card */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="glass-panel p-5 border-accent/20 bg-accent/5 rounded-2xl"
        >
          <div className="flex items-center gap-2 mb-4">
            <Activity className="w-4 h-4 text-accent" />
            <h2 className="text-xs font-bold uppercase tracking-widest">Active Context</h2>
          </div>
          <div className="p-4 bg-black/40 rounded-xl border border-white/5">
            <p className="text-[10px] text-foreground-muted uppercase tracking-tighter mb-1">Foreground_Process</p>
            <p className="text-lg font-bold truncate text-foreground">
              {systemStatus?.active_window || 'System Standby'}
            </p>
          </div>
        </motion.div>

        {/* Proactive Insights */}
        <AnimatePresence>
          {systemStatus?.context_suggestion && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="glass-panel p-5 border-amber-500/20 bg-amber-500/5 rounded-2xl"
            >
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-amber-500" />
                <h2 className="text-xs font-bold uppercase tracking-widest text-amber-500">Proactive Insight</h2>
              </div>
              <p className="text-sm leading-relaxed text-foreground-muted">
                {systemStatus.context_suggestion}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* System Health / Logs */}
        <div className="glass-panel p-5 border-white/10 bg-white/[0.02] rounded-2xl">
          <div className="flex justify-between items-center mb-4">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-green-400" />
              <h2 className="text-xs font-bold uppercase tracking-widest">System Health</h2>
            </div>
            <span className="text-[9px] font-mono text-foreground-muted">REFRESH: {lastUpdate}</span>
          </div>
          
          <div className="space-y-3">
            <HealthItem label="Neural Bridge" status="Optimal" color="text-accent" />
            <HealthItem label="Bilingual Parser" status="Ready" color="text-accent" />
            <HealthItem label="Automation Engine" status="Idle" color="text-foreground-muted" />
          </div>
        </div>

        {/* Remote Actions */}
        <div className="grid grid-cols-2 gap-3 pt-2">
          <ActionButton icon={<Wifi className="w-5 h-5" />} label="Ping Bridge" />
          <ActionButton icon={<AlertTriangle className="w-5 h-5" />} label="Panic Stop" color="text-red-400 border-red-500/20 bg-red-500/5" />
        </div>
      </main>

      <footer className="mt-8 text-center px-6">
        <p className="text-[9px] font-mono text-foreground-muted uppercase tracking-[0.2em]">
          VIPHACKER100 LITE-SYNC v1.0.0
        </p>
      </footer>
    </div>
  );
};

const StatCard = memo(({ icon, label, value, unit, color }: { icon: any; label: string; value: number; unit: string; color: string }) => (
  <div className="glass-panel p-4 border-white/5 bg-white/[0.02] rounded-2xl flex flex-col gap-2">
    <div className={`w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center ${color === 'indigo' ? 'text-accent' : 'text-purple-400'}`}>
      {icon}
    </div>
    <div>
      <p className="text-[10px] text-foreground-muted uppercase tracking-tighter">{label}</p>
      <div className="flex items-baseline gap-1">
        <span className="text-xl font-black">{value}</span>
        <span className="text-[10px] font-bold text-foreground-muted">{unit}</span>
      </div>
    </div>
    <div className="h-1 bg-white/5 rounded-full overflow-hidden">
      <motion.div 
        initial={{ width: 0 }}
        animate={{ width: `${value}%` }}
        className={`h-full ${color === 'indigo' ? 'bg-accent' : 'bg-purple-500'}`}
      />
    </div>
  </div>
));

const HealthItem = memo(({ label, status, color }: { label: string; status: string; color: string }) => (
  <div className="flex justify-between items-center p-3 bg-black/40 rounded-xl border border-white/5">
    <span className="text-[11px] font-bold text-foreground-muted uppercase tracking-tighter">{label}</span>
    <span className={`text-[10px] font-black uppercase ${color}`}>{status}</span>
  </div>
));

const ActionButton = memo(({ icon, label, color = "text-foreground-muted border-white/10 bg-white/[0.02]" }: { icon: any; label: string; color?: string }) => (
  <button className={`flex flex-col items-center justify-center gap-2 p-4 rounded-2xl border transition-all active:scale-95 ${color}`}>
    {icon}
    <span className="text-[10px] font-bold uppercase tracking-widest">{label}</span>
  </button>
));
