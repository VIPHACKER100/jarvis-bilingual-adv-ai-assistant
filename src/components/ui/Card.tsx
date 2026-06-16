import React, { FC } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CardElevation = 'low' | 'mid' | 'high';

interface CardProps extends HTMLMotionProps<'div'> {
  elevation?: CardElevation;
  interactive?: boolean;
  statusBorder?: 'none' | 'success' | 'warning' | 'danger' | 'accent';
  children: React.ReactNode;
}

export const Card: FC<CardProps> = ({
  elevation = 'low',
  interactive = false,
  statusBorder = 'none',
  children,
  className = '',
  ...props
}) => {
  const elevationStyles = {
    low: 'hud-panel',
    mid: 'hud-panel bg-surface-mid border-border-bright',
    high: 'hud-panel border-accent/40 shadow-accent'
  };

  const statusStyles = {
    none: '',
    success: 'border-l-4 border-l-success',
    warning: 'border-l-4 border-l-warning',
    danger: 'border-l-4 border-l-danger',
    accent: 'border-l-4 border-l-accent'
  };

  return (
    <motion.div
      whileHover={interactive ? { translateY: -4, scale: 1.01, boxShadow: 'var(--shadow-lg)' } : {}}
      className={`relative overflow-hidden ${elevationStyles[elevation]} ${statusStyles[statusBorder]} ${className} ${
        interactive ? 'cursor-pointer' : ''
      }`}
      {...props}
    >
      {/* Decorative HUD Corner (Top-Right) */}
      <div className="absolute top-0 right-0 w-8 h-8 opacity-20 pointer-events-none">
        <div className="absolute top-0 right-0 w-px h-full bg-foreground" />
        <div className="absolute top-0 right-0 h-px w-full bg-foreground" />
      </div>

      <div className="p-5">
        {children}
      </div>
      
      {/* Subtle Scanline Animation (optional layer) */}
      {elevation === 'high' && <div className="scanline" />}
    </motion.div>
  );
};
