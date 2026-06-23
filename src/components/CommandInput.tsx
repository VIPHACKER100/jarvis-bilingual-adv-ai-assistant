import { FC, useRef, useState, useCallback, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Send, X, Sparkles } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { processTranscript } from '../services/commandProcessor';
import { useAgentStream } from '../hooks/useAgentStream';
import { AppMode, Language } from '../types';

export const CommandInput: FC = () => {
  const [showInput, setShowInput] = useState(false);
  const [text, setText] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [showAgentResponse, setShowAgentResponse] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const addToHistory = useJarvisStore(s => s.addToHistory);
  const setMode = useJarvisStore(s => s.setMode);
  const language = useJarvisStore(s => s.language);
  const { stream, response, isStreaming, provider, error } = useAgentStream();

  const localActions = [
    'NAVIGATION', 'YOUTUBE', 'WHATSAPP', 'TIME', 'DATE',
    'WEATHER', 'CALCULATOR', 'VOLUME_UP', 'VOLUME_DOWN',
    'VOLUME_MUTE', 'SCROLL_UP', 'SCROLL_DOWN', 'NEW_TAB', 'CLOSE_TAB',
    'SCREENSHOT', 'FULLSCREEN', 'EXIT_FULLSCREEN',
    'HELP', 'GREETING', 'IDENTITY', 'CREATOR_INFO', 'SECURITY_ALERT'
  ];

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'i') {
        e.preventDefault();
        setShowInput(prev => !prev);
        return;
      }
      if (e.key === 'Escape' && showInput) {
        setShowInput(false);
        setText('');
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [showInput]);

  useEffect(() => {
    if (showInput && inputRef.current) {
      inputRef.current.focus();
    }
  }, [showInput]);

  const handleSubmit = useCallback(async () => {
    const cmd = text.trim();
    if (!cmd || isProcessing) return;

    setIsProcessing(true);
    setShowAgentResponse(false);

    try {
      const result = await processTranscript(cmd);
      const isLocalAction = localActions.includes(result.actionType as any);

      if (isLocalAction) {
        addToHistory({
          transcript: cmd,
          response: result.response,
          actionType: result.actionType,
          language: result.language,
          timestamp: Date.now()
        });
        setMode(AppMode.SPEAKING);
        if (result.externalUrl) window.open(result.externalUrl, '_blank');
        setTimeout(() => setMode(AppMode.IDLE), 2000);
      } else {
        setShowAgentResponse(true);
        const langCode = language === Language.HINGLISH ? 'hinglish' : language === Language.HINDI ? 'hi' : 'en';
        stream(cmd, { language: langCode as any, useRag: true });
      }
    } catch {
      addToHistory({
        transcript: cmd,
        response: 'Command processing failed.',
        actionType: 'ERROR',
        language: 'en',
        timestamp: Date.now(),
        isSystemMessage: true,
      });
    } finally {
      setIsProcessing(false);
      inputRef.current?.focus();
    }
  }, [text, isProcessing, addToHistory, setMode, language, stream]);

  return (
    <>
      <button
        onClick={() => setShowInput(prev => !prev)}
        className="fixed bottom-24 right-6 z-40 p-2.5 rounded-full glass-panel border border-border-default hover:border-accent/40 hover:bg-accent/5 transition-all group"
        title="Toggle command input (Ctrl+I)"
        aria-label="Toggle text command input"
      >
        <Terminal className={`w-4 h-4 transition-all ${showInput ? 'text-accent' : 'text-foreground-muted'} group-hover:scale-110`} />
      </button>

      <AnimatePresence>
        {showInput && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            transition={{ duration: 0.15, ease: [0.19, 1, 0.22, 1] }}
            className="fixed bottom-20 left-1/2 -translate-x-1/2 z-50 w-full max-w-xl px-4"
          >
            <div className="glass-panel--high border border-accent/20 bg-surface-low/90 backdrop-blur-xl shadow-[0_0_40px_rgba(76,215,246,0.1)] rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border-subtle bg-surface-mid/50">
                <Terminal className="w-3.5 h-3.5 text-accent" />
                <span className="text-[8px] font-mono text-accent tracking-[0.3em] uppercase font-bold">Text_Command_Interface</span>
                <div className="flex-1" />
                <span className="text-[8px] font-mono text-foreground-subtle opacity-50">Ctrl+I</span>
              </div>
              <div className="flex items-center gap-2 p-3">
                <span className="text-accent font-mono text-sm opacity-70">&gt;</span>
                <input
                  ref={inputRef}
                  type="text"
                  value={text}
                  onChange={e => setText(e.target.value)}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSubmit();
                    if (e.key === 'Escape') { setShowInput(false); setText(''); }
                  }}
                  placeholder="Type a command..."
                  className="flex-1 bg-transparent border-none outline-none text-sm font-mono text-foreground placeholder:text-foreground-subtle/30"
                  disabled={isProcessing}
                  aria-label="Command text input"
                />
                <button
                  onClick={() => setText('')}
                  className="p-1 rounded hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all"
                  title="Clear"
                  aria-label="Clear input"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
                <button
                  onClick={handleSubmit}
                  disabled={!text.trim() || isProcessing}
                  className="p-1.5 rounded-lg bg-accent/10 hover:bg-accent/20 border border-accent/30 text-accent disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                  title="Send command"
                  aria-label="Send command"
                >
                  <Send className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {showAgentResponse && (response || isStreaming) && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 20, scale: 0.95 }}
            className="fixed bottom-56 left-1/2 -translate-x-1/2 z-50 w-full max-w-2xl px-4"
          >
            <div className="glass-panel--high border border-accent/20 bg-surface-low/95 backdrop-blur-xl rounded-xl overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-2 border-b border-border-subtle bg-surface-mid/50">
                <Sparkles className="w-3.5 h-3.5 text-accent" />
                <span className="text-[8px] font-mono text-accent tracking-[0.3em] uppercase font-bold">
                  Neural_Response
                </span>
                {provider && (
                  <span className="text-[7px] font-mono text-foreground-subtle ml-2">
                    via {provider}
                  </span>
                )}
                <div className="flex-1" />
                {isStreaming && (
                  <div className="flex gap-1">
                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '0ms' }} />
                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '150ms' }} />
                    <div className="w-1 h-1 rounded-full bg-accent animate-bounce" style={{ animationDelay: '300ms' }} />
                  </div>
                )}
                <button
                  onClick={() => { setShowAgentResponse(false); }}
                  className="p-1 rounded hover:bg-white/5 text-foreground-muted hover:text-foreground transition-all"
                  aria-label="Close response"
                >
                  <X className="w-3 h-3" />
                </button>
              </div>
              <div className="p-4 max-h-48 overflow-y-auto">
                <p className="text-sm text-foreground font-mono leading-relaxed whitespace-pre-wrap">
                  {response || 'Connecting to neural core...'}
                </p>
                {error && (
                  <p className="text-xs text-danger mt-2 font-mono">{error}</p>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
};
