import React, { FC } from 'react';
import { motion } from 'framer-motion';

type BadgeVariant = 'success' | 'warning' | 'danger' | 'info' | 'accent' | 'ghost';

interface BadgeProps {
  variant?: BadgeVariant;
  pulse?: boolean;
  children: React.ReactNode;
  className?: string;
}

export const Badge: FC<BadgeProps> = ({
  variant = 'accent',
  pulse = false,
  children,
  className = ''
}) => {
  const variantStyles = {
    success: 'badge-success',
    warning: 'badge-warning',
    danger: 'badge-danger',
    info: 'badge-info',
    accent: 'bg-accent/10 text-accent border-accent/20',
    ghost: 'bg-transparent text-foreground-subtle border-border-default'
  };

  return (
    <div className={`badge ${variantStyles[variant]} ${className}`}>
      {pulse && (
        <span className="relative flex h-1.5 w-1.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-current opacity-75"></span>
          <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-current"></span>
        </span>
      )}
      {children}
    </div>
  );
};
