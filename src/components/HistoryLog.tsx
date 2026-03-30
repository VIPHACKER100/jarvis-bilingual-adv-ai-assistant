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
    <div className="w-full md:max-w-md h-40 md:h-48 glass-panel border border-purple-500/20 rounded-xl p-4 md:p-5 overflow-y-auto shadow-[inset_0_0_20px_rgba(139,92,246,0.1)] relative group transition-all">
      <div className="absolute top-0 right-0 p-1.5 px-3 bg-slate-900/80 backdrop-blur-md border-b border-l border-purple-500/40 text-[10px] text-purple-400 uppercase tracking-widest rounded-bl-xl font-bold">
        Sys.Log
      </div>
      <div className="space-y-3 mt-2">
        {history.length === 0 && (
          <div className="text-slate-600 text-sm text-center italic mt-10">
            Awaiting input protocols...
          </div>
        )}
        {history.map((entry, index) => (
          <div key={index} className="flex flex-col space-y-1 text-xs sm:text-sm border-l-2 border-purple-500/40 pl-3 py-1 bg-gradient-to-r from-purple-500/5 to-transparent rounded-r-md">
            <div className="flex justify-between text-slate-500 text-[10px] uppercase">
              <span>{new Date(entry.timestamp).toLocaleTimeString()}</span>
              <span>{entry.actionType}</span>
            </div>

            {/* User Command */}
            {!entry.isSystemMessage && (
              <div className="text-cyan-100 font-mono drop-shadow-md">
                <span className="text-purple-400 mr-2 font-bold">{'>'}</span>
                {entry.transcript}
              </div>
            )}

            {/* System Response */}
            <div className={`italic whitespace-pre-wrap leading-relaxed ${entry.language === 'hi' ? 'font-serif text-pink-300' : 'text-cyan-300'} drop-shadow-sm`}>
              <span className="text-slate-500 mr-2 uppercase text-[10px] tracking-widest font-bold">jarvis:</span>
              {entry.response}
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>
    </div>
  );
};