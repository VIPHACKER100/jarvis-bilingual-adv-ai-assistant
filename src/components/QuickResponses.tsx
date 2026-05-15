import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Terminal, Globe, Sparkles, X } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { apiClient } from '../services/apiClient';
import { AppMode } from '../types';

interface QuickAction {
  id: string;
  label: string;
  command: string;
  icon: string;
  color: string;
}

const ICON_MAP: Record<string, any> = {
  Zap, Shield, Terminal, Globe, Sparkles
};

export const QuickResponses: FC = () => {
  const { setTranscript, setMode, currentSuggestion, setCurrentSuggestion } = useJarvisStore();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isGettingSuggestion, setIsGettingSuggestion] = useState(false);

  useEffect(() => {
    loadActions();
  }, []);

  const loadActions = async () => {
    setIsLoading(true);
    try {
      const res = await apiClient.getQuickActions();
      if (res.success) {
        setActions(res.actions);
      }
    } catch (error) {
      console.error('Failed to load quick actions:', error);
    }
    setIsLoading(false);
  };

  const handleAction = async (command: string) => {
    setTranscript(command);
    setMode(AppMode.PROCESSING);
    try {
      await apiClient.executeCommand(command);
    } catch (error) {
      console.error('Action failed:', error);
      setMode(AppMode.IDLE);
    }
  };

  const getDynamicSuggestion = async () => {
    setIsGettingSuggestion(true);
    try {
      const res = await apiClient.getSuggestion();
      if (res.success && res.suggestion) {
        setCurrentSuggestion(res.suggestion);
        // Suggestion remains until dismissed or overwritten
      }
    } catch (error) {
      console.error('Failed to get suggestion:', error);
    }
    setIsGettingSuggestion(false);
  };

  return (
    <div className="flex flex-col gap-4 mt-6 w-full max-w-2xl px-4">
      {/* Quick Action Buttons */}
      <div className="flex flex-wrap gap-2 justify-center">
        <AnimatePresence>
          {actions.map((action, index) => {
            const Icon = ICON_MAP[action.icon] || Zap;
            return (
              <motion.button
                key={action.id}
                initial={{ opacity: 0, scale: 0.9, y: 10 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                whileHover={{ scale: 1.05, translateY: -2 }}
                whileTap={{ scale: 0.95 }}
                onClick={() => handleAction(action.command)}
                className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-white/5 hover:border-cyan-500/30 transition-all group"
              >
                <Icon className={`w-3.5 h-3.5 ${action.color || 'text-cyan-400'} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] uppercase tracking-widest font-mono text-slate-300 group-hover:text-white transition-colors">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        {/* Dynamic Suggestion Trigger */}
        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={getDynamicSuggestion}
          disabled={isGettingSuggestion}
          className="px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/30 hover:bg-cyan-500/20 transition-all group flex items-center gap-2 shadow-[0_0_15px_rgba(6,182,212,0.1)]"
        >
          <Sparkles className={`w-3.5 h-3.5 text-cyan-400 ${isGettingSuggestion ? 'animate-spin' : 'group-hover:rotate-12'}`} />
          <span className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest">
            {isGettingSuggestion ? 'Analyzing...' : 'Suggest Action'}
          </span>
        </motion.button>
      </div>

      {/* Suggestion Bubble */}
      <AnimatePresence>
        {currentSuggestion && (
          <motion.div
            initial={{ opacity: 0, y: 20, scale: 0.9 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 10, scale: 0.9 }}
            className="mx-auto w-full max-w-sm p-4 rounded-2xl bg-gradient-to-br from-slate-900/90 to-blue-950/90 border border-cyan-500/40 shadow-2xl shadow-cyan-500/20 relative overflow-hidden backdrop-blur-md"
          >
            <div className="absolute top-0 left-0 w-full h-1 bg-cyan-500/50" />
            <div className="flex justify-between items-start gap-4">
              <div className="flex gap-3">
                <div className="w-8 h-8 rounded-full bg-cyan-500/20 flex items-center justify-center shrink-0 border border-cyan-500/30">
                  <Sparkles className="w-4 h-4 text-cyan-400" />
                </div>
                <div className="space-y-3">
                  <div>
                    <h4 className="text-[10px] font-bold text-cyan-400 uppercase tracking-widest mb-1">Neural Suggestion</h4>
                    <p className="text-sm text-cyan-100 font-medium leading-relaxed italic">"{currentSuggestion}"</p>
                  </div>
                  <div className="flex gap-3">
                    <button 
                      onClick={() => { handleAction(currentSuggestion); setCurrentSuggestion(null); }}
                      className="px-4 py-1.5 bg-cyan-600 hover:bg-cyan-500 text-white text-[10px] font-bold uppercase tracking-widest rounded-lg shadow-lg shadow-cyan-900/20 transition-all"
                    >
                      Execute
                    </button>
                    <button 
                      onClick={() => setCurrentSuggestion(null)}
                      className="px-4 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-400 text-[10px] font-bold uppercase tracking-widest rounded-lg transition-all"
                    >
                      Ignore
                    </button>
                  </div>
                </div>
              </div>
              <button 
                onClick={() => setCurrentSuggestion(null)}
                className="text-slate-600 hover:text-white transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};
