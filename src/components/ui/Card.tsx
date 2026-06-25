import React from "react";
import { cn } from "../../lib/utils";
import { motion, HTMLMotionProps } from "motion/react";

interface CardProps extends HTMLMotionProps<"div"> {
  variant?: "default" | "glass" | "outline";
}

export const Card = React.forwardRef<HTMLDivElement, CardProps>(
  ({ className, variant = "glass", children, ...props }, ref) => {
    const variants = {
      default: "bg-slate-900 border border-slate-800 text-slate-100",
      glass:
        "bg-slate-950/60 backdrop-blur-md border border-cyan-900/30 text-slate-100",
      outline: "bg-transparent border border-slate-800 text-slate-100",
    };

    return (
      <motion.div
        ref={ref}
        className={cn(
          "rounded-xl overflow-hidden",
          variants[variant],
          className,
        )}
        {...props}
      >
        {children}
      </motion.div>
    );
  },
);
Card.displayName = "Card";
