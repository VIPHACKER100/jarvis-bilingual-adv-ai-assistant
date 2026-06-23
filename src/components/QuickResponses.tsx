import { FC, useState, useEffect, type ComponentType } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Shield, Terminal, Globe, Sparkles } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { apiClient } from '../services/apiClient';
import { AppMode } from '../types';
import { QuickAction } from '../types/api';


const ICON_MAP: Record<string, ComponentType<{ className?: string; size?: number }>> = {
  Zap, Shield, Terminal, Globe, Sparkles
};

export const QuickResponses: FC = () => {
  const { setTranscript, setMode, setCurrentSuggestion } = useJarvisStore();
  const [actions, setActions] = useState<QuickAction[]>([]);
  const [, setIsLoading] = useState(false);
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
    <div className="flex flex-col gap-6 w-full max-w-3xl items-center">
      <div className="flex flex-wrap gap-3 justify-center">
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
                className="group flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-border-default hover:border-accent/40 hover:bg-accent/5 transition-all"
              >
                <Icon className={`w-3.5 h-3.5 ${action.color || 'text-accent'} group-hover:scale-110 transition-transform`} />
                <span className="text-[10px] uppercase tracking-[0.2em] font-mono font-bold text-foreground-subtle group-hover:text-foreground">
                  {action.label}
                </span>
              </motion.button>
            );
          })}
        </AnimatePresence>

        <motion.button
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={getDynamicSuggestion}
          disabled={isGettingSuggestion}
          className="flex items-center gap-2.5 px-4 py-2 rounded-full glass-panel border border-accent/40 hover:bg-accent/10 transition-all group"
        >
          <Sparkles className={`w-3.5 h-3.5 text-accent ${isGettingSuggestion ? 'animate-spin' : 'group-hover:rotate-12'}`} />
          <span className="text-[10px] font-bold text-accent uppercase tracking-[0.2em]">
            {isGettingSuggestion ? 'Neural_Sync...' : 'Quick_Suggestion'}
          </span>
        </motion.button>
      </div>
    </div>
  );
};
