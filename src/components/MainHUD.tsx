import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, X, ShieldAlert, Cpu, MessageSquare, Sparkles } from 'lucide-react';
import { AppMode, Language } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { useJarvisBridge } from '../hooks/useJarvisBridge';
import { ArcReactor } from './ArcReactor';
import { QuickResponses } from './QuickResponses';
import { Badge } from './ui/Badge';
import { Card } from './ui/Card';
import { Button } from './ui/Button';
import { Modal } from './ui/Modal';

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

  const [typedThought, setTypedThought] = useState('');

  // Typewriter effect for agent thoughts
  useEffect(() => {
    if (agentThought) {
      let i = 0;
      setTypedThought('');
      const interval = setInterval(() => {
        setTypedThought(agentThought.slice(0, i + 1));
        i++;
        if (i >= agentThought.length) clearInterval(interval);
      }, 30);
      return () => clearInterval(interval);
    } else {
      setTypedThought('');
    }
  }, [agentThought]);

  return (
    <main className="relative z-10 flex flex-col items-center w-full max-w-5xl space-y-16 md:space-y-24 px-4 py-12 md:py-24">
      {/* HUD Scanner & Status Overlay */}
      <div className="w-full flex flex-col items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="h-px w-12 bg-border-subtle" />
          <AnimatePresence mode="wait">
            <motion.div
              key={mode + (isAgentThinking ? '-thinking' : '')}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 1.1 }}
              transition={{ duration: 0.3 }}
            >
              <StatusBadge mode={mode} isThinking={isAgentThinking} />
            </motion.div>
          </AnimatePresence>
          <div className="h-px w-12 bg-border-subtle" />
        </div>
        
        {/* Optical Data Header */}
        <div className="flex items-center gap-2 opacity-30">
          <span className="label-caps text-[8px]">Link_Protocol: Secure</span>
          <div className="w-1 h-1 rounded-full bg-accent" />
          <span className="label-caps text-[8px]">Telemetry: Optimal</span>
        </div>
      </div>

      {/* Primary Neural Reactor Hub */}
      <div className="relative flex flex-col items-center gap-16">
        {/* Orbital HUD Rings */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] border border-accent/10 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[380px] h-[380px] border border-neural-purple/10 rounded-full animate-spin-reverse-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[420px] h-[420px] border-t border-b border-accent/5 rounded-full animate-pulse pointer-events-none" />

        <ArcReactor
          isActive={mode !== AppMode.IDLE}
          onClick={onToggleActivation}
          language={language === Language.HINDI ? 'hi' : 'en'}
          eventLoopLag={systemStatus?.event_loop_lag}
        />

        {/* Neural Stream Overlay */}
        <AnimatePresence>
          {(isAgentThinking || typedThought) && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="absolute top-[115%] w-full max-w-lg"
            >
              <div className="hud-panel p-4 border-accent/20 bg-accent/[0.02] flex flex-col items-center gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-4 h-4 flex items-center justify-center">
                    <Sparkles className="w-3 h-3 text-accent animate-pulse" />
                  </div>
                  <span className="label-caps text-[10px] text-accent tracking-[0.4em] font-bold">Neural_Thought_Stream</span>
                </div>
                <div className="w-full h-px bg-gradient-to-r from-transparent via-accent/20 to-transparent" />
                <p className="text-sm font-mono text-center text-foreground-muted leading-relaxed max-w-sm px-4">
                  {typedThought || "Initializing heuristic analysis pipeline..."}
                </p>
                {/* Visual Telemetry Bars */}
                <div className="flex gap-1 mt-1 opacity-20">
                  {[...Array(8)].map((_, i) => (
                    <motion.div 
                      key={i}
                      animate={{ height: [2, 8, 4] }}
                      transition={{ duration: 0.5 + Math.random(), repeat: Infinity, ease: "linear" }}
                      className="w-0.5 bg-accent"
                    />
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Adaptive Context Layer */}
      <div className="w-full flex flex-col items-center gap-10">
        <QuickResponses />

        {/* Real-time Suggestion Nexus */}
        <AnimatePresence>
          {currentSuggestion && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="w-full max-w-2xl"
            >
              <Card elevation="high" className="!p-0 border-accent/30 overflow-hidden" interactive>
                <div className="hud-panel-header flex justify-between items-center bg-accent/[0.03]">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="w-3 h-3 text-accent" />
                    <span className="label-caps text-[9px] text-accent">Predictive_Context_Analysis</span>
                  </div>
                  <button 
                    onClick={() => setCurrentSuggestion(null)}
                    className="text-foreground-subtle hover:text-security-rose transition-colors"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
                
                <div className="p-6 relative">
                  <div className="absolute top-0 right-0 p-2 opacity-5">
                    <Sparkles className="w-12 h-12 text-accent" />
                  </div>
                  <p className="text-lg text-foreground font-medium italic border-l-2 border-accent/30 pl-6 leading-relaxed">
                    "{currentSuggestion}"
                  </p>
                  <div className="mt-6 flex items-center justify-between">
                    <span className="label-caps text-[8px] opacity-40">Confidence: 94.8% // System_Source: GPT-4o</span>
                    <Button variant="ghost" size="sm" className="text-[10px] uppercase tracking-widest font-bold py-1">Apply_Intent</Button>
                  </div>
                </div>
                
                {/* Tactical Decay Bar */}
                <div className="h-px bg-border-subtle w-full">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-full bg-accent shadow-[0_0_8px_rgba(76,215,246,0.5)]"
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Voice Telemetry & Transcript Buffer */}
      <div className="w-full max-w-3xl min-h-[140px] flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="text-center px-6"
            >
              <div className="absolute -inset-4 bg-accent/5 blur-3xl rounded-full opacity-20" />
              <p className="text-2xl md:text-3xl font-bold text-foreground tracking-tight leading-snug drop-shadow-[0_0_10px_rgba(255,255,255,0.1)]">
                {transcript}
              </p>
              <div className="mt-8 flex items-center justify-center gap-6">
                <div className="h-px w-20 bg-gradient-to-r from-transparent to-accent/40" />
                <div className="flex items-center gap-3">
                  <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                  <span className="label-caps text-[9px] text-accent tracking-[0.3em]">Live_Sync_Channel</span>
                </div>
                <div className="h-px w-20 bg-gradient-to-l from-transparent to-accent/40" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.2 }}
              className="flex flex-col items-center gap-4"
            >
              <span className="label-caps text-sm tracking-[0.5em]">System_Standby_Protocol</span>
              <div className="flex gap-2">
                {[...Array(3)].map((_, i) => (
                  <motion.div 
                    key={i}
                    animate={{ scale: [1, 1.2, 1] }}
                    transition={{ duration: 1, repeat: Infinity, delay: i * 0.2 }}
                    className="w-1 h-1 rounded-full bg-foreground"
                  />
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Protocol & Auth Overlays */}
      <Modal
        isOpen={!!pendingConfirmation}
        onClose={() => confirmCommand(false)}
        title="Tactical_Override_Required"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="hud-panel p-6 border-security-rose/30 bg-security-rose/[0.03] mb-8 relative group overflow-hidden">
            <div className="scanline opacity-10" />
            <ShieldAlert className="w-10 h-10 text-security-rose animate-pulse" />
          </div>
          
          <p className="label-caps text-[10px] text-security-rose mb-4 font-bold tracking-[0.2em]">Security Protocol v3.9.0 // Restricted Action</p>
          <p className="text-foreground-muted text-sm mb-8 leading-relaxed px-4">
            Autonomous agent intent identified as a protected system override. 
            Confirm secure execution for node node:
          </p>
          
          <div className="w-full p-5 bg-background-deep border border-border-default rounded-sm mb-10 relative group">
            <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-accent/40" />
            <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-accent/40" />
            <span className="text-accent font-mono text-sm font-bold uppercase tracking-[0.2em]">
              {pendingConfirmation?.command_key.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex gap-4 w-full px-2">
            <Button 
              variant="secondary" 
              className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest"
              onClick={() => confirmCommand(false)}
            >
              Abort_Intent
            </Button>
            <Button 
              variant="neon" 
              className="flex-1 py-4 text-[10px] font-bold uppercase tracking-widest !bg-security-rose/10 !border-security-rose/30 !text-security-rose hover:!bg-security-rose/20"
              onClick={() => confirmCommand(true)}
            >
              Confirm_Auth
            </Button>
          </div>
        </div>
      </Modal>
    </main>
  );
};

const StatusBadge: FC<{ mode: AppMode, isThinking: boolean }> = ({ mode, isThinking }) => {
  if (isThinking) {
    return (
      <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border border-accent/30 rounded-sm">
        <div className="w-2 h-2 rounded-full bg-accent animate-ping opacity-75" />
        <span className="label-caps text-[10px] text-accent tracking-[0.3em]">Autonomous_Processing_v3.9</span>
      </div>
    );
  }

  switch (mode) {
    case AppMode.LISTENING:
      return (
        <div className="flex items-center gap-3 px-5 py-2 bg-accent/10 border border-accent/30 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
          <span className="label-caps text-[10px] text-accent tracking-[0.3em]">Listening_Neural_Buffer</span>
        </div>
      );
    case AppMode.PROCESSING:
      return (
        <div className="flex items-center gap-3 px-5 py-2 bg-neural-purple/10 border border-neural-purple/30 rounded-sm">
          <div className="w-2 h-2 rounded-full bg-neural-purple animate-pulse" />
          <span className="label-caps text-[10px] text-neural-purple tracking-[0.3em]">Parsing_Data_Packet</span>
        </div>
      );
    case AppMode.SPEAKING:
      return (
        <div className="flex items-center gap-3 px-5 py-2 bg-accent/5 border border-accent/20 rounded-sm">
          <Activity className="w-3 h-3 text-accent animate-pulse" />
          <span className="label-caps text-[10px] text-accent tracking-[0.3em]">Synthesizing_Heuristics</span>
        </div>
      );
    default:
      return (
        <div className="flex items-center gap-3 px-5 py-2 bg-surface-low/50 border border-border-default rounded-sm opacity-50">
          <div className="w-2 h-2 rounded-full bg-foreground-subtle" />
          <span className="label-caps text-[10px] text-foreground-subtle tracking-[0.3em]">System_Standby_Ready</span>
        </div>
      );
  }
};
