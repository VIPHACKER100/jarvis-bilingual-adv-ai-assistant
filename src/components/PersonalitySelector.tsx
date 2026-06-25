import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Sparkles, Palette, RotateCcw, Check } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { usePersonalities, useSetPersonality } from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import type { PersonalityInfo } from '../types/api';

const PERSONALITY_THEMES: Record<string, { gradient: string; icon: string; description: string }> = {
  stark: {
    gradient: 'from-yellow-400/20 to-yellow-600/10',
    icon: '⚡',
    description: 'Bold, confident, and innovative — the original Iron Legion persona.',
  },
  midnight: {
    gradient: 'from-rose-500/20 to-rose-700/10',
    icon: '🌙',
    description: 'Dark, tactical, and precise — stealth-optimized neural protocol.',
  },
  avenue: {
    gradient: 'from-emerald-400/20 to-emerald-600/10',
    icon: '🌿',
    description: 'Clean, elegant, and minimal — precision-crafted glass aesthetic.',
  },
  linear: {
    gradient: 'from-white/10 to-white/5',
    icon: '⬜',
    description: 'Pure, stark, and unfiltered — monochrome zero-distraction mode.',
  },
};

export const PersonalitySelector: FC = () => {
  const { showPersonality, setShowPersonality } = useJarvisStore();
  const { addNotification } = useNotifications();
  const { data, isLoading } = usePersonalities();
  const setPersonalityMutation = useSetPersonality();
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const personalities = data?.personalities ?? [];

  useEffect(() => {
    if (personalities.length > 0 && !selectedId) {
      const active = personalities.find(p => p.style === 'active' || p.id === useJarvisStore.getState().systemStatus?.personality?.id);
      setSelectedId(active?.id ?? personalities[0]?.id ?? null);
    }
  }, [personalities, selectedId]);

  const handleSelect = async (id: string) => {
    setSelectedId(id);
    try {
      const res = await setPersonalityMutation.mutateAsync(id);
      addNotification({
        type: 'success',
        title: 'Personality Updated',
        message: res.response || `Switched to ${id} protocol`,
        duration: 3000,
      });
    } catch {
      addNotification({ type: 'error', title: 'Switch Failed', message: 'Could not update personality', duration: 4000 });
    }
  };

  if (!showPersonality) return null;

  return (
    <Modal isOpen={showPersonality} onClose={() => setShowPersonality(false)} title="PERSONALITY_MATRIX // v4.0" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <Palette className="w-5 h-5 text-accent" />
          <span className="text-xs font-mono text-foreground-muted">
            Select a neural personality to redefine JARVIS's interaction model and visual identity.
          </span>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-12">
            <RotateCcw className="w-6 h-6 animate-spin text-accent/50" />
          </div>
        ) : personalities.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-foreground-muted/50 gap-3">
            <Sparkles className="w-8 h-8" />
            <span className="text-xs font-mono">No personalities available</span>
          </div>
        ) : (
          <div className="grid gap-4">
            {personalities.map((p: PersonalityInfo) => {
              const theme = PERSONALITY_THEMES[p.id] ?? PERSONALITY_THEMES.linear;
              const isSelected = selectedId === p.id;
              const isActive = p.style === 'active' || p.id === useJarvisStore.getState().systemStatus?.personality?.id;

              return (
                <motion.button
                  key={p.id}
                  whileHover={{ scale: 1.01, y: -2 }}
                  whileTap={{ scale: 0.99 }}
                  onClick={() => handleSelect(p.id)}
                  disabled={setPersonalityMutation.isPending}
                  className={`relative w-full text-left p-5 rounded-xl border-2 transition-all ${
                    isSelected
                      ? 'border-accent bg-accent/5 shadow-[0_0_20px_rgba(var(--accent-rgb),0.15)]'
                      : 'border-border-default bg-background-deep/60 hover:border-accent/40 hover:bg-accent/[0.02]'
                  } disabled:opacity-60`}
                >
                  {/* Theme gradient bg */}
                  <div className={`absolute inset-0 rounded-xl bg-gradient-to-br ${theme.gradient} opacity-40 pointer-events-none`} />

                  <div className="relative z-10 flex items-start gap-4">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center text-2xl border-2 shrink-0 ${
                      isSelected ? 'border-accent bg-accent/10' : 'border-border-default bg-background-deep'
                    }`}>
                      {theme.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-1">
                        <h3 className="text-base font-bold text-foreground tracking-tight">{p.name}</h3>
                        {isActive && (
                          <span className="px-2 py-0.5 bg-accent/10 text-accent border border-accent/30 rounded text-[8px] font-bold uppercase tracking-widest">Active</span>
                        )}
                      </div>
                      <p className="text-xs text-foreground-muted leading-relaxed">{theme.description}</p>
                      <div className="flex items-center gap-3 mt-3">
                        <div className="flex items-center gap-1.5">
                          <div className="w-3 h-3 rounded-full" style={{ backgroundColor: p.accent || '#fff' }} />
                          <span className="text-[10px] font-mono text-foreground-muted uppercase">{p.accent || 'DEFAULT'}</span>
                        </div>
                      </div>
                    </div>
                    {isSelected && (
                      <div className="w-6 h-6 rounded-full bg-accent flex items-center justify-center shrink-0">
                        <Check className="w-3.5 h-3.5 text-background-deep" />
                      </div>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        )}

        <div className="flex justify-end pt-3 border-t border-border-subtle">
          <Button variant="ghost" onClick={() => setShowPersonality(false)} className="text-[10px] tracking-widest">
            Close Interface
          </Button>
        </div>
      </div>
    </Modal>
  );
};
