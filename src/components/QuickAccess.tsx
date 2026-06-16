import { FC } from 'react';
import { motion } from 'framer-motion';
import { Brain, Zap } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';

export const QuickAccess: FC = () => {
  const { setShowMemory, setShowAutomation } = useJarvisStore();

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.5, duration: 0.5 }}
      className="fixed bottom-6 right-6 z-30 flex flex-col sm:flex-row gap-3"
    >
      <button
        onClick={() => setShowMemory(true)}
        className="glass-panel text-accent px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(var(--neon-rgb),0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide group"
        title="View Memory & History"
        aria-label="Open Neural Core memory viewer"
      >
        <Brain className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline">Neural Core</span>
      </button>
      <button
        onClick={() => setShowAutomation(true)}
        className="glass-panel text-purple-400 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide group"
        title="Automation & Macros"
        aria-label="Open Automations dashboard"
      >
        <Zap className="w-4 h-4 group-hover:scale-110 transition-transform" />
        <span className="hidden md:inline">Automations</span>
      </button>
    </motion.div>
  );
};
