import React, { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X } from 'lucide-react';
import { AppMode, Language } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { useJarvisBridge } from '../hooks/useJarvisBridge';
import { ArcReactor } from './ArcReactor';
import { QuickResponses } from './QuickResponses';

interface MainHUDProps {
  onToggleActivation: () => void;
}

export const MainHUD: FC<MainHUDProps> = ({ onToggleActivation }) => {
  const { 
    mode, 
    language, 
    currentSuggestion, setCurrentSuggestion,
    transcript,
    systemStatus,
    isAgentThinking,
    agentThought,
    pendingConfirmation
  } = useJarvisStore();
  
  const { confirmCommand } = useJarvisBridge();

  return (
    <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-10 md:space-y-16 px-4 py-6">
      {/* Mode Status Indicator with smooth transitions */}
      <div className="flex flex-col items-center gap-1.5 transition-all duration-700 min-h-[24px]">
        <AnimatePresence mode="wait">
          {isAgentThinking && (
            <motion.div
              key="agent-thinking"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="relative">
                <span className="absolute inset-0 w-2 h-2 rounded-full bg-cyan-400 animate-ping opacity-75" />
                <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
              </div>
              <div className="flex flex-col items-start">
                <span className="text-cyan-400 tracking-[0.4em] font-mono text-[10px] uppercase font-bold">Autonomous_Analysis_v3.9.0...</span>
                {agentThought && (
                  <motion.span 
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="text-[9px] text-cyan-200/60 font-mono italic max-w-xs truncate"
                  >
                    Thought: {agentThought}
                  </motion.span>
                )}
              </div>
            </motion.div>
          )}
          {!isAgentThinking && mode === AppMode.LISTENING && (
            <motion.div
              key="listening"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <span className="text-accent tracking-[0.4em] font-mono text-[10px] uppercase">Listening</span>
            </motion.div>
          )}
          {mode === AppMode.SPEAKING && (
            <motion.div
              key="speaking"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
              className="flex items-center gap-2"
            >
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-accent rounded-full"
                  />
                ))}
              </div>
              <span className="text-accent tracking-[0.4em] font-mono text-[10px] uppercase">Responding</span>
            </motion.div>
          )}
          {mode === AppMode.PROCESSING && (
            <motion.div
              key="processing"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-indigo-400 tracking-[0.4em] font-mono text-[10px] animate-pulse uppercase">
                Processing_Data...
              </span>
            </motion.div>
          )}
          {mode === AppMode.IDLE && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              transition={{ duration: 0.3 }}
            >
              <span className="text-slate-500/70 tracking-[0.3em] font-mono text-xs md:text-sm">
                SYSTEM STANDBY
              </span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <ArcReactor
        isActive={mode !== AppMode.IDLE}
        onClick={onToggleActivation}
        language={language === Language.HINDI ? 'hi' : 'en'}
        eventLoopLag={systemStatus?.event_loop_lag}
      />

      <QuickResponses />

      {/* Neural Suggestion Card with countdown progress bar */}
      <AnimatePresence>
        {currentSuggestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-xl z-30 px-4"
          >
            <div className="glass-panel p-4 border border-accent/20 bg-accent/5 backdrop-blur-2xl rounded-xl relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-accent tracking-[0.2em] uppercase font-bold">Neural_Inference // Suggestion</span>
                    <button 
                      onClick={() => setCurrentSuggestion(null)}
                      title="Dismiss suggestion"
                      aria-label="Dismiss suggestion"
                      className="text-foreground-muted hover:text-foreground transition-colors p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {currentSuggestion}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 bg-accent/10 w-full">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="h-full bg-accent"
                />
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Transcript display */}
      <div className="w-full max-w-2xl text-center min-h-[100px] px-4 md:px-0 z-20 flex items-center justify-center">
        {/* ... (existing transcript) */}
      </div>

      {/* Security Protocol Confirmation Modal */}
      <AnimatePresence>
        {pendingConfirmation && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] flex items-center justify-center bg-background/80 backdrop-blur-sm px-4"
          >
            <motion.div
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.9, y: 20 }}
              className="w-full max-w-md glass-panel p-8 border-2 border-yellow-500/30 bg-yellow-500/5 relative overflow-hidden"
            >
              <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-transparent via-yellow-500 to-transparent animate-pulse" />
              
              <div className="flex flex-col items-center text-center">
                <div className="w-16 h-16 rounded-2xl bg-yellow-500/10 flex items-center justify-center mb-6 border border-yellow-500/20">
                  <Activity className="w-8 h-8 text-yellow-500 animate-pulse" />
                </div>
                
                <h2 className="text-xl font-bold text-foreground tracking-tight mb-2 uppercase">Security Protocol Violation</h2>
                <p className="text-foreground-muted text-sm mb-8 leading-relaxed">
                  JARVIS has intercepted an autonomous request for a protected system action. 
                  Please authorize the following command:
                  <span className="block mt-4 p-3 bg-yellow-500/10 rounded-lg text-yellow-200 font-mono text-xs border border-yellow-500/10">
                    {pendingConfirmation.command_key.replace(/_/g, ' ').toUpperCase()}
                  </span>
                </p>
                
                <div className="flex gap-4 w-full">
                  <button
                    onClick={() => confirmCommand(false)}
                    className="flex-1 px-6 py-3 rounded-xl border border-white/10 hover:bg-white/5 transition-all text-sm font-bold uppercase tracking-wider"
                  >
                    Abort
                  </button>
                  <button
                    onClick={() => confirmCommand(true)}
                    className="flex-1 px-6 py-3 rounded-xl bg-yellow-500 hover:bg-yellow-400 text-background transition-all text-sm font-bold uppercase tracking-wider shadow-[0_0_20px_rgba(234,179,8,0.3)]"
                  >
                    Authorize
                  </button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </main>
  );
};
