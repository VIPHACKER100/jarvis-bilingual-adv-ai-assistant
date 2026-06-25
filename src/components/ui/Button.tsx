import React from "react";
import { cn } from "../../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface ButtonProps extends HTMLMotionProps<"button"> {
  variant?: "primary" | "secondary" | "ghost" | "danger";
  size?: "sm" | "md" | "lg";
  loading?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className,
      variant = "primary",
      size = "md",
      loading,
      children,
      ...props
    },
    ref,
  ) => {
    const baseClasses =
      "inline-flex items-center justify-center rounded-md font-display font-semibold tracking-wider uppercase transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/20 disabled:opacity-50 disabled:pointer-events-none ring-offset-background";

    const variants = {
      primary:
        "bg-cyan-600/20 text-cyan-400 hover:bg-cyan-500/30 border border-cyan-500/50 backdrop-blur-sm box-shadow-cyan",
      secondary:
        "bg-slate-800/50 text-slate-200 hover:bg-slate-700/50 border border-slate-700 backdrop-blur-sm",
      ghost: "hover:bg-slate-800/50 text-slate-400 hover:text-slate-200",
      danger:
        "bg-red-500/20 text-red-400 hover:bg-red-500/30 border border-red-500/50 backdrop-blur-sm",
    };

    const sizes = {
      sm: "h-9 px-3 text-xs",
      md: "h-10 px-4 py-2 text-sm",
      lg: "h-11 px-8 text-base",
    };

    return (
      <motion.button
        ref={ref}
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
        className={cn(baseClasses, variants[variant], sizes[size], className)}
        disabled={loading || props.disabled}
        {...props}
      >
        {loading ? (
          <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
        ) : null}
        {children}
      </motion.button>
    );
  },
);
Button.displayName = "Button";
