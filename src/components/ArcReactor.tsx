import React, { FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

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
    if (eventLoopLag > 100) return 'rgba(255, 59, 105, 0.6)'; // security-rose (Red alert)
    if (eventLoopLag > 50) return 'rgba(168, 85, 247, 0.6)'; // neural-purple (Warning)
    return 'rgba(76, 215, 246, 0.6)'; // accent (Optimal)
  }, [eventLoopLag]);

  return (
    <div className="relative group cursor-pointer" onClick={onClick}>
      {/* Tactical Outer Perimeter */}
      <AnimatePresence>
        {isActive && (
          <>
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1.4, opacity: 0.1 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 3, ease: "easeOut" }}
              className="absolute inset-0 rounded-full border border-accent pointer-events-none"
            />
            <motion.div
              initial={{ rotate: 0 }}
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 20, ease: "linear" }}
              className="absolute -inset-8 border border-dashed border-accent/10 rounded-full pointer-events-none"
            />
          </>
        )}
      </AnimatePresence>

      {/* Primary Reactor Assembly */}
      <motion.div
        animate={{
          scale: isActive ? [1, 1.02, 1] : 1,
          boxShadow: isActive 
            ? `0 0 80px ${glowColor}, inset 0 0 30px ${glowColor}`
            : '0 0 20px rgba(76, 215, 246, 0.05)',
        }}
        transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
        className={`relative w-56 h-56 md:w-64 md:h-64 rounded-full flex items-center justify-center border transition-all duration-700 overflow-hidden ${
          isActive 
            ? 'border-accent/50 bg-accent/[0.03] shadow-[0_0_40px_rgba(76,215,246,0.1)]' 
            : 'border-border-subtle bg-surface-low/30'
        }`}
      >
        {/* Internal HUD Elements */}
        <div className="absolute inset-0 scanline opacity-[0.03] pointer-events-none" />
        
        {/* Dynamic Rotation Rings */}
        <motion.div 
          animate={{ rotate: isActive ? 360 : 0 }}
          transition={{ repeat: Infinity, duration: 15, ease: "linear" }}
          className="absolute inset-4 rounded-full border border-accent/20 border-t-accent/40 opacity-40" 
        />
        <motion.div 
          animate={{ rotate: isActive ? -360 : 0 }}
          transition={{ repeat: Infinity, duration: 25, ease: "linear" }}
          className="absolute inset-10 rounded-full border border-dashed border-neural-purple/20 opacity-30" 
        />

        {/* Sector Markers */}
        {[0, 90, 180, 270].map((angle) => (
          <div 
            key={angle}
            className="absolute w-6 h-0.5 bg-accent/40"
            style={{ transform: `rotate(${angle}deg) translateY(-110px)` }}
          />
        ))}
        
        {/* Core Matrix */}
        <div className="relative z-10 flex flex-col items-center">
          <div className="relative">
            {/* Hexagonal Inner Core Visual */}
            <motion.div 
              animate={isActive ? { rotate: [0, 90, 180, 270, 360] } : {}}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="w-20 h-20 md:w-24 md:h-24 border-2 border-accent/30 rounded-2xl flex items-center justify-center relative bg-accent/5 backdrop-blur-sm"
            >
              <div className="absolute inset-2 border border-accent/20 rounded-xl" />
              <div className={`w-10 h-10 rounded-full shadow-[0_0_25px_rgba(76,215,246,0.6)] transition-all duration-1000 ${
                isActive ? 'bg-accent animate-pulse' : 'bg-foreground-subtle/20'
              }`} />
              
              {/* Data Pulse Particles */}
              {isActive && [0, 60, 120, 180, 240, 300].map((angle) => (
                <motion.div
                  key={angle}
                  animate={{ 
                    x: [0, Math.cos(angle * Math.PI / 180) * 50],
                    y: [0, Math.sin(angle * Math.PI / 180) * 50],
                    opacity: [0, 0.8, 0],
                    scale: [0.5, 1, 0.5]
                  }}
                  transition={{ repeat: Infinity, duration: 2, delay: angle / 180 }}
                  className="absolute w-1.5 h-1.5 bg-accent rounded-full blur-[1px]"
                />
              ))}
            </motion.div>
            
            {/* Orbiting Telemetry Bits */}
            {isActive && (
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
                className="absolute -inset-6 border border-accent/10 rounded-full border-l-accent/40"
              />
            )}
          </div>

          {/* Tactical Readouts */}
          <div className="mt-8 flex flex-col items-center gap-1">
            <span className="label-caps text-[11px] text-accent font-bold tracking-[0.4em] drop-shadow-[0_0_8px_rgba(76,215,246,0.4)]">
              {isActive ? 'System_Active' : 'Standby_Mode'}
            </span>
            <div className="flex items-center gap-2 opacity-40">
              <span className="label-caps text-[7px] tracking-widest font-mono">Core_Temp: 34.2°C</span>
              <div className="w-1 h-1 rounded-full bg-accent" />
              <span className="label-caps text-[7px] tracking-widest font-mono">Sync: 99%</span>
            </div>
          </div>
        </div>

        {/* Decorative HUD Accents */}
        <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-accent/20" />
        <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-accent/20" />
        <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-accent/20" />
        <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-accent/20" />
      </motion.div>

      {/* Radial Hover Interaction */}
      <div className="absolute -inset-8 bg-accent/5 rounded-full blur-3xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none" />
    </div>
  );
};