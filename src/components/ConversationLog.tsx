// ==========================================================================
// JARVIS v4.0 — COMP-3: ConversationLog
// Scrollable list of user/JARVIS messages
// ==========================================================================

import { useRef, useEffect } from 'react';
import type { ConversationEntry } from '../types';
import { Bot, User } from 'lucide-react';

interface ConversationLogProps {
  entries: ConversationEntry[];
  isProcessing?: boolean;
  isEmpty?: boolean;
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-slate-500 gap-2 py-12">
      <Bot className="w-10 h-10 opacity-30" />
      <p className="text-sm font-mono">Start by typing or speaking a command</p>
    </div>
  );
}

function TypingIndicator() {
  return (
    <div className="flex items-start gap-3 px-4 py-3">
      <div className="flex-shrink-0 w-8 h-8 rounded-full bg-cyan-900/40 flex items-center justify-center">
        <Bot className="w-4 h-4 text-cyan-400" />
      </div>
      <div className="flex items-center gap-1.5 px-3 py-2 glass-panel rounded-lg">
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }} />
        <span className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }} />
      </div>
    </div>
  );
}

export function ConversationLog({ entries, isProcessing = false, isEmpty = false }: ConversationLogProps) {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [entries, isProcessing]);

  if (isEmpty || entries.length === 0) return <EmptyState />;

  return (
    <div ref={scrollRef} className="flex flex-col overflow-y-auto max-h-[400px] gap-1 py-2 scroll-smooth">
      {entries.map((entry) => (
        <div
          key={entry.id}
          className={`flex items-start gap-3 px-4 py-2 ${
            entry.type === 'user' ? 'flex-row-reverse' : ''
          }`}
        >
          {/* Icon */}
          <div
            className={`flex-shrink-0 w-8 h-8 rounded-full flex items-center justify-center ${
              entry.type === 'user'
                ? 'bg-purple-900/40'
                : 'bg-cyan-900/40'
            }`}
          >
            {entry.type === 'user' ? (
              <User className="w-4 h-4 text-purple-400" />
            ) : (
              <Bot className="w-4 h-4 text-cyan-400" />
            )}
          </div>

          {/* Message */}
          <div
            className={`max-w-[75%] px-4 py-2.5 rounded-lg text-sm leading-relaxed ${
              entry.type === 'user'
                ? 'glass-panel-strong bg-purple-900/20 border-purple-800/30'
                : 'glass-panel bg-cyan-900/10'
            } ${entry.action_type === 'AGENT_RESOLVED' ? 'border-l-2 border-neon-info' : ''}`}
          >
            <p className="text-slate-200 whitespace-pre-wrap break-words">{entry.text}</p>
            <div className={`flex items-center gap-2 mt-1.5 ${entry.type === 'user' ? 'justify-end' : ''}`}>
              {entry.action_type && (
                <span className="text-[10px] font-mono text-cyan-600 uppercase">{entry.action_type}</span>
              )}
              <span className="text-[10px] font-mono text-slate-600">
                {new Date(entry.timestamp).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
        </div>
      ))}

      {isProcessing && <TypingIndicator />}
    </div>
  );
}
