import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal } from 'lucide-react';
import { CommandResult } from '../types';

interface HistoryLogProps {
  history: CommandResult[];
}

export const HistoryLog: React.FC<HistoryLogProps> = ({ history }) => {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [history]);

  return (
    <div className="w-full md:max-w-md h-48 md:h-56 glass-panel border border-border-default rounded-xl p-4 md:p-5 overflow-y-auto relative group transition-all">
      <div className="sticky top-0 right-0 flex justify-end mb-4 -mt-1 z-10">
        <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-[9px] text-accent uppercase tracking-[0.2em] rounded-md font-bold backdrop-blur-md">
          Event_Stream
        </div>
      </div>
      
      <div className="space-y-4">
        {history.length === 0 && (
          <div className="flex flex-col items-center justify-center gap-3 mt-6 opacity-40">
            <Terminal className="w-8 h-8 text-foreground-muted" />
            <div className="text-center">
              <p className="text-foreground-muted text-[10px] uppercase tracking-[0.3em] font-mono font-bold">
                Awaiting_Inbound_Data
              </p>
              <p className="text-foreground-muted/50 text-[9px] font-mono mt-1">
                Activate JARVIS to begin
              </p>
            </div>
            <div className="flex gap-1 mt-1">
              {[0, 1, 2].map(i => (
                <motion.div
                  key={i}
                  animate={{ opacity: [0.2, 0.8, 0.2] }}
                  transition={{ repeat: Infinity, duration: 1.5, delay: i * 0.3 }}
                  className="w-1 h-1 rounded-full bg-accent"
                />
              ))}
            </div>
          </div>
        )}
        <AnimatePresence initial={false}>
          {history.map((entry, index) => (
            <motion.div
              key={`${entry.timestamp}-${index}`}
              initial={{ opacity: 0, x: -12 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 0.3 }}
              className="flex flex-col space-y-2 text-xs border-l border-border-default pl-4 py-1"
            >
              <div className="flex justify-between text-[9px] font-mono text-foreground-muted/60 uppercase tracking-tight">
                <span>{new Date(entry.timestamp).toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}</span>
                <span className="text-accent/60">{entry.actionType}</span>
              </div>

              {/* User Command */}
              {!entry.isSystemMessage && (
                <div className="text-foreground font-mono leading-tight">
                  <span className="text-accent mr-2 opacity-50">#</span>
                  {entry.transcript}
                </div>
              )}

              {/* System Response */}
              <div className="text-foreground-muted leading-relaxed font-sans">
                <span className="text-[9px] mr-2 uppercase tracking-[0.1em] font-bold text-accent">JARVIS</span>
                {entry.response}
              </div>
            </motion.div>
          ))}
        </AnimatePresence>
        <div ref={bottomRef} />
      </div>
    </div>
  );
};