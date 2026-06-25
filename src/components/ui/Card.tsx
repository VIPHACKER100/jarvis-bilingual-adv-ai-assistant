/**
 * Card — Glassmorphism card component
 *
 * Uses Design System V3 glass-panel with optional chamfered corners.
 */

import type { ReactNode, HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'cyber';
  chamfered?: boolean;
  title?: string;
  subtitle?: string;
  children?: ReactNode;
}

export function Card({
  className,
  variant = 'default',
  chamfered = false,
  title,
  subtitle,
  children,
  ...props
}: CardProps) {
  const variantClasses: Record<string, string> = {
    default: 'glass-panel',
    strong: 'glass-panel-strong',
    cyber: 'glass-panel cyber-border holographic-sheen',
  };

  return (
    <div
      className={cn(
        'rounded-lg p-4',
        variantClasses[variant],
        chamfered && 'chamfered',
        className,
      )}
      {...props}
    >
      {(title || subtitle) && (
        <div className="mb-3">
          {title && (
            <h3 className="text-sm font-display font-bold tracking-wider text-cyan-300 uppercase">
              {title}
            </h3>
          )}
          {subtitle && (
            <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>
          )}
        </div>
      )}
      {children}
    </div>
  );
}
