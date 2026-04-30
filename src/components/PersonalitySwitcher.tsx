import { FC } from 'react';
import { motion } from 'framer-motion';
import { Palette, Check } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface Personality {
  id: string;
  name: string;
  accent: string;
}

interface PersonalitySwitcherProps {
  currentPersonality?: string;
  onSwitch?: (id: string) => void;
}

const PERSONALITIES: Personality[] = [
  { id: 'stark',    name: 'Stark Legacy',      accent: '#facc15' },
  { id: 'midnight', name: 'Midnight Protocol',  accent: '#f43f5e' },
  { id: 'avenue',   name: 'Avenue Glass',       accent: '#10b981' },
  { id: 'linear',   name: 'Linear Zero',        accent: '#ffffff' },
];

export const PersonalitySwitcher: FC<PersonalitySwitcherProps> = ({
  currentPersonality = 'stark',
  onSwitch,
}) => {
  const handleSwitch = async (id: string) => {
    if (id === currentPersonality) return;
    try {
      await apiClient.post(`/system/personality/${id}`);
      onSwitch?.(id);
    } catch (err) {
      console.warn('Failed to switch personality:', err);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.3 }}
      className="glass-panel p-4 space-y-3"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <Palette className="w-3.5 h-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground-muted">
          Neural_Persona
        </span>
        <div className="h-px flex-1 bg-border-default" />
      </div>

      {/* Persona Grid */}
      <div className="grid grid-cols-2 gap-2">
        {PERSONALITIES.map((p, i) => {
          const isActive = p.id === currentPersonality;
          return (
            <motion.button
              key={p.id}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: i * 0.07, duration: 0.3 }}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => handleSwitch(p.id)}
              className={`relative flex flex-col items-start gap-1.5 p-2.5 rounded border transition-all duration-300 text-left ${
                isActive
                  ? 'border-accent/60 bg-accent/10'
                  : 'border-border-default bg-white/[0.02] hover:border-white/20'
              }`}
            >
              {/* Accent dot */}
              <div
                className="w-2.5 h-2.5 rounded-full"
                style={{
                  background: p.accent,
                  boxShadow: isActive ? `0 0 8px ${p.accent}80` : 'none',
                }}
              />
              <span className="text-[9px] font-mono text-foreground leading-tight">
                {p.name}
              </span>
              {isActive && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  className="absolute top-1.5 right-1.5"
                >
                  <Check className="w-2.5 h-2.5 text-accent" />
                </motion.div>
              )}
            </motion.button>
          );
        })}
      </div>

      {/* Active badge */}
      <div className="flex items-center gap-2 pt-1">
        <div
          className="w-1.5 h-1.5 rounded-full animate-pulse"
          style={{
            background: PERSONALITIES.find(p => p.id === currentPersonality)?.accent ?? 'var(--accent)',
          }}
        />
        <span className="text-[8px] font-mono text-foreground-muted uppercase tracking-widest">
          {PERSONALITIES.find(p => p.id === currentPersonality)?.name ?? 'Stark Legacy'}_Active
        </span>
      </div>
    </motion.div>
  );
};
