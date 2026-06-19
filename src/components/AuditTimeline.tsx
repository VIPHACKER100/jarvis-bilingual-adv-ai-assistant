import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Cpu, RefreshCw, Terminal, Search, Filter, ArrowRight } from 'lucide-react';
import { LogLevel } from '../types/api';
import { Card } from './ui/Card';

import { useJarvisBridge } from '../hooks/useJarvisBridge';

import { useJarvisStore } from '../store/jarvisStore';

export const AuditTimeline: FC = () => {
  const { getNeuralLogs } = useJarvisBridge();
  const { neuralLogs, setNeuralLogs } = useJarvisStore();
  const [filter, setFilter] = useState<LogLevel | 'ALL'>('ALL');
  const [searchQuery, setSearchQuery] = useState('');
  const [isLoading, setIsLoading] = useState(true);

  const fetchLogs = async () => {
    try {
      const res = await getNeuralLogs(50);
      if (res.success) {
        setNeuralLogs(res.logs);
      }
    } catch (err) {
      console.error('Failed to fetch neural logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (neuralLogs.length === 0) {
      fetchLogs();
    } else {
      setIsLoading(false);
    }
  }, []);

  const getLevelColor = (level: LogLevel) => {
    switch (level) {
      case 'STABLE': return 'text-accent';
      case 'PROCESSING': return 'text-accent';
      case 'ALERT': return 'text-danger';
      case 'SYNC': return 'text-sync-amber';
      default: return 'text-foreground-muted';
    }
  };

  const filteredLogs = neuralLogs.filter(log => {
    const matchesFilter = filter === 'ALL' || log.level === filter;
    const matchesSearch = log.message.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         log.module.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesFilter && matchesSearch;
  });

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 space-y-10">
      {/* HUD Header & Trace Stats */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-8 border-b border-border-subtle pb-8">
        <div>
          <div className="flex items-center gap-3 mb-3">
            <div className="w-8 h-8 rounded-sm bg-accent/10 border border-accent/30 flex items-center justify-center">
              <Terminal className="w-4 h-4 text-accent" />
            </div>
            <h1 className="text-3xl font-bold tracking-tighter uppercase italic leading-none">
              Audit_<span className="text-accent glow-text">Timeline</span>
            </h1>
          </div>
          <div className="flex items-center gap-4">
            <span className="label-caps opacity-50">TRACE_PROTOCOL // v3.9.0_HEURISTIC</span>
            <div className="h-px w-8 bg-border-subtle" />
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_8px_#4cd7f6]" />
              <span className="text-[10px] font-mono text-accent uppercase tracking-widest">Live_Telemetry</span>
            </div>
          </div>
        </div>

        <div className="flex flex-wrap gap-4">
          <div className="hud-panel px-6 py-3 flex items-center gap-8 bg-surface-low/30">
            <div className="flex flex-col">
              <span className="label-caps text-[9px] opacity-40">Packets</span>
              <span className="text-xl font-bold font-mono text-accent">{neuralLogs.length}</span>
            </div>
            <div className="w-px h-8 bg-border-subtle" />
            <div className="flex flex-col">
              <span className="label-caps text-[9px] opacity-40">Anomalies</span>
              <span className="text-xl font-bold font-mono text-danger">
                {neuralLogs.filter(l => l.level === 'ALERT').length}
              </span>
            </div>
          </div>
          
          {isLoading && (
            <div className="flex items-center gap-3 px-4 py-2 bg-accent/5 border border-accent/20 rounded-sm">
              <RefreshCw className="w-4 h-4 text-accent animate-spin" />
              <span className="text-[10px] font-mono text-accent animate-pulse uppercase tracking-[0.2em]">Syncing_Stream...</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Deck */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="md:col-span-3 relative group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle group-focus-within:text-accent transition-colors" />
          <input 
            type="text"
            placeholder="SEARCH_TRACE_STREAM..."
            className="w-full bg-background-deep border border-border-default rounded-sm pl-12 pr-4 py-4 text-xs font-mono uppercase tracking-widest focus:border-accent/50 focus:outline-none transition-all focus:bg-surface-low placeholder:opacity-30"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <div className="absolute top-0 right-0 h-full flex items-center pr-4 pointer-events-none">
            <span className="text-[9px] font-mono opacity-20">[CTRL+F]</span>
          </div>
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <select 
            className="w-full bg-background-deep border border-border-default rounded-sm pl-12 pr-4 py-4 text-xs font-mono uppercase tracking-widest appearance-none focus:border-accent/50 focus:outline-none focus:bg-surface-low"
            value={filter}
            onChange={(e) => setFilter(e.target.value as any)}
          >
            <option value="ALL">ALL_LEVELS</option>
            <option value="STABLE">STABLE</option>
            <option value="PROCESSING">PROCESSING</option>
            <option value="ALERT">ALERT</option>
            <option value="SYNC">SYNC</option>
          </select>
        </div>
      </div>

      {/* Trace Stream Feed */}
      <div className="relative space-y-6">
        {/* Optical Data Path (Vertical Line) */}
        <div className="absolute left-[24px] top-4 bottom-4 w-px bg-border-subtle" />
        <div className="absolute left-[24px] top-4 bottom-4 w-px bg-gradient-to-b from-accent/40 via-transparent to-transparent" />

        <AnimatePresence mode="popLayout">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.98 }}
              transition={{ delay: index * 0.03 }}
              className="relative pl-16 group"
            >
              {/* Trace Node Marker */}
              <div className={`absolute left-0 top-6 -translate-y-1/2 w-12 h-12 rounded-sm bg-background-deep border border-border-default flex items-center justify-center z-10 transition-all group-hover:border-accent/40 group-hover:scale-110 ${getLevelColor(log.level)}`}>
                <div className="absolute inset-0 border border-current opacity-10" />
                <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current" />
                {log.level === 'STABLE' && <Activity className="w-5 h-5" />}
                {log.level === 'PROCESSING' && <Cpu className="w-5 h-5" />}
                {log.level === 'ALERT' && <Shield className="w-5 h-5 animate-pulse" />}
                {log.level === 'SYNC' && <RefreshCw className="w-5 h-5 animate-spin-slow" />}
              </div>

              <Card className="hover:border-accent/40 transition-all group/card p-5 !bg-surface-low/20">
                <div className="flex flex-col md:flex-row md:items-start justify-between gap-6">
                  <div className="space-y-4 flex-1">
                    <div className="flex items-center flex-wrap gap-4">
                      <div className={`flex items-center gap-2 px-2 py-0.5 rounded-sm border border-current/20 bg-current/5 ${getLevelColor(log.level)}`}>
                        <div className="w-1 h-1 rounded-full bg-current" />
                        <span className="text-[9px] font-mono font-bold uppercase tracking-widest">
                          {log.level}
                        </span>
                      </div>
                      <span className="text-[10px] font-mono text-foreground-subtle flex items-center gap-2">
                        <div className="w-1 h-1 rounded-full bg-border-bright" />
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[9px] font-mono text-foreground-subtle/40 tracking-tighter">
                        TR_ID: {log.trace_id}
                      </span>
                    </div>
                    
                    <div className="flex flex-col gap-1">
                      <span className="label-caps text-[9px] opacity-30">Source: {log.module}</span>
                      <p className="text-sm font-medium leading-relaxed group-hover/card:text-accent transition-colors">
                        {log.message}
                      </p>
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-3 text-[10px] font-mono font-bold uppercase tracking-[0.2em] text-foreground-subtle hover:text-accent transition-all group/btn pt-1">
                    Analyze_Trace
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Cyber Scanline Effect */}
                <div className="absolute inset-0 scanline opacity-0 group-hover/card:opacity-10 transition-opacity pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="hud-panel p-20 text-center border-dashed">
            <p className="label-caps opacity-50 mb-2">Stream_Empty</p>
            <p className="text-sm text-foreground-muted font-sans">
              No telemetry packets found matching the active filters.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
