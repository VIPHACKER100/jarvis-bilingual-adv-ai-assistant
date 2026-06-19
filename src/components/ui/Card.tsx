import React, { FC, useRef, useState, useCallback } from 'react';
import { motion, HTMLMotionProps } from 'framer-motion';

type CardElevation = 'low' | 'mid' | 'high';

interface CardProps extends HTMLMotionProps<'div'> {
  elevation?: CardElevation;
  interactive?: boolean;
  statusBorder?: 'none' | 'success' | 'warning' | 'danger' | 'accent';
  spotlight?: boolean;
  children: React.ReactNode;
}

const elevationStyles: Record<CardElevation, string> = {
  low: 'glass-panel',
  mid: 'glass-panel border-white/[0.08] shadow-md',
  high: 'glass-panel--high',
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
  spotlight = false,
  children,
  className = '',
  ...props
}) => {
  const cardRef = useRef<HTMLDivElement>(null);
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });
  const [isHovered, setIsHovered] = useState(false);

  const handleMouseMove = useCallback((e: React.MouseEvent) => {
    if (!cardRef.current || !spotlight) return;
    const rect = cardRef.current.getBoundingClientRect();
    setMousePos({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  }, [spotlight]);

  return (
    <motion.div
      ref={cardRef}
      whileHover={interactive ? { y: -4, scale: 1.01 } : {}}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      onMouseMove={handleMouseMove}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative overflow-hidden rounded-2xl ${elevationStyles[elevation]} ${statusStyles[statusBorder]} ${className}`}
      {...props}
    >
      {spotlight && isHovered && (
        <div
          className="absolute inset-0 pointer-events-none transition-opacity duration-300"
          style={{
            background: `radial-gradient(300px circle at ${mousePos.x}px ${mousePos.y}px, rgba(94,106,210,0.15), transparent 70%)`,
          }}
        />
      )}
      {elevation === 'high' && (
        <div
          className="absolute inset-0 rounded-2xl pointer-events-none opacity-0 hover:opacity-100 transition-opacity duration-500"
          style={{
            background: 'linear-gradient(to bottom, rgba(94,106,210,0.15), transparent)',
            mask: 'linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)',
            maskComposite: 'exclude',
            padding: 1,
          }}
        />
      )}
      <div className="p-5">{children}</div>
    </motion.div>
  );
};
