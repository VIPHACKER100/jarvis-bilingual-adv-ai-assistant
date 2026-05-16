import React, { useLayoutEffect, useRef } from 'react';
import { VolumeX, Volume2 } from 'lucide-react';

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

  const isMuted = level === 0;

  return (
    <div className="glass-panel p-4 rounded-xl w-full md:w-64">
      <div className="flex flex-col items-center space-y-3">
        <div className="flex justify-between w-full text-[10px] text-foreground-muted font-mono tracking-[0.2em] uppercase">
          <div className="flex items-center gap-1.5 opacity-60">
            {isMuted ? (
              <VolumeX className="w-3 h-3 text-red-400" />
            ) : (
              <Volume2 className="w-3 h-3 text-accent" />
            )}
            <span>Output_Level</span>
          </div>
          <span className={`font-bold ${isMuted ? 'text-red-400' : 'text-accent'}`}>{level}%</span>
        </div>
        <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden border border-border-default relative">
          <div
            ref={barRef}
            className={`h-full transition-all duration-300 ${isMuted ? 'bg-red-400' : 'bg-accent shadow-[0_0_10px_var(--accent)]'}`}
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
    </div>
  );
};