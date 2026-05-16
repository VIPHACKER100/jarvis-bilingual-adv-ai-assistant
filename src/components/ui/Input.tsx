import React, { FC, InputHTMLAttributes, useState } from 'react';
import { motion } from 'framer-motion';

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
  onFocus,
  onBlur,
  ...props
}) => {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <div className={`flex flex-col gap-1.5 w-full ${className}`}>
      {label && (
        <label className="text-[10px] font-mono font-bold text-foreground-subtle uppercase tracking-widest ml-1">
          {label}
        </label>
      )}
      
      <div className="relative group">
        {/* Focus Glow Background */}
        <motion.div
          animate={{
            opacity: isFocused ? 1 : 0,
            scale: isFocused ? 1 : 0.98,
          }}
          className="absolute -inset-[1px] bg-gradient-to-r from-accent/50 to-secondary/50 rounded-xl blur-[2px] z-0"
        />
        
        <div className={`relative z-10 flex items-center glass-panel border ${
          error ? 'border-danger/50 bg-danger/5' : isFocused ? 'border-accent/50 bg-accent/5' : 'border-border-default'
        } rounded-xl overflow-hidden transition-all duration-300`}>
          
          {leftIcon && (
            <div className="pl-3 text-foreground-subtle group-focus-within:text-accent transition-colors">
              {leftIcon}
            </div>
          )}
          
          <input
            className="w-full bg-transparent px-4 py-3 text-sm text-foreground placeholder:text-foreground-subtle outline-none font-sans"
            onFocus={(e) => {
              setIsFocused(true);
              onFocus?.(e);
            }}
            onBlur={(e) => {
              setIsFocused(false);
              onBlur?.(e);
            }}
            {...props}
          />
          
          {rightIcon && (
            <div className="pr-3 text-foreground-subtle group-focus-within:text-accent transition-colors">
              {rightIcon}
            </div>
          )}
        </div>
      </div>
      
      {error && (
        <motion.p
          initial={{ opacity: 0, y: -5 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-[10px] text-danger font-medium mt-1 ml-1"
        >
          {error}
        </motion.p>
      )}
    </div>
  );
};
