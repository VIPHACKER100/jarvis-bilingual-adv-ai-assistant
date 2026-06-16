import React, { FC } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CardElevation = 'low' | 'mid' | 'high';

interface CardProps extends HTMLMotionProps<'div'> {
  elevation?: CardElevation;
  interactive?: boolean;
  statusBorder?: 'none' | 'success' | 'warning' | 'danger' | 'accent';
  children: React.ReactNode;
}

const elevationStyles: Record<CardElevation, string> = {
  low: 'hud-panel',
  mid: 'hud-panel bg-surface-mid border-border-bright',
  high: 'hud-panel border-accent/40 shadow-accent chamfered',
};

const statusStyles: Record<string, string> = {
  none: '',
  success: 'border-l-[3px] border-l-success',
  warning: 'border-l-[3px] border-l-warning',
  danger: 'border-l-[3px] border-l-danger',
  accent: 'border-l-[3px] border-l-accent',
};

export const Card: FC<CardProps> = ({
  elevation = 'low',
  interactive = false,
  statusBorder = 'none',
  children,
  className = '',
  ...props
}) => (
  <motion.div
    whileHover={interactive ? { translateY: -4, scale: 1.01 } : {}}
    className={`relative overflow-hidden ${elevationStyles[elevation]} ${statusStyles[statusBorder]} ${className}`}
    {...props}
  >
    {elevation === 'high' && <div className="scanline" />}
    {elevation === 'high' && (
      <>
        <div className="absolute top-0 left-0 w-5 h-5 border-t-2 border-l-2 border-cyan-400/40 pointer-events-none" />
        <div className="absolute top-0 right-0 w-5 h-5 border-t-2 border-r-2 border-cyan-400/40 pointer-events-none" />
        <div className="absolute bottom-0 left-0 w-5 h-5 border-b-2 border-l-2 border-cyan-400/40 pointer-events-none" />
        <div className="absolute bottom-0 right-0 w-5 h-5 border-b-2 border-r-2 border-cyan-400/40 pointer-events-none" />
        <div className="absolute inset-0 bg-gradient-to-br from-transparent via-white/[0.02] to-transparent pointer-events-none holo-card" />
      </>
    )}
    <div className="p-5">{children}</div>
  </motion.div>
);
