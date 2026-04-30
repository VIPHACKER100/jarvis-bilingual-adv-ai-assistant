import React, { FC } from 'react';

export const Footer: FC = () => {
  return (
    <footer className="relative w-full flex flex-col items-center space-y-4 z-20 mt-auto py-10 bg-black/60 backdrop-blur-sm border-t border-slate-900">
      <div className="flex flex-wrap justify-center gap-6 text-[10px] md:text-xs font-mono tracking-widest">
        <a href="https://aryanahirwar.in" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">Website</a>
        <a href="https://github.com/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">GitHub</a>
        <a href="https://linkedin.com/in/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">LinkedIn</a>
        <a href="https://instagram.com/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">Instagram</a>
      </div>
      <div className="text-slate-700 text-[8px] md:text-[9px] tracking-[0.4em] font-light uppercase text-center px-4 leading-loose">
        VIPHACKER100 OS V3.4.0 | DESIGNED & DEVELOPED BY <br className="md:hidden" />
        <span className="text-slate-500 font-bold border-b border-slate-800">VIPHACKER100 (ARYAN AHIRWAR)</span>
      </div>
    </footer>
  );
};
