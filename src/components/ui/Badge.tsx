// ==========================================================================
// JARVIS v4.0 — Badge primitive
// ==========================================================================

import React from 'react';

type BadgeVariant = 'info' | 'success' | 'warning' | 'error' | 'default';

interface BadgeProps {
  children: React.ReactNode;
  variant?: BadgeVariant;
  className?: string;
}

const variantClasses: Record<BadgeVariant, string> = {
  info: 'bg-cyan-900/40 text-cyan-300 border-cyan-700/40',
  success: 'bg-green-900/40 text-green-300 border-green-700/40',
  warning: 'bg-yellow-900/40 text-yellow-300 border-yellow-700/40',
  error: 'bg-rose-900/40 text-rose-300 border-rose-700/40',
  default: 'bg-slate-800/40 text-slate-300 border-slate-700/40',
};

export function Badge({ children, variant = 'default', className = '' }: BadgeProps) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2.5 py-0.5 text-xs font-semibold font-mono rounded-full border ${variantClasses[variant]} ${className}`}
    >
      {children}
    </span>
  );
}
