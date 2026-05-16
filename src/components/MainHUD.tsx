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
    <main className="relative z-10 flex flex-col items-center w-full max-w-5xl space-y-12 md:space-y-16 px-4 py-12 md:py-20">
      
      {/* Dynamic Status Indicator */}
      <div className="min-h-[32px] flex items-center justify-center">
        <AnimatePresence mode="wait">
          <motion.div
            key={mode + (isAgentThinking ? '-thinking' : '')}
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 10 }}
            transition={{ duration: 0.4, ease: "easeOut" }}
          >
            <StatusBadge mode={mode} isThinking={isAgentThinking} />
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Main Interaction Hub */}
      <div className="relative flex flex-col items-center gap-12">
        {/* Decorative Background Ring */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[300px] h-[300px] border border-accent/10 rounded-full animate-spin-slow pointer-events-none" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[350px] h-[350px] border border-secondary/5 rounded-full animate-spin-reverse-slow pointer-events-none" />

        <ArcReactor
          isActive={mode !== AppMode.IDLE}
          onClick={onToggleActivation}
          language={language === Language.HINDI ? 'hi' : 'en'}
          eventLoopLag={systemStatus?.event_loop_lag}
        />

        {/* Thought Stream (Visible when thinking or has thought) */}
        <AnimatePresence>
          {(isAgentThinking || typedThought) && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="absolute top-[110%] w-full max-w-md"
            >
              <div className="flex flex-col items-center gap-2">
                <div className="flex items-center gap-2 text-accent/60">
                  <Sparkles className="w-3 h-3 animate-pulse" />
                  <span className="text-[9px] font-mono uppercase tracking-[0.3em]">Neural_Processing</span>
                </div>
                <p className="text-xs font-mono text-center text-foreground-subtle italic leading-relaxed">
                  {typedThought || "Analyzing stream input..."}
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Quick Access UI */}
      <div className="w-full flex flex-col items-center gap-8">
        <QuickResponses />

        {/* Neural Suggestion Card */}
        <AnimatePresence>
          {currentSuggestion && (
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 20 }}
              className="w-full max-w-xl"
            >
              <Card elevation="mid" className="border-accent/30 bg-accent/5" interactive>
                <div className="flex items-start gap-4">
                  <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                    <MessageSquare className="w-5 h-5 text-accent" />
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between items-center mb-1.5">
                      <span className="text-[10px] font-mono text-accent tracking-[0.2em] uppercase font-bold">Inference_Engine</span>
                      <button 
                        onClick={() => setCurrentSuggestion(null)}
                        className="text-foreground-subtle hover:text-foreground transition-colors p-1"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    <p className="text-sm text-foreground leading-relaxed font-medium">
                      {currentSuggestion}
                    </p>
                  </div>
                </div>
                {/* Auto-dismiss timer bar */}
                <div className="absolute bottom-0 left-0 h-0.5 bg-accent/10 w-full">
                  <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "0%" }}
                    transition={{ duration: 8, ease: "linear" }}
                    className="h-full bg-accent"
                  />
                </div>
              </Card>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Transcript Display */}
      <div className="w-full max-w-3xl min-h-[120px] flex items-center justify-center relative">
        <AnimatePresence mode="wait">
          {transcript ? (
            <motion.div
              key="transcript"
              initial={{ opacity: 0, filter: 'blur(10px)' }}
              animate={{ opacity: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, filter: 'blur(10px)' }}
              className="text-center px-4"
            >
              <p className="text-xl md:text-2xl font-medium text-foreground tracking-tight leading-snug">
                {transcript}
              </p>
              <div className="mt-4 flex items-center justify-center gap-2">
                <div className="h-0.5 w-12 bg-gradient-to-r from-transparent to-accent/50 rounded-full" />
                <span className="text-[9px] font-mono text-accent/60 uppercase tracking-widest">Live_Sync</span>
                <div className="h-0.5 w-12 bg-gradient-to-l from-transparent to-accent/50 rounded-full" />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key="placeholder"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.3 }}
              className="text-foreground-subtle font-mono text-sm tracking-[0.2em] uppercase"
            >
              System Standby // Waiting for Voice Trigger
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Security Protocol Confirmation Modal (Upgraded) */}
      <Modal
        isOpen={!!pendingConfirmation}
        onClose={() => confirmCommand(false)}
        title="Security Protocol Override"
        size="sm"
      >
        <div className="flex flex-col items-center text-center">
          <div className="w-16 h-16 rounded-2xl bg-danger/10 flex items-center justify-center mb-6 border border-danger/20">
            <ShieldAlert className="w-8 h-8 text-danger animate-pulse" />
          </div>
          
          <p className="text-foreground-muted text-sm mb-6 leading-relaxed">
            JARVIS has intercepted an autonomous request for a protected system action. 
            Authorization required for:
          </p>
          
          <div className="w-full p-4 bg-background-base rounded-xl border border-border-default mb-8">
            <span className="text-accent font-mono text-xs font-bold uppercase tracking-widest">
              {pendingConfirmation?.command_key.replace(/_/g, ' ')}
            </span>
          </div>
          
          <div className="flex gap-3 w-full">
            <Button 
              variant="secondary" 
              className="flex-1"
              onClick={() => confirmCommand(false)}
            >
              Dismiss
            </Button>
            <Button 
              variant="neon" 
              className="flex-1 shadow-[0_0_20px_rgba(94,106,210,0.3)]"
              onClick={() => confirmCommand(true)}
            >
              Authorize
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
      <Badge variant="accent" pulse className="px-4 py-1.5 border-accent/50 bg-accent/10">
        Autonomous_Analysis_v3.9.0
      </Badge>
    );
  }

  switch (mode) {
    case AppMode.LISTENING:
      return (
        <Badge variant="info" pulse className="px-4 py-1.5 border-info/50 bg-info/10">
          Listening_Neural_Buffer
        </Badge>
      );
    case AppMode.PROCESSING:
      return (
        <Badge variant="warning" className="px-4 py-1.5 border-warning/50 bg-warning/10 animate-pulse">
          Parsing_Data_Packet
        </Badge>
      );
    case AppMode.SPEAKING:
      return (
        <Badge variant="success" className="px-4 py-1.5 border-success/50 bg-success/10">
          Synthesizing_Response
        </Badge>
      );
    default:
      return (
        <Badge variant="ghost" className="px-4 py-1.5 opacity-40">
          System_Standby_Ready
        </Badge>
      );
  }
};
