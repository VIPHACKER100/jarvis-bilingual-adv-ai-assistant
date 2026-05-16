import React, { FC, useMemo } from 'react';
import { motion } from 'framer-motion';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
  eventLoopLag?: number;
}

export const ArcReactor: FC<ArcReactorProps> = ({ 
  isActive, 
  onClick, 
  language,
  eventLoopLag = 0 
}) => {
  // Dynamic glow color based on system health (lag)
  const glowColor = useMemo(() => {
    if (eventLoopLag > 100) return 'rgba(239, 68, 68, 0.6)'; // Red alert
    if (eventLoopLag > 50) return 'rgba(245, 158, 11, 0.6)'; // Warning
    return 'rgba(94, 106, 210, 0.6)'; // Optimal (Accent)
  }, [eventLoopLag]);

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* Outer Pulse Ripple */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0.5 }}
            animate={{ scale: 1.6, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
            className="absolute inset-0 rounded-full border-2 border-accent/30 pointer-events-none"
          />
        )}
      </AnimatePresence>

      {/* Main Reactor Body */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.05, 1] : 1,
          boxShadow: isActive 
            ? `0 0 60px ${glowColor}, inset 0 0 20px ${glowColor}`
            : '0 0 20px rgba(255, 255, 255, 0.05)',
        }}
        transition={{ repeat: Infinity, duration: 3, ease: "easeInOut" }}
        className={`relative w-48 h-48 md:w-56 md:h-56 rounded-full glass-panel flex items-center justify-center border-2 transition-colors duration-700 ${
          isActive ? 'border-accent/40 bg-accent/5' : 'border-border-default bg-surface-low'
        }`}
      >
        {/* Decorative Rings */}
        <div className="absolute inset-4 rounded-full border border-border-subtle animate-spin-slow opacity-30" />
        <div className="absolute inset-8 rounded-full border border-dashed border-border-bright animate-spin-reverse-slow opacity-20" />
        
        {/* Core Elements */}
        <div className="relative z-10 flex flex-col items-center">
          {/* Central Hexagon or Circle Visual */}
          <motion.div 
            animate={isActive ? { rotate: 360 } : {}}
            transition={{ repeat: Infinity, duration: 10, ease: "linear" }}
            className="w-16 h-16 md:w-20 md:h-20 border-4 border-accent/20 rounded-xl flex items-center justify-center relative"
          >
            <div className={`w-8 h-8 rounded-full shadow-[0_0_15px_rgba(var(--accent-rgb),0.5)] transition-all duration-1000 ${
              isActive ? 'bg-accent' : 'bg-foreground-subtle'
            }`} />
            
            {/* Thinking Particles (Visual Only) */}
            {isActive && [0, 45, 90, 135, 180, 225, 270, 315].map((angle) => (
              <motion.div
                key={angle}
                animate={{ 
                  x: [0, Math.cos(angle) * 40],
                  y: [0, Math.sin(angle) * 40],
                  opacity: [0, 1, 0]
                }}
                transition={{ repeat: Infinity, duration: 1.5, delay: angle / 360 }}
                className="absolute w-1 h-1 bg-accent rounded-full"
              />
            ))}
          </motion.div>

          {/* Status Text */}
          <div className="mt-4 flex flex-col items-center">
            <span className="text-[10px] font-mono text-accent font-bold uppercase tracking-[0.3em]">
              {isActive ? 'Active' : 'Standby'}
            </span>
            <span className="text-[8px] font-mono text-foreground-subtle uppercase tracking-tighter mt-1">
              Neural_Link_v3.9
            </span>
          </div>
        </div>

        {/* Outer Segments (UI Flourish) */}
        {[0, 1, 2, 3].map((i) => (
          <div 
            key={i}
            className="absolute w-4 h-1 bg-accent/30 rounded-full"
            style={{ 
              transform: `rotate(${i * 90}deg) translateY(-100px)`,
              opacity: isActive ? 1 : 0.3
            }}
          />
        ))}
      </motion.div>

      {/* Interactive Hover Glow */}
      <div className="absolute -inset-4 bg-accent/5 rounded-full blur-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};

// Required for AnimatePresence
import { AnimatePresence } from 'framer-motion';