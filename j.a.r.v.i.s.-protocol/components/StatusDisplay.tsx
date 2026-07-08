import React from 'react';
import { SystemState } from '../types';

interface StatusDisplayProps {
  state: SystemState;
  transcript: string;
}

export const StatusDisplay: React.FC<StatusDisplayProps> = ({ state, transcript }) => {
  return (
    <div className="text-center w-full max-w-xl min-h-[120px] flex flex-col items-center justify-center">
      
      {/* State Label */}
      <div className="mb-6 flex items-center gap-4">
         <div className={`w-8 h-[2px] ${state === 'LISTENING' ? 'bg-red-500' : 'bg-cyan-500'} opacity-50`}></div>
         <span className={`inline-block px-6 py-1.5 border rounded-sm font-hud text-xs font-bold tracking-[0.3em] transition-all duration-300 shadow-[0_0_15px_rgba(0,0,0,0.5)]
           ${state === 'LISTENING' ? 'border-red-500 text-red-400 bg-red-950/40 shadow-[0_0_20px_rgba(255,0,0,0.3)]' : 
             state === 'PROCESSING' ? 'border-yellow-500 text-yellow-400 bg-yellow-950/40 shadow-[0_0_20px_rgba(255,255,0,0.2)]' :
             'border-cyan-500 text-cyan-400 bg-cyan-950/40 shadow-[0_0_20px_rgba(0,255,255,0.2)]'}`}>
           SYS.STATE // {state}
         </span>
         <div className={`w-8 h-[2px] ${state === 'LISTENING' ? 'bg-red-500' : 'bg-cyan-500'} opacity-50`}></div>
      </div>

      {/* Transcript Area */}
      <div className="relative w-full h-28 flex items-center justify-center bg-black/40 backdrop-blur-md border border-white/5 rounded-md">
        {/* Tech Decor Corners */}
        <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/70 rounded-tl"></div>
        <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/70 rounded-tr"></div>
        <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/70 rounded-bl"></div>
        <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/70 rounded-br"></div>
        
        {/* Subtle grid background */}
        <div className="absolute inset-0 opacity-[0.03]"
             style={{ backgroundImage: 'linear-gradient(#fff 1px, transparent 1px), linear-gradient(90deg, #fff 1px, transparent 1px)', backgroundSize: '10px 10px' }}>
        </div>

        <p className={`font-tech text-xl text-center px-8 z-10 transition-opacity duration-300 ${transcript ? 'opacity-100 text-white' : 'opacity-30 text-cyan-200 uppercase tracking-widest'}`}>
           {transcript ? `"${transcript}"` : "AWAITING AUDIO INPUT..."}
        </p>
      </div>
    </div>
  );
};