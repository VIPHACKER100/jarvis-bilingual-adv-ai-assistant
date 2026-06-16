import React, { FC, InputHTMLAttributes } from 'react';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

export const Input: FC<InputProps> = ({
  label,
  error,
  leftIcon,
  rightIcon,
  className = '',
  ...props
}) => (
  <div className={`form-group ${className}`}>
    {label && <label className="form-label">{label}</label>}
    <div className="relative">
      {leftIcon && (
        <div className="absolute left-3 top-1/2 -translate-y-1/2 text-foreground-subtle pointer-events-none">
          {leftIcon}
        </div>
      )}
      <input
        className={`form-input ${leftIcon ? 'pl-10' : ''} ${rightIcon ? 'pr-10' : ''} ${error ? 'form-input--error' : ''}`}
        {...props}
      />
      {rightIcon && (
        <div className="absolute right-3 top-1/2 -translate-y-1/2 text-foreground-subtle pointer-events-none">
          {rightIcon}
        </div>
      )}
    </div>
    {error && <span className="form-error">{error}</span>}
  </div>
);
