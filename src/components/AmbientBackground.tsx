import { FC } from 'react';
import { motion } from 'framer-motion';
import { useJarvisStore } from '../store/jarvisStore';
import { AppMode } from '../types';

export const AmbientBackground: FC = () => {
  const mode = useJarvisStore(s => s.mode);
  const isActive = mode !== AppMode.IDLE;

  return (
    <>
      <div className="linear-bg" />
      <div className="noise-overlay" />
      <div className="grid-overlay" />
      <div className="scanline-overlay" />
      <div className="hud-glow-bar" />

      {/* Blob 1: Cyan / Primary Glow */}
      <motion.div
        animate={{
          y: [0, -20, 0],
          rotate: [0, 1, 0],
          scale: [1, 1.05, 1],
        }}
        transition={{ duration: 10, repeat: Infinity, ease: 'easeInOut' }}
        className="ambient-blob"
        style={{
          width: 900,
          height: 1400,
          background: 'radial-gradient(circle, rgba(0, 212, 255, 0.12) 0%, transparent 70%)',
          top: '-400px',
          left: '50%',
          transform: 'translateX(-50%)',
        }}
      />
      
      {/* Blob 2: Indigo / Secondary Glow */}
      <motion.div
        animate={{
          y: [0, -15, 0],
          rotate: [0, -1, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{ duration: 12, repeat: Infinity, ease: 'easeInOut', delay: 2 }}
        className="ambient-blob"
        style={{
          width: 600,
          height: 800,
          background: 'radial-gradient(circle, rgba(94, 106, 210, 0.08) 0%, transparent 70%)',
          top: '20%',
          left: '-150px',
        }}
      />

      {/* Blob 3: Mode-reactive Central Pulse */}
      <motion.div
        animate={{
          opacity: isActive ? [0.15, 0.25, 0.15] : [0.05, 0.1, 0.05],
          scale: isActive ? [1, 1.1, 1] : [1, 1.03, 1],
        }}
        transition={{ duration: isActive ? 4 : 8, repeat: Infinity, ease: 'easeInOut' }}
        className="ambient-blob"
        style={{
          width: 800,
          height: 400,
          background: isActive 
            ? 'radial-gradient(circle, rgba(0, 212, 255, 0.15) 0%, transparent 70%)'
            : 'radial-gradient(circle, rgba(94, 106, 210, 0.08) 0%, transparent 70%)',
          bottom: '-100px',
          left: '20%',
        }}
      />
    </>
  );
};
