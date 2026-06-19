import { FC } from 'react';
import { motion } from 'framer-motion';

export const AmbientBackground: FC = () => (
  <>
    <div className="linear-bg" />
    <div className="noise-overlay" />
    <div className="grid-overlay" />

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
        background: 'radial-gradient(circle, rgba(94,106,210,0.25) 0%, transparent 70%)',
        top: '-400px',
        left: '50%',
        transform: 'translateX(-50%)',
      }}
    />
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
        background: 'radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)',
        top: '20%',
        left: '-150px',
      }}
    />
    <motion.div
      animate={{
        y: [0, -12, 0],
        rotate: [0, 0.5, 0],
        scale: [1, 1.06, 1],
      }}
      transition={{ duration: 9, repeat: Infinity, ease: 'easeInOut', delay: 4 }}
      className="ambient-blob"
      style={{
        width: 500,
        height: 700,
        background: 'radial-gradient(circle, rgba(99,102,241,0.12) 0%, transparent 70%)',
        top: '10%',
        right: '-100px',
      }}
    />
    <motion.div
      animate={{
        opacity: [0.05, 0.1, 0.05],
        scale: [1, 1.03, 1],
      }}
      transition={{ duration: 6, repeat: Infinity, ease: 'easeInOut' }}
      className="ambient-blob"
      style={{
        width: 800,
        height: 400,
        background: 'radial-gradient(circle, rgba(94,106,210,0.1) 0%, transparent 70%)',
        bottom: '-100px',
        left: '20%',
      }}
    />
  </>
);
