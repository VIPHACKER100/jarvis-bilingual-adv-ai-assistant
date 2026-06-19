import { FC } from 'react';
import { useJarvisStore } from '../../store/jarvisStore';
import { APP_VERSION } from '../../config';

export const Footer: FC = () => {
  const { language } = useJarvisStore();

  return (
    <footer className="relative w-full mt-auto border-t border-border-subtle bg-background-overlay/60 backdrop-blur-md">
      <div className="container-fluid flex flex-col items-center py-6 space-y-4">
        <div className="flex flex-col items-center gap-1 text-center">
          <div className="text-cyan-500 text-[11px] font-mono tracking-[0.3em] uppercase drop-shadow-[0_0_8px_rgba(6,182,212,0.6)]">
            Built by
          </div>
          <div className="text-white text-sm font-bold tracking-widest uppercase">
            Aryan Ahirwar
          </div>
          <div className="text-slate-400 text-[9px] tracking-widest font-mono uppercase">
            Alias: VIPHACKER100
          </div>
          <div className="text-slate-500 text-[8px] tracking-[0.2em] text-center max-w-xs leading-relaxed px-4">
            Cybersecurity Expert · Ethical Hacker · Penetration Tester · Bug Bounty Hunter
          </div>
          <div className="text-orange-500/70 text-[8px] tracking-[0.3em] uppercase font-mono">
            Founder & CEO — VIPHACKER.100
          </div>
        </div>

        <div className="w-24 h-px bg-gradient-to-r from-transparent via-cyan-700/50 to-transparent" />

        <div className="flex flex-wrap justify-center gap-4 text-[9px] font-mono tracking-widest">
          <a href="https://viphacker100.com" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            Website
          </a>
          <a href="https://github.com/viphacker100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            GitHub
          </a>
          <a href="https://linkedin.com/in/viphacker100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            LinkedIn
          </a>
          <a href="https://instagram.com/viphacker.100" target="_blank" rel="noopener noreferrer"
            className="text-slate-500 hover:text-cyan-400 transition-all duration-200 uppercase border-b border-transparent hover:border-cyan-500 pb-0.5">
            Instagram
          </a>
        </div>

        <div className="text-slate-700 text-[8px] tracking-[0.4em] font-light uppercase text-center px-4 leading-loose">
          JARVIS v{APP_VERSION} | VIPHACKER100 OS
        </div>

        <div className="flex items-center gap-4 text-[9px] font-mono text-slate-600">
          <span>Neural Core Active</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Lang: {language}</span>
          <span className="w-1 h-1 rounded-full bg-slate-700" />
          <span>Runtime: Vite</span>
        </div>
      </div>
    </footer>
  );
};
