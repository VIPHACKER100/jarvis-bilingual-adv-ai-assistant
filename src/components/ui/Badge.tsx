import React, { FC } from 'react';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'ghost';

interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

const variantClass: Record<BadgeVariant, string> = {
  success: 'badge-success',
  warning: 'badge-warning',
  danger: 'badge-danger',
  info: 'badge-info',
  accent: 'badge-accent',
  ghost: 'bg-transparent text-foreground-subtle border-border-default',
};

export const Badge: FC<BadgeProps> = ({
  variant = 'accent',
  pulse = false,
  children,
  className = '',
}) => (
  <span className={`badge ${variantClass[variant]} ${className}`}>
    {pulse && (
      <span className="relative flex h-1.5 w-1.5">
        <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75" />
        <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current" />
      </span>
    )}
    {children}
  </span>
);
