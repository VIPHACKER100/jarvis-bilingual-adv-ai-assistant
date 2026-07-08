// ==========================================================================
// JARVIS v4.0 — Glassmorphism Input primitive
// ==========================================================================

import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  helperText?: string;
}

export function Input({
  label,
  error,
  helperText,
  className = '',
  id,
  ...rest
}: InputProps) {
  const inputId = id ?? label?.toLowerCase().replace(/\s+/g, '-');

  return (
    <div className="flex flex-col gap-1.5">
      {label && (
        <label
          htmlFor={inputId}
          className="font-display text-sm font-semibold uppercase tracking-wider text-cyan-300"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={`w-full px-4 py-2.5 bg-cyber-surface/60 backdrop-blur-md border rounded-lg font-mono text-sm text-slate-200 placeholder-slate-500 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50 disabled:opacity-40 disabled:cursor-not-allowed ${
          error
            ? 'border-neon-error/50 focus-visible:ring-neon-error/40'
            : 'border-cyan-800/30 hover:border-cyan-600/50'
        } ${className}`}
        {...rest}
      />
      {error && <span className="text-xs text-neon-error font-medium">{error}</span>}
      {helperText && !error && (
        <span className="text-xs text-slate-500">{helperText}</span>
      )}
    </div>
  );
}
