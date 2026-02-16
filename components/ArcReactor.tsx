import React from 'react';

interface ArcReactorProps {
  isActive: boolean;
  onClick: () => void;
  language: 'en' | 'hi';
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ isActive, onClick, language }) => {
  return (
    <div className="relative flex items-center justify-center">
      {/* Outer Glow Ring */}
      <div className={`absolute rounded-full transition-all duration-500 ${
        isActive 
          ? 'w-72 h-72 bg-cyan-500/20 blur-xl animate-pulse' 
          : 'w-64 h-64 bg-slate-800/20 blur-md'
      }`} />
      
      {/* Mechanical Ring */}
      <div className={`absolute w-60 h-60 rounded-full border-4 border-slate-700 border-dashed ${isActive ? 'reactor-spin' : ''}`} />

      {/* Main Button */}
      <button 
        onClick={onClick}
        className={`
          relative z-10 w-48 h-48 rounded-full border-4 
          flex flex-col items-center justify-center
          transition-all duration-300 transform hover:scale-105 active:scale-95
          shadow-[0_0_20px_rgba(6,182,212,0.4)]
          ${isActive 
            ? 'bg-slate-900 border-cyan-400 shadow-[0_0_50px_rgba(34,211,238,0.6)]' 
            : 'bg-slate-900/80 border-slate-600 hover:border-cyan-700'
          }
        `}
      >
        {/* Core Glow */}
        <div className={`absolute inset-0 rounded-full bg-cyan-400/10 ${isActive ? 'animate-pulse' : ''}`} />
        
        {/* Triangle Shape (Iron Man style) */}
        <svg 
          viewBox="0 0 24 24" 
          className={`w-16 h-16 mb-2 transition-colors duration-300 ${isActive ? 'text-cyan-400 drop-shadow-[0_0_10px_rgba(34,211,238,1)]' : 'text-slate-500'}`}
          fill="currentColor"
        >
          <path d="M12 2L2 22h20L12 2zm0 3.5L18.5 20h-13L12 5.5z" />
          <circle cx="12" cy="13.5" r="2.5" className={isActive ? 'animate-ping' : ''} />
        </svg>

        <span className={`text-sm font-bold tracking-wider ${isActive ? 'text-cyan-300' : 'text-slate-400'}`}>
          {isActive 
             ? (language === 'hi' ? 'DEACTIVATE' : 'DEACTIVATE') // Keeping English mostly for tech feel, or switch
             : (language === 'hi' ? 'ACTIVATE' : 'ACTIVATE')
          }
        </span>
        <span className={`text-xs mt-1 ${isActive ? 'text-cyan-300/70' : 'text-slate-500'}`}>
          {isActive 
             ? (language === 'hi' ? 'निष्क्रिय करें' : 'LISTENING...')
             : (language === 'hi' ? 'सक्रिय करें' : 'SYSTEM OFF')
          }
        </span>
      </button>
    </div>
  );
};