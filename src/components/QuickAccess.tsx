import React, { FC } from 'react';
import { useJarvisStore } from '../store/jarvisStore';

export const QuickAccess: FC = () => {
  const { setShowMemory, setShowAutomation } = useJarvisStore();

  return (
    <div className="fixed bottom-6 right-6 z-30 flex flex-col sm:flex-row gap-3">
      <button
        onClick={() => setShowMemory(true)}
        className="glass-panel text-cyan-400 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide"
        title="View Memory & History"
      >
        <span className="text-lg">🧠</span>
        <span className="hidden md:inline">Neural Core</span>
      </button>
      <button
        onClick={() => setShowAutomation(true)}
        className="glass-panel text-purple-400 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide"
        title="Automation & Macros"
      >
        <span className="text-lg">⚡</span>
        <span className="hidden md:inline">Automations</span>
      </button>
    </div>
  );
};
