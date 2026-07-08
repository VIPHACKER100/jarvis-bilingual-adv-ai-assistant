import React from 'react';

interface VolumeVisualizerProps {
  volume: number;
}

export const VolumeVisualizer: React.FC<VolumeVisualizerProps> = ({ volume }) => {
  // Create an array of 20 bars
  const bars = Array.from({ length: 20 }, (_, i) => i);
  const activeBars = Math.round((volume / 100) * 20);

  return (
    <div className="flex-1 flex items-end justify-between gap-1 h-full w-full py-2">
      {bars.map((i) => (
        <div
          key={i}
          className={`w-full transition-all duration-300 ease-in-out
            ${i < activeBars 
               ? 'bg-cyan-500 shadow-[0_0_5px_cyan]' 
               : 'bg-cyan-900/30'}`}
          style={{ 
            height: `${Math.max(10, Math.random() * 40 + (i < activeBars ? 40 : 10))}%`,
            opacity: i < activeBars ? 1 : 0.3
          }}
        ></div>
      ))}
      <div className="absolute top-2 right-2 font-tech text-xl text-cyan-400">
        {volume}%
      </div>
    </div>
  );
};