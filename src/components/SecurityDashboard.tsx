import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Network, AlertTriangle, Zap, Search, ShieldAlert, X, Terminal, Lock } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface NetworkConnection {
  pid: number | null;
  name: string;
  local_addr?: string;
  remote_addr?: string;
  status: string;
  type?: string;
}

export const SecurityDashboard: FC = () => {
  const [connections, setConnections] = useState<NetworkConnection[]>([]);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'network' | 'processes'>('network');
  const [quarantining, setQuarantining] = useState<number | null>(null);

  useEffect(() => {
    loadSecurityData();
    const interval = setInterval(loadSecurityData, 5000); // Auto-refresh every 5s
    return () => clearInterval(interval);
  }, []);

  const loadSecurityData = async () => {
    try {
      const res = await apiClient.getNetworkScan();
      if (res.success) {
        setConnections(res.connections || []);
      }
    } catch (error) {
      console.error("Failed to load security data:", error);
    }
  };

  const handleQuarantine = async (pid: number, action: 'suspend' | 'resume' | 'terminate') => {
    setQuarantining(pid);
    try {
      const res = await apiClient.quarantineProcess(pid, action);
      if (res.success) {
        loadSecurityData();
      }
    } catch (error) {
      console.error(`Failed to ${action} process ${pid}:`, error);
    }
    setQuarantining(null);
  };

  return (
    <div className="flex-1 flex flex-col overflow-hidden bg-black/40 relative">
      <div className="absolute inset-0 scanline opacity-10 pointer-events-none" />
      
      {/* Header Info */}
      <div className="p-6 border-b border-white/10 bg-white/[0.02] flex flex-col md:flex-row justify-between items-start md:items-center gap-6 shrink-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
          <Lock className="w-24 h-24 text-security-rose" />
        </div>
        
        <div className="flex items-center gap-5">
          <div className="w-12 h-12 rounded-sm bg-security-rose/10 flex items-center justify-center border border-security-rose/30 relative">
            <ShieldAlert className="w-6 h-6 text-security-rose animate-pulse" />
            <div className="absolute inset-0 bg-security-rose/5 animate-ping rounded-sm" />
          </div>
          <div>
            <h3 className="label-caps text-sm font-bold text-white tracking-[0.3em]">Guardian_Intercept_HUD</h3>
            <div className="flex items-center gap-3 mt-1">
              <span className="label-caps text-[9px] text-security-rose font-bold animate-shimmer bg-security-rose/10 px-2 py-0.5 rounded-sm">Status: Active_Defense</span>
              <span className="label-caps text-[9px] text-foreground-muted opacity-40 font-mono tracking-widest">Protocol: Neural_Shield_V4</span>
            </div>
          </div>
        </div>

        <div className="flex bg-black/40 p-1 rounded-sm border border-white/10">
          <button 
            onClick={() => setActiveTab('network')}
            className={`px-6 py-2 rounded-sm label-caps text-[10px] font-bold transition-all tracking-[0.2em] ${
              activeTab === 'network' 
                ? 'bg-accent/20 text-accent border border-accent/30' 
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Network_Mesh
          </button>
          <button 
            onClick={() => setActiveTab('processes')}
            className={`px-6 py-2 rounded-sm label-caps text-[10px] font-bold transition-all tracking-[0.2em] ${
              activeTab === 'processes' 
                ? 'bg-security-rose/20 text-security-rose border border-security-rose/30' 
                : 'text-foreground-muted hover:text-foreground'
            }`}
          >
            Suspicious_Nodes
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-6 custom-scrollbar relative">
        <AnimatePresence mode="wait">
          {activeTab === 'network' ? (
            <motion.div 
              key="network"
              initial={{ opacity: 0, scale: 0.98 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.02 }}
              className="space-y-4"
            >
              <div className="grid grid-cols-6 label-caps text-[8px] font-mono text-foreground-muted tracking-[0.3em] px-4 mb-2 opacity-50">
                <div className="col-span-2">Origin_Process</div>
                <div className="col-span-1 text-center">Node_ID</div>
                <div className="col-span-1">Local_Address</div>
                <div className="col-span-1">Remote_Address</div>
                <div className="col-span-1 text-right">Overrides</div>
              </div>

              {connections && connections.map((conn, idx) => (
                <motion.div 
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: idx * 0.05 }}
                  key={`${conn.pid}-${idx}`}
                  className="hud-panel p-4 bg-white/[0.01] border-white/5 hover:border-accent/30 transition-all group relative overflow-hidden"
                >
                  <div className="absolute top-0 left-0 w-1 h-full bg-accent/20 group-hover:bg-accent transition-colors" />
                  <div className="grid grid-cols-6 items-center">
                    <div className="col-span-2 flex items-center gap-4">
                      <div className="w-2 h-2 rounded-full bg-accent shadow-[0_0_8px_var(--accent)]" />
                      <div className="flex flex-col">
                        <span className="text-xs text-white font-mono font-bold tracking-tight">{conn.name || 'ANONYMOUS_PROC'}</span>
                        <span className="text-[7px] label-caps opacity-30 tracking-widest">{conn.type || 'TCP_SOCKET'}</span>
                      </div>
                    </div>
                    <div className="col-span-1 text-center font-mono text-[10px] text-foreground-muted/60 bg-white/5 py-1 rounded-sm">{conn.pid || 'KERN'}</div>
                    <div className="col-span-1 text-[10px] font-mono text-foreground-muted/80 truncate px-2">{conn.local_addr}</div>
                    <div className="col-span-1 text-[10px] font-mono text-accent truncate px-2">{conn.remote_addr}</div>
                    <div className="col-span-1 flex justify-end gap-3">
                      <button 
                        onClick={() => conn.pid && handleQuarantine(conn.pid, 'suspend')}
                        disabled={!conn.pid || quarantining === conn.pid}
                        className="p-2 rounded-sm bg-security-rose/10 border border-security-rose/30 text-security-rose hover:bg-security-rose/20 transition-all disabled:opacity-30"
                        title="Freeze Memory State"
                      >
                        <Zap className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => conn.pid && handleQuarantine(conn.pid, 'terminate')}
                        disabled={!conn.pid || quarantining === conn.pid}
                        className="p-2 rounded-sm bg-security-rose/20 border border-security-rose/40 text-security-rose hover:bg-security-rose/40 transition-all disabled:opacity-30"
                        title="Expunge Process"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </motion.div>
              ))}
              
              {connections?.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-foreground-muted/40 border border-dashed border-white/10 rounded-sm">
                  <Network className="w-16 h-16 mb-4 opacity-20" />
                  <p className="label-caps text-xs tracking-[0.4em]">No established_connections_mapped</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="processes"
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.05 }}
              className="flex flex-col items-center justify-center h-full py-20 text-center relative"
            >
              <div className="relative mb-10">
                <div className="w-32 h-32 rounded-sm bg-accent/5 flex items-center justify-center border border-accent/20 relative z-10">
                  <Terminal className="w-12 h-12 text-accent" />
                </div>
                <div className="absolute inset-0 bg-accent/5 animate-ping rounded-sm" />
                <div className="absolute -top-4 -left-4 w-8 h-8 border-t-2 border-l-2 border-accent/40" />
                <div className="absolute -bottom-4 -right-4 w-8 h-8 border-b-2 border-r-2 border-accent/40" />
              </div>
              
              <h4 className="label-caps text-lg font-bold text-white tracking-[0.5em] mb-4">Zero_Vulnerabilities_Found</h4>
              <p className="label-caps text-[10px] text-foreground-muted max-w-md uppercase leading-loose tracking-[0.2em] opacity-60 px-6">
                Process Guardian has mapped all resident neural identities. No heuristic anomalies or unauthorized kernel injections detected in the current sub-cycle.
              </p>
              
              <div className="mt-12 grid grid-cols-2 gap-6 w-full max-w-lg">
                <div className="hud-panel p-5 bg-accent/[0.03] border-accent/10 text-left relative overflow-hidden">
                   <div className="absolute top-0 right-0 w-16 h-16 bg-accent/[0.05] -rotate-45 translate-x-8 -translate-y-8" />
                  <span className="label-caps text-[8px] text-accent font-bold tracking-widest block mb-2">LAST_INTEGRITY_SYNC</span>
                  <span className="text-xl font-mono text-white tracking-tighter">JUST_NOW</span>
                  <div className="h-1 w-full bg-accent/20 mt-3 rounded-full overflow-hidden">
                    <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1 }} className="h-full bg-accent" />
                  </div>
                </div>
                <div className="hud-panel p-5 bg-neural-purple/[0.03] border-neural-purple/10 text-left relative overflow-hidden">
                  <div className="absolute top-0 right-0 w-16 h-16 bg-neural-purple/[0.05] -rotate-45 translate-x-8 -translate-y-8" />
                  <span className="label-caps text-[8px] text-neural-purple font-bold tracking-widest block mb-2">THREAT_ISOLATION_INDEX</span>
                  <span className="text-xl font-mono text-white tracking-tighter">100.0<span className="text-xs opacity-40">%</span></span>
                  <div className="h-1 w-full bg-neural-purple/20 mt-3 rounded-full overflow-hidden">
                    <motion.div initial={{ x: '-100%' }} animate={{ x: '0%' }} transition={{ duration: 1.2 }} className="h-full bg-neural-purple" />
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-black/60 border-t border-white/10 flex flex-col md:flex-row justify-between items-center gap-4 relative">
        <div className="absolute top-0 left-0 w-full h-px bg-gradient-to-r from-transparent via-accent/30 to-transparent" />
        <div className="flex items-center gap-8">
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-accent animate-pulse shadow-[0_0_10px_rgba(76,215,246,0.5)]" />
            <span className="label-caps text-[9px] font-bold text-foreground-subtle tracking-widest">Heuristic_Deep_Scan: Engaged</span>
          </div>
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-security-rose animate-pulse shadow-[0_0_10px_rgba(255,59,105,0.5)]" />
            <span className="label-caps text-[9px] font-bold text-foreground-subtle tracking-widest">Isolation_Zone: Ready</span>
          </div>
        </div>
        <div className="flex items-center gap-4 opacity-40">
           <span className="label-caps text-[8px] font-mono tracking-widest">Nodes_In_Buffer: {connections?.length || 0}</span>
           <div className="h-4 w-px bg-white/10" />
           <span className="label-caps text-[8px] font-mono tracking-widest">Cipher: POLYMORPHIC_CRYPTO</span>
        </div>
      </div>
    </div>
  );
};
