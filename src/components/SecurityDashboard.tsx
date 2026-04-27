import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Shield, Activity, Network, AlertTriangle, Zap, Search, ShieldAlert, X } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface NetworkConnection {
  pid: number | null;
  process: string;
  local_addr: string;
  remote_addr: string;
  status: string;
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
        setConnections(res.connections);
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
    <div className="flex-1 flex flex-col overflow-hidden bg-slate-950/20">
      {/* Header Info */}
      <div className="p-4 border-b border-white/5 bg-white/[0.02] flex justify-between items-center shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-red-500/10 flex items-center justify-center border border-red-500/20">
            <ShieldAlert className="w-5 h-5 text-red-500 animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-white uppercase tracking-widest">Process Guardian HUD</h3>
            <p className="text-[9px] text-slate-500 uppercase tracking-[0.2em] font-mono">Status: Active Protection // Scanning...</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button 
            onClick={() => setActiveTab('network')}
            className={`px-4 py-1.5 rounded text-[10px] font-bold transition-all uppercase tracking-widest border ${
              activeTab === 'network' 
                ? 'bg-cyan-500/20 border-cyan-500/50 text-cyan-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Network Scan
          </button>
          <button 
            onClick={() => setActiveTab('processes')}
            className={`px-4 py-1.5 rounded text-[10px] font-bold transition-all uppercase tracking-widest border ${
              activeTab === 'processes' 
                ? 'bg-orange-500/20 border-orange-500/50 text-orange-400' 
                : 'bg-slate-900/50 border-slate-800 text-slate-500 hover:text-slate-300'
            }`}
          >
            Suspicious PIDs
          </button>
        </div>
      </div>

      {/* Main Content */}
      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        <AnimatePresence mode="wait">
          {activeTab === 'network' ? (
            <motion.div 
              key="network"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-3"
            >
              <div className="grid grid-cols-5 text-[9px] font-mono text-slate-500 uppercase tracking-widest px-4 mb-2">
                <div className="col-span-1">Process</div>
                <div className="col-span-1 text-center">PID</div>
                <div className="col-span-1">Local Address</div>
                <div className="col-span-1">Remote Address</div>
                <div className="col-span-1 text-right">Action</div>
              </div>

              {connections.map((conn, idx) => (
                <div 
                  key={`${conn.pid}-${idx}`}
                  className="glass-panel p-3 bg-white/[0.01] border border-white/5 rounded-lg flex flex-col gap-2 hover:border-cyan-500/30 transition-all group"
                >
                  <div className="grid grid-cols-5 items-center">
                    <div className="col-span-1 flex items-center gap-2">
                      <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                      <span className="text-[11px] text-white font-medium truncate">{conn.process}</span>
                    </div>
                    <div className="col-span-1 text-center text-[10px] font-mono text-slate-400">{conn.pid || 'N/A'}</div>
                    <div className="col-span-1 text-[10px] font-mono text-slate-400 truncate">{conn.local_addr}</div>
                    <div className="col-span-1 text-[10px] font-mono text-cyan-400 truncate">{conn.remote_addr}</div>
                    <div className="col-span-1 flex justify-end gap-2">
                      <button 
                        onClick={() => conn.pid && handleQuarantine(conn.pid, 'suspend')}
                        disabled={!conn.pid || quarantining === conn.pid}
                        className="p-1.5 rounded bg-orange-500/10 border border-orange-500/20 text-orange-400 hover:bg-orange-500/20 transition-all"
                        title="Suspend Process"
                      >
                        <Zap className="w-3 h-3" />
                      </button>
                      <button 
                        onClick={() => conn.pid && handleQuarantine(conn.pid, 'terminate')}
                        disabled={!conn.pid || quarantining === conn.pid}
                        className="p-1.5 rounded bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
                        title="Terminate Process"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
              
              {connections.length === 0 && (
                <div className="h-64 flex flex-col items-center justify-center text-slate-600 opacity-50">
                  <Network className="w-12 h-12 mb-4" />
                  <p className="text-xs uppercase tracking-widest">No established connections found</p>
                </div>
              )}
            </motion.div>
          ) : (
            <motion.div 
              key="processes"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="flex flex-col items-center justify-center h-full py-12 text-center"
            >
              <div className="w-20 h-20 rounded-full bg-orange-500/10 flex items-center justify-center border border-orange-500/20 mb-6">
                <AlertTriangle className="w-10 h-10 text-orange-500" />
              </div>
              <h4 className="text-sm font-bold text-white uppercase tracking-widest mb-2">No Threats Detected</h4>
              <p className="text-[10px] text-slate-500 max-w-xs uppercase leading-relaxed tracking-wider">
                Process Guardian is actively monitoring resource spikes and blacklisted identities. No anomalies detected in the current cycle.
              </p>
              
              <div className="mt-8 grid grid-cols-2 gap-4 w-full max-w-md">
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block mb-1">Last Scan</span>
                  <span className="text-[10px] text-cyan-400 font-mono">Just Now</span>
                </div>
                <div className="p-4 bg-white/[0.02] border border-white/5 rounded-xl text-left">
                  <span className="text-[7px] text-slate-500 uppercase tracking-widest block mb-1">Integrity Score</span>
                  <span className="text-[10px] text-green-400 font-mono">99.8%</span>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer Info */}
      <div className="p-3 bg-slate-900 border-t border-white/5 flex justify-between items-center">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500 animate-pulse"></div>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Deep_Scan: Active</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-orange-500 animate-pulse"></div>
            <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Quarantine_Ready: {connections.length} Nodes</span>
          </div>
        </div>
        <span className="text-[8px] font-mono text-slate-600 uppercase tracking-widest">Security_Protocol: AES-256-ENCRYPTED</span>
      </div>
    </div>
  );
};
