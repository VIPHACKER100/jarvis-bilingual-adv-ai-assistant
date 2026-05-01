import { useEffect, useState, FC } from 'react';
import { sfx } from '../utils/audioUtils';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
  eventLoopLag?: number;
}

export const ArcReactor: FC<ArcReactorProps> = ({ isActive, onClick, language, eventLoopLag = 0 }) => {
  const [rotation, setRotation] = useState(0);

  const isLagging = eventLoopLag > 10;
  const isCritical = eventLoopLag > 50;

  // Simple rotation effect for interaction
  useEffect(() => {
    let interval: any;
    if (isActive) {
      interval = setInterval(() => {
        setRotation(r => (r + 1) % 360);
      }, 50);
    }
    return () => clearInterval(interval);
  }, [isActive]);

  const handleClick = () => {
    if (!isActive) {
      sfx.playActivation(); // Play cool sound
    } else {
      sfx.playDeactivation();
    }
    onClick();
  };

  return (
    <div 
      className={`relative flex items-center justify-center p-4 md:p-10 cursor-pointer group ${isLagging ? 'animate-vibrate' : ''}`} 
      onClick={handleClick}
      onMouseEnter={() => sfx.playBlip()}
    >
      {/* Glitch Overlay if critical */}
      {isCritical && (
        <div className="absolute inset-0 z-50 pointer-events-none mix-blend-overlay opacity-30 animate-glitch bg-red-500/10" />
      )}

      {/* --- Ambient Glow (Far Field) --- */}
      <div className={`absolute rounded-full transition-all duration-1000 ${isActive
        ? 'w-[300px] h-[300px] md:w-[500px] md:h-[500px] bg-gradient-to-r from-accent/20 to-indigo-500/20 blur-3xl animate-pulse-core'
        : 'w-48 h-48 md:w-64 md:h-64 bg-slate-900/40 blur-xl opacity-50'
        }`} />

      {/* --- Outer Mechanical Ring (Slow Rotate) --- */}
      <div className={`absolute w-64 h-64 md:w-80 md:h-80 rounded-full border border-white/5 border-dashed ${isActive ? 'animate-spin-slow' : 'opacity-30'}`}></div>

      {/* --- Middle Reactor Ring (Fast Rotate) --- */}
      <div className={`absolute w-56 h-56 md:w-72 md:h-72 rounded-full border-2 border-indigo-900/20 ${isActive ? 'animate-spin-reverse-slow' : ''}`}>
        <div className="absolute top-0 left-1/2 w-1.5 h-3 md:w-2 md:h-4 bg-accent/40 transform -translate-x-1/2"></div>
        <div className="absolute bottom-0 left-1/2 w-1.5 h-3 md:w-2 md:h-4 bg-accent/40 transform -translate-x-1/2"></div>
      </div>

      {/* --- Inner Energy Ring (Pulsing) --- */}
      <div className={`absolute w-48 h-48 md:w-64 md:h-64 rounded-full border border-white/5 flex items-center justify-center transition-all duration-500 shadow-2xl ${isActive ? 'shadow-[0_0_50px_rgba(94,106,210,0.3)] scale-100' : 'scale-95 opacity-80'
        }`}>
        <div className={`absolute inset-0 rounded-full border-2 border-transparent ${isActive ? 'animate-spin-fast reactor-ring-1' : ''}`}></div>
        <div className={`absolute inset-2 rounded-full border-2 border-transparent ${isActive ? 'animate-spin-reverse-slow reactor-ring-2' : ''}`}></div>
      </div>

      {/* --- Core Button Interface --- */}
      <button
        className={`
          relative z-10 w-36 h-36 md:w-48 md:h-48 rounded-full 
          flex flex-col items-center justify-center
          transition-all duration-300 transform group-hover:scale-105 group-active:scale-95
          overflow-hidden backdrop-blur-md
          ${isActive
            ? 'bg-accent/10 border-2 border-accent/50 shadow-[inset_0_0_40px_rgba(94,106,210,0.4)]'
            : 'bg-white/5 border border-white/10 shadow-none'
          }
        `}
      >
        {/* Central Triangle (Stark Tech) */}
        <svg
          viewBox="0 0 24 24"
          className={`relative z-20 w-14 h-14 md:w-20 md:h-20 mb-1 md:mb-2 transition-all duration-500 ${isActive
            ? 'text-accent drop-shadow-[0_0_15px_rgba(94,106,210,1)]'
            : 'text-foreground-muted opacity-40'
            }`}
          fill="currentColor"
        >
          <path d="M12 2L2 22h20L12 2zm0 4L18 20H6L12 6z" />
        </svg>

        {/* Status Text */}
        <div className="relative z-20 flex flex-col items-center">
          <span className={`text-[10px] md:text-xs font-mono font-bold tracking-[0.3em] transition-colors duration-300 ${isActive ? 'text-accent' : 'text-foreground-muted'}`}>
            {isActive
              ? (language === 'hi' ? 'ON' : 'ACTIVE')
              : (language === 'hi' ? 'OFF' : 'STANDBY')
            }
          </span>
          <div className={`h-0.5 w-8 md:w-12 mt-1 rounded-full transition-all duration-300 ${isActive ? 'bg-accent shadow-[0_0_10px_rgba(94,106,210,1)]' : 'bg-white/10'}`}></div>
        </div>
        {/* Scanline Effect inside button */}
        {isActive && <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/10 to-transparent w-full h-full animate-scanline opacity-40 pointer-events-none"></div>}
      </button>

    </div>
  );
};