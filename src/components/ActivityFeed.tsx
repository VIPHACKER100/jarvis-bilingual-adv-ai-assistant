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
    <Card elevation="mid" className="h-[400px] flex flex-col p-0 overflow-hidden border-border-default">
      <div className="px-5 py-3 border-b border-border-subtle bg-surface-mid flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-accent" />
          <h3 className="text-xs font-mono font-bold uppercase tracking-[0.2em]">Live_Activity_Feed</h3>
        </div>
        <Badge variant="accent" pulse>Streaming</Badge>
      </div>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto p-4 space-y-4 custom-settings-scroll scroll-smooth"
      >
        <AnimatePresence initial={false}>
          {history.map((item, idx) => (
            <ActivityItem key={item.timestamp + idx} item={item} />
          ))}
        </AnimatePresence>
        
        {history.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center opacity-30 gap-3">
            <Clock className="w-8 h-8" />
            <p className="text-xs font-mono uppercase tracking-widest">No activity logged in current session</p>
          </div>
        )}
      </div>
      
      <div className="px-5 py-2 border-t border-border-subtle bg-surface-low flex items-center justify-between opacity-50">
        <span className="text-[9px] font-mono uppercase">Buffer_Status: Optimal</span>
        <span className="text-[9px] font-mono uppercase">Log_Count: {history.length}</span>
      </div>
    </Card>
  );
};

const ActivityItem: FC<{ item: any }> = ({ item }) => {
  const config = {
    SYSTEM: { icon: <Shield className="w-3 h-3" />, color: 'var(--secondary)', label: 'SYS' },
    COMMAND: { icon: <Zap className="w-3 h-3" />, color: 'var(--accent)', label: 'CMD' },
    RESPONSE: { icon: <MessageSquare className="w-3 h-3" />, color: 'var(--success)', label: 'JARVIS' },
    ERROR: { icon: <AlertTriangle className="w-3 h-3" />, color: 'var(--danger)', label: 'ERR' },
  };

  const type = item.actionType as keyof typeof config || 'SYSTEM';
  const { icon, color, label } = config[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: -10, scale: 0.98 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      className="flex gap-4 group"
    >
      <div className="flex flex-col items-center gap-2">
        <div 
          className="w-8 h-8 rounded-lg flex items-center justify-center border border-border-subtle transition-all group-hover:border-accent/40"
          style={{ color }}
        >
          {icon}
        </div>
        <div className="w-px flex-1 bg-border-subtle group-last:hidden" />
      </div>
      
      <div className="flex-1 pb-4">
        <div className="flex items-center gap-3 mb-1">
          <span className="text-[9px] font-mono font-bold uppercase tracking-wider" style={{ color }}>
            {label}
          </span>
          <span className="text-[9px] font-mono text-foreground-subtle tabular-nums">
            {new Date(item.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
          </span>
        </div>
        <div className="glass-panel p-3 bg-surface-low border-border-subtle group-hover:border-border-bright transition-all">
          {item.transcript && (
            <p className="text-xs text-foreground-muted mb-2 font-medium italic">
              "{item.transcript}"
            </p>
          )}
          <p className="text-xs text-foreground font-medium leading-relaxed">
            {item.response}
          </p>
        </div>
      </div>
    </motion.div>
  );
};
