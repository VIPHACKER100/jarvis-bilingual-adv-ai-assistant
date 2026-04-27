import React, { useEffect, useRef } from 'react';
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
    <div className="w-full md:max-w-md h-40 md:h-48 glass-panel border border-border-default rounded-xl p-4 md:p-5 overflow-y-auto relative group transition-all">
      <div className="sticky top-0 right-0 flex justify-end mb-4 -mt-1">
        <div className="px-2 py-0.5 bg-accent/10 border border-accent/20 text-[9px] text-accent uppercase tracking-[0.2em] rounded-md font-bold backdrop-blur-md">
          Event_Stream
        </div>
      </div>
      
      <div className="space-y-4">
        {history.length === 0 && (
          <div className="text-foreground-muted text-xs text-center italic mt-10 opacity-40 uppercase tracking-widest font-mono">
            Awaiting_Inbound_Data
          </div>
        )}
        {history.map((entry, index) => (
          <div key={index} className="flex flex-col space-y-2 text-xs border-l border-border-default pl-4 py-1">
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
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};