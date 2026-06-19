import { FC, useLayoutEffect, useRef } from 'react';

interface VolumeControlProps {
  level: number;
}

export const VolumeControl: FC<VolumeControlProps> = ({ level }) => {
  const barRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (barRef.current) {
      barRef.current.style.width = `${level}%`;
    }
  }, [level]);

  return (
    <div className="flex flex-col items-center space-y-2 w-full">
      <div className="flex justify-between w-full text-[10px] font-mono tracking-widest uppercase">
        <span className="text-foreground-muted">Vol.Control</span>
        <span className="text-accent font-bold">{level}%</span>
      </div>
      <div className="w-full h-1.5 bg-surface-low rounded-full overflow-hidden border border-border-subtle relative">
        <div
          ref={barRef}
          className="h-full bg-gradient-to-r from-cyan-600 to-accent transition-all duration-300 rounded-full"
        />
        <div className="absolute top-0 left-1/4 w-px h-full bg-background-deep/50" />
        <div className="absolute top-0 left-2/4 w-px h-full bg-background-deep/50" />
        <div className="absolute top-0 left-3/4 w-px h-full bg-background-deep/50" />
      </div>
    </div>
  );
};
