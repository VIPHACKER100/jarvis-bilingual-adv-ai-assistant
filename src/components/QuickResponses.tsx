import React, { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Terminal, Globe, Sparkles } from 'lucide-react';
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
  const { setTranscript, setMode, setCurrentSuggestion } = useJarvisStore();
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
                className="glass-panel px-3 py-1.5 rounded-full flex items-center gap-2 border border-border-default hover:border-accent/30 transition-all group"
              >
                <Icon className={`w-3.5 h-3.5 ${action.color || 'text-accent'} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] uppercase tracking-widest font-mono text-foreground-muted group-hover:text-foreground transition-colors">
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
          aria-label="Get AI suggestion"
          className="glass-panel px-3 py-1.5 rounded-full border border-accent/30 hover:border-accent/50 hover:bg-accent/10 transition-all group flex items-center gap-2"
        >
          <Sparkles className={`w-3.5 h-3.5 text-accent ${isGettingSuggestion ? 'animate-spin' : 'group-hover:rotate-12'}`} />
          <span className="text-[10px] font-bold text-accent uppercase tracking-widest">
            {isGettingSuggestion ? 'Analyzing...' : 'Suggest Action'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
