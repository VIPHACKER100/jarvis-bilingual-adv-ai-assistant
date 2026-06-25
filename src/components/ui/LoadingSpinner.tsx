import React from "react";
import { cn } from "../../lib/utils";

interface LoadingSpinnerProps {
  className?: string;
  size?: "sm" | "md" | "lg" | "xl";
  fullScreen?: boolean;
  label?: string;
}

export function LoadingSpinner({
  className,
  size = "md",
  fullScreen = false,
  label = "Loading...",
}: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: "w-6 h-6",
    md: "w-12 h-12",
    lg: "w-24 h-24",
    xl: "w-32 h-32",
  };

  const spinner = (
    <div
      className={cn(
        "flex flex-col items-center justify-center gap-4",
        className,
      )}
    >
      <div
        className={cn(
          "relative flex items-center justify-center",
          sizeClasses[size],
        )}
      >
        {/* Outer dashed ring */}
        <div className="absolute inset-0 border-[1.5px] border-dashed border-cyan-500/40 rounded-full animate-[spin_3s_linear_infinite]"></div>
        {/* Middle segmented ring */}
        <div className="absolute inset-1 border-[2px] border-transparent border-t-cyan-400 border-l-cyan-400/30 rounded-full animate-[spin_1.5s_linear_infinite_reverse]"></div>
        {/* Inner solid ring */}
        <div className="absolute inset-[25%] border border-cyan-300/50 rounded-full box-shadow-cyan bg-cyan-950/30 backdrop-blur-sm"></div>
        {/* Center dot */}
        <div className="w-1.5 h-1.5 bg-cyan-300 rounded-full box-shadow-cyan animate-pulse"></div>
      </div>
      {label && (
        <span className="text-[10px] font-bold tracking-[0.2em] uppercase text-cyan-500 text-shadow-cyan animate-pulse">
          {label}
        </span>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#030712]/80 backdrop-blur-md">
        {spinner}
      </div>
    );
  }

  return spinner;
}
