import React, { FC, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, MessageSquare, Zap, Shield, AlertTriangle, Clock } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';

export const ActivityFeed: FC = () => {
  const { history } = useJarvisStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Auto-scroll to bottom on new history entries
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [history]);

  return (
    <div className="hud-panel h-[400px] flex flex-col p-0 overflow-hidden relative">
      {/* Scanline Overlay */}
      <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] scanline-overlay" />
      
      <div className="px-5 py-4 border-b border-white/5 bg-black/20 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-3">
          <div className="p-1.5 bg-accent/10 rounded-md border border-accent/20">
            <Terminal className="w-4 h-4 text-accent" />
          </div>
          <h3 className="label-caps text-xs tracking-[0.3em]">Neural_Log_Stream // 01</h3>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/5 rounded-full border border-accent/10">
            <div className="w-1 h-1 rounded-full bg-accent animate-pulse" />
            <span className="text-[8px] font-mono text-accent/60 uppercase tracking-widest">Live_Telemetry</span>
          </div>
        </div>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-5 space-y-5 custom-scrollbar relative z-20"
      >
        <AnimatePresence initial={false}>
          {history.map((item, idx) => (
            <ActivityItem key={item.timestamp + idx} item={item} />
          ))}
        </AnimatePresence>
        
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-4">
            <div className="p-4 rounded-full border border-dashed border-white/10 animate-spin-slow">
              <Clock className="w-8 h-8 text-white/40" />
            </div>
            <p className="label-caps text-[10px] tracking-[0.4em]">Standby_Mode // No_Data_Detected</p>
          </div>
        )}
      </div>
      
      <div className="px-5 py-3 border-t border-white/5 bg-black/40 flex items-center justify-between relative z-20">
        <div className="flex items-center gap-2">
          <div className="w-1.5 h-1.5 rounded-full bg-green-500/50 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
          <span className="text-[9px] font-mono uppercase text-white/40 tracking-widest">Buffer_Sync: Nominal</span>
        </div>
        <div className="flex items-center gap-4">
          <span className="text-[9px] font-mono uppercase text-white/40 tracking-widest">Trace_ID: {Math.random().toString(36).substring(2, 8).toUpperCase()}</span>
          <span className="text-[9px] font-mono uppercase text-accent tracking-widest">Count: {history.length.toString().padStart(3, '0')}</span>
        </div>
      </div>
    </div>
  );
};

const ActivityItem: FC<{ item: any }> = ({ item }) => {
  const config = {
    SYSTEM: { icon: <Shield className="w-3.5 h-3.5" />, color: 'var(--secondary)', label: 'SYS_CORE', accent: 'border-secondary/30 bg-secondary/5' },
    COMMAND: { icon: <Zap className="w-3.5 h-3.5" />, color: 'var(--accent)', label: 'USER_CMD', accent: 'border-accent/30 bg-accent/5' },
    RESPONSE: { icon: <MessageSquare className="w-3.5 h-3.5" />, color: '#4cd7f6', label: 'JARVIS_AI', accent: 'border-accent/40 bg-accent/10' },
    ERROR: { icon: <AlertTriangle className="w-3.5 h-3.5" />, color: '#f43f5e', label: 'CRIT_FAIL', accent: 'border-red-500/30 bg-red-500/5' },
  };

  const type = item.actionType as keyof typeof config || 'SYSTEM';
  const { icon, color, label, accent } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, filter: 'blur(10px)' }}
      animate={{ opacity: 1, x: 0, filter: 'blur(0px)' }}
      className="flex gap-5 group"
    >
      <div className="flex flex-col items-center gap-3">
        <div 
          className={`w-10 h-10 rounded-xl flex items-center justify-center border transition-all duration-500 group-hover:scale-110 ${accent} group-hover:border-accent/60`}
          style={{ color }}
        >
          {icon}
        </div>
        <div className="w-px flex-1 bg-gradient-to-b from-white/10 to-transparent group-last:hidden" />
      </div>
      
      <div className="flex-1 pb-6">
        <div className="flex items-center gap-4 mb-2">
          <span className="text-[10px] font-mono font-bold tracking-[0.2em]" style={{ color }}>
            [{label}]
          </span>
          <div className="h-px w-8 bg-white/5" />
          <span className="text-[9px] font-mono text-white/30 tabular-nums tracking-widest">
            T+{new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        
        <div className="relative">
          <div className={`absolute -left-1 top-2 w-0.5 h-full bg-current opacity-20`} style={{ color }} />
          <div className="pl-4 space-y-3">
            {item.transcript && (
              <p className="text-[11px] text-white/50 leading-relaxed font-medium italic border-l-2 border-white/5 pl-3 py-1 bg-white/[0.02]">
                "{item.transcript}"
              </p>
            )}
            <div className="text-xs text-white/90 font-medium leading-relaxed tracking-wide">
              {item.response}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
};
