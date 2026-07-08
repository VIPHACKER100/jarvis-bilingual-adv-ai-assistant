// ==========================================================================
// JARVIS v4.0 — COMP-6: PersonalityCard
// Card for personality selection with accent color swatch
// ==========================================================================

import type { PersonalityInfo } from '../types';
import { Check } from 'lucide-react';

interface PersonalityCardProps {
  personality: PersonalityInfo;
  isActive: boolean;
  onClick: (id: string) => void;
}

export function PersonalityCard({ personality, isActive, onClick }: PersonalityCardProps) {
  return (
    <button
      onClick={() => onClick(personality.id)}
      title={`Select ${personality.name} personality`}
      aria-label={`Select ${personality.name} personality`}
      className={`relative glass-panel rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] group ${
        isActive
          ? 'border-2 shadow-lg'
          : 'border border-cyan-800/20 hover:border-cyan-600/40'
      }`}
      style={isActive ? { borderColor: personality.accent, boxShadow: `0 0 20px ${personality.accent}33` } : undefined}
    >
      {/* Accent Swatch */}
      <div className="flex items-center gap-3 mb-3">
        <div
          className="w-8 h-8 rounded-lg border border-white/10"
          style={{ backgroundColor: personality.accent }}
        />
        <div className="flex-1 min-w-0">
          <h3 className="font-display font-bold text-sm text-slate-200 truncate">{personality.name}</h3>
          <p className="text-[10px] font-mono text-slate-500 uppercase">{personality.id}</p>
        </div>
        {isActive && (
          <div className="flex-shrink-0 w-6 h-6 rounded-full bg-cyan-400/20 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-cyan-400" />
          </div>
        )}
      </div>

      {/* Color previews */}
      <div className="flex gap-1">
        <div className="w-4 h-4 rounded-full opacity-60" style={{ backgroundColor: personality.accent }} />
        {personality.primary && <div className="w-4 h-4 rounded-full opacity-60" style={{ backgroundColor: personality.primary }} />}
        {personality.secondary && <div className="w-4 h-4 rounded-full opacity-60" style={{ backgroundColor: personality.secondary }} />}
      </div>

      {/* Active glow effect */}
      {isActive && (
        <div
          className="absolute inset-0 rounded-xl pointer-events-none opacity-10"
          style={{ background: `radial-gradient(circle at center, ${personality.accent}, transparent)` }}
        />
      )}
    </button>
  );
}
