import React, { FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X } from 'lucide-react';
import { AppMode, Language } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { ArcReactor } from './ArcReactor';

interface MainHUDProps {
  onToggleActivation: () => void;
}

export const MainHUD: FC<MainHUDProps> = ({ onToggleActivation }) => {
  const { 
    mode, 
    language, 
    currentSuggestion, setCurrentSuggestion,
    transcript 
  } = useJarvisStore();

  return (
    <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-10 md:space-y-16 px-4 py-6">
      <div className="flex flex-col items-center gap-1.5 transition-all duration-700">
        {mode === AppMode.LISTENING && (
          <div className="flex items-center gap-2">
            <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
            <span className="text-accent tracking-[0.4em] font-mono text-[10px] uppercase">Listening</span>
          </div>
        )}
        {mode === AppMode.SPEAKING && (
          <div className="flex items-center gap-2">
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
          </div>
        )}
        {mode === AppMode.PROCESSING && (
          <span className="text-indigo-400 tracking-[0.4em] font-mono text-[10px] animate-pulse uppercase">
            Processing_Data...
          </span>
        )}
        {mode === AppMode.IDLE && (
          <span className="text-slate-500/70 tracking-[0.3em] font-mono text-xs md:text-sm">
            SYSTEM STANDBY
          </span>
        )}
      </div>

      <ArcReactor
        isActive={mode !== AppMode.IDLE}
        onClick={onToggleActivation}
        language={language === Language.HINDI ? 'hi' : 'en'}
      />

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

      <div className="w-full max-w-2xl text-center min-h-[100px] px-4 md:px-0 z-20 flex items-center justify-center">
        <AnimatePresence mode="wait">
          {transcript && (
            <motion.div 
              key={transcript}
              initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
              animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
              exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
              className="relative px-8 py-6"
            >
              <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent/40" />
              <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent/40" />
              
              <p className="text-xl md:text-3xl text-foreground font-medium tracking-tight font-sans leading-tight">
                {transcript}
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </main>
  );
};
