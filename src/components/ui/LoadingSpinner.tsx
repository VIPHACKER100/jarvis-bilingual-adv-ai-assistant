/**
 * LoadingSpinner — Animated loading indicator
 *
 * Uses Design System V3 pulse animation with neon glow.
 */

import { cn } from '@/lib/utils';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  label?: string;
}

export function LoadingSpinner({ size = 'md', className, label }: LoadingSpinnerProps) {
  const sizeMap: Record<string, string> = {
    sm: 'h-4 w-4 border-2',
    md: 'h-8 w-8 border-2',
    lg: 'h-12 w-12 border-3',
  };

  return (
    <div className={cn('flex flex-col items-center justify-center gap-2', className)} role="status">
      <div
        className={cn(
          'animate-spin rounded-full border-cyan-500/30 border-t-cyan-400',
          sizeMap[size],
        )}
      />
      {label && (
        <span className="text-xs text-slate-500 font-mono animate-pulse">{label}</span>
      )}
    </div>
  );
}
