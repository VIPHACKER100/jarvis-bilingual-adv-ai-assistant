import React, { useLayoutEffect, useRef } from 'react';

interface VolumeControlProps {
  level: number;
}

export const VolumeControl: React.FC<VolumeControlProps> = ({ level }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${level}%`;
    }
  }, [level]);

  return (
    <div className="flex flex-col items-center space-y-3 w-full md:w-64">
      <div className="flex justify-between w-full text-[10px] text-foreground-muted font-mono tracking-[0.2em] uppercase">
        <span className="opacity-60">Output_Level</span>
        <span className="text-accent font-bold">{level}%</span>
      </div>
      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-border-default relative">
        <div
          ref={barRef}
          className="h-full bg-accent shadow-[0_0_10px_var(--accent)] transition-all duration-300"
        />
        {/* Technical Markers */}
        {[0.25, 0.5, 0.75].map(pos => (
          <div 
            key={pos}
            className="absolute top-0 w-px h-full bg-border-default opacity-20" 
            style={{ left: `${pos * 100}%` }}
          />
        ))}
      </div>
    </div>
  );
};