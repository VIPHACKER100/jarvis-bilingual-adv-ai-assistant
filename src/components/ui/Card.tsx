import type { ReactNode, HTMLAttributes } from 'react';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'strong' | 'cyber';
  children?: ReactNode;
}

export function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const v: Record<string, string> = { default: 'glass-panel', strong: 'glass-panel-strong', cyber: 'glass-panel cyber-border' };
  return <div className={['rounded-lg p-4', v[variant], className].filter(Boolean).join(' ')} {...props}>{children}</div>;
}
