import React from 'react';

interface ArcReactorProps {
  active: boolean;
}

export const ArcReactor: React.FC<ArcReactorProps> = ({ active }) => {
  return (
    <div className={`relative w-64 h-64 rounded-full flex items-center justify-center transition-all duration-1000 
      ${active ? 'shadow-[0_0_80px_rgba(255,50,50,0.8)]' : 'shadow-[0_0_60px_rgba(0,255,255,0.6)] hover:shadow-[0_0_90px_rgba(0,255,255,0.8)]'}`}>
      
      {/* Outer segmented ring */}
      <div className={`absolute w-full h-full rounded-full border-[12px] border-dashed animate-[spin_12s_linear_infinite] opacity-80
        ${active ? 'border-red-600/60' : 'border-cyan-600/60'}`}></div>
      
      {/* Reverse spinning thin ring */}
      <div className={`absolute w-[92%] h-[92%] rounded-full border-2 border-dotted animate-[spin_8s_linear_infinite_reverse]
        ${active ? 'border-red-400' : 'border-cyan-400'}`}></div>

      {/* Static thick housing */}
      <div className={`absolute w-[80%] h-[80%] rounded-full border-8 shadow-[0_0_15px_inset_rgba(0,0,0,0.8)] 
        ${active ? 'border-red-900 bg-red-950/40' : 'border-gray-900 bg-cyan-950/40'}`}></div>

      {/* Inner Core Housing */}
      <div className={`absolute w-[60%] h-[60%] rounded-full border-4 flex items-center justify-center backdrop-blur-md transition-colors duration-500
        ${active ? 'border-red-500 bg-red-900/30' : 'border-cyan-400 bg-cyan-900/30'}`}>
        
        {/* Core Light Energy */}
        <div className={`w-[70%] h-[70%] rounded-full transition-all duration-500
          ${active 
            ? 'bg-red-500 animate-[pulse_0.5s_cubic-bezier(0.4,0,0.6,1)_infinite] shadow-[0_0_50px_rgba(255,0,0,1),0_0_100px_rgba(255,100,100,0.8)]' 
            : 'bg-cyan-300 shadow-[0_0_40px_rgba(0,255,255,1),0_0_80px_rgba(150,255,255,0.8)]'}`}>
        </div>
      </div>

      {/* Triangular details (simulated with rotated divs) */}
      <div className="absolute inset-0 rounded-full flex items-center justify-center pointer-events-none opacity-60">
        {[0, 60, 120].map((deg) => (
          <div key={deg} 
               className={`absolute w-full h-[2px] ${active ? 'bg-red-500' : 'bg-cyan-500'}`} 
               style={{ transform: `rotate(${deg}deg)` }}></div>
        ))}
      </div>
      
      {/* Inner secondary glowing ring */}
      <div className={`absolute w-[45%] h-[45%] rounded-full border-2 animate-ping opacity-20
        ${active ? 'border-red-200' : 'border-cyan-100'}`}
        style={{ animationDuration: '2s' }}></div>

    </div>
  );
};