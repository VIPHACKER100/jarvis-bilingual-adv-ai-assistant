import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, Shield, Cpu, RefreshCw, Terminal, Search, Filter, ArrowRight } from 'lucide-react';
import { NeuralLogEntry, LogLevel } from '../types/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

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
      case 'STABLE': return 'text-cyber-cyan';
      case 'PROCESSING': return 'text-neural-purple';
      case 'ALERT': return 'text-security-rose';
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
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-8">
      {/* Header & Stats */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div>
          <div className="flex items-center gap-2 mb-2">
            <Terminal className="w-5 h-5 text-cyber-cyan" />
            <h1 className="text-2xl font-display font-bold tracking-tight uppercase">Audit_Timeline</h1>
          </div>
          <p className="text-foreground-muted text-sm font-mono uppercase tracking-widest opacity-60">
            Real-time Heuristic Trace // v3.9.0_Build_882
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Badge variant="ghost" className="bg-cyber-cyan/5 border-cyber-cyan/20 text-cyber-cyan">
            Active_Traces: {neuralLogs.length}
          </Badge>
          <Badge variant="ghost" className="bg-security-rose/5 border-security-rose/20 text-security-rose">
            Alerts_Logged: {neuralLogs.filter(l => l.level === 'ALERT').length}
          </Badge>
          {isLoading && (
            <div className="flex items-center gap-2 ml-2">
              <RefreshCw className="w-3 h-3 text-cyber-cyan animate-spin" />
              <span className="text-[10px] font-mono text-cyber-cyan animate-pulse">SYNCING...</span>
            </div>
          )}
        </div>
      </div>

      {/* Control Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-3 relative">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <input 
            type="text"
            placeholder="FILTER_BY_MODULE_OR_MESSAGE..."
            className="w-full bg-background-elevated border border-border-default rounded-xl pl-11 pr-4 py-3 text-sm font-mono focus:border-cyber-cyan/50 focus:outline-none transition-colors"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <div className="relative">
          <Filter className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-foreground-subtle" />
          <select 
            className="w-full bg-background-elevated border border-border-default rounded-xl pl-11 pr-4 py-3 text-sm font-mono appearance-none focus:border-cyber-cyan/50 focus:outline-none"
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

      {/* Timeline Feed */}
      <div className="relative space-y-4">
        {/* Vertical Line */}
        <div className="absolute left-[21px] top-4 bottom-4 w-px bg-gradient-to-b from-cyber-cyan/50 via-border-default to-transparent" />

        <AnimatePresence mode="popLayout">
          {filteredLogs.map((log, index) => (
            <motion.div
              key={log.id}
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: index * 0.05 }}
              className="relative pl-12"
            >
              {/* Node Marker */}
              <div className={`absolute left-0 top-1/2 -translate-y-1/2 w-[42px] h-[42px] rounded-xl bg-background-elevated border border-border-default flex items-center justify-center z-10 ${getLevelColor(log.level)} shadow-sm`}>
                {log.level === 'STABLE' && <Activity className="w-5 h-5" />}
                {log.level === 'PROCESSING' && <Cpu className="w-5 h-5 animate-pulse" />}
                {log.level === 'ALERT' && <Shield className="w-5 h-5 animate-bounce" />}
                {log.level === 'SYNC' && <RefreshCw className="w-5 h-5 animate-spin-slow" />}
              </div>

              <Card className="hover:border-cyber-cyan/30 transition-all group overflow-hidden">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="space-y-1 flex-1">
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] font-mono font-bold uppercase tracking-widest ${getLevelColor(log.level)}`}>
                        {log.level}
                      </span>
                      <span className="text-[10px] font-mono text-foreground-subtle">
                        {new Date(log.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                      </span>
                      <span className="text-[10px] font-mono text-foreground-subtle bg-foreground-subtle/10 px-1.5 py-0.5 rounded">
                        ID: {log.trace_id}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 text-foreground font-medium">
                      <span className="text-cyber-cyan/60 font-mono text-xs">[{log.module}]</span>
                      <p className="text-sm">{log.message}</p>
                    </div>
                  </div>
                  
                  <button className="flex items-center gap-2 text-xs font-mono text-foreground-subtle hover:text-cyber-cyan transition-colors group/btn">
                    EXPAND_DETAILS
                    <ArrowRight className="w-3 h-3 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>

                {/* Subtle Scanline Animation on Hover */}
                <div className="absolute inset-0 bg-gradient-to-r from-cyber-cyan/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {filteredLogs.length === 0 && (
          <div className="text-center py-20 border border-dashed border-border-default rounded-2xl">
            <p className="text-foreground-muted font-mono text-sm uppercase tracking-widest">
              No matching trace packets found.
            </p>
          </div>
        )}
      </div>
    </div>
  );
};
