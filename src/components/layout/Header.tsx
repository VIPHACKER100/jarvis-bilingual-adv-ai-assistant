import { useWebSocket } from '@/hooks/useWebSocket';
import { Menu, Globe, Cpu, Settings as SettingsIcon, Info } from 'lucide-react';
import { useState } from 'react';
import type { Language } from '@/config';
import { useStore } from '@/store';

interface HeaderProps { onMenuToggle: () => void }

const LANGUAGE_LABELS: Record<Language, string> = { en: 'EN', hi: 'HI', hinglish: 'HINGLISH' };

export function Header({ onMenuToggle }: HeaderProps) {
  const { connectionStatus } = useWebSocket();
  const [currentLang, setCurrentLang] = useState<Language>('en');
  const setPage = useStore((s) => s.setPage);

  const cycleLanguage = () => {
    setCurrentLang((prev) => {
      const langs: Language[] = ['en', 'hi', 'hinglish'];
      const idx = langs.indexOf(prev);
      return langs[(idx + 1) % langs.length] ?? 'en';
    });
  };

  const statusDotClass = connectionStatus === 'connected' ? 'status-dot-connected'
    : connectionStatus === 'connecting' ? 'status-dot-connecting' : 'status-dot-disconnected';

  return (
    <header className="flex h-14 items-center justify-between border-b border-cyan-500/20 bg-cyber-surface/40 backdrop-blur-xl px-4 shrink-0">
      <div className="flex items-center gap-3">
        <button title="Toggle sidebar" aria-label="Toggle sidebar" onClick={onMenuToggle}
          className="glass-button !px-2 !py-1.5 text-cyan-300 hover:text-cyan-200">
          <Menu className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-2" title={`Connection: ${connectionStatus}`}>
          <span className={statusDotClass} />
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {connectionStatus === 'connected' ? 'ONLINE' : connectionStatus === 'connecting' ? 'CONNECTING' : 'OFFLINE'}
          </span>
        </div>
      </div>

      <nav className="hidden md:flex items-center gap-1">
        <button title="Neural HUD" aria-label="Neural HUD" onClick={() => setPage('hud')}
          className="glass-button !px-3 !py-1.5 text-xs flex items-center gap-1">
          <Cpu className="h-3.5 w-3.5" /> HUD
        </button>
        <button title="Settings" aria-label="Settings" onClick={() => setPage('settings')}
          className="glass-button !px-3 !py-1.5 text-xs flex items-center gap-1">
          <SettingsIcon className="h-3.5 w-3.5" /> SETTINGS
        </button>
        <button title="About" aria-label="About" onClick={() => setPage('about')}
          className="glass-button !px-3 !py-1.5 text-xs flex items-center gap-1">
          <Info className="h-3.5 w-3.5" /> ABOUT
        </button>
      </nav>

      <div className="flex items-center gap-2">
        <button title={`Language: ${currentLang.toUpperCase()}`} aria-label={`Language: ${currentLang.toUpperCase()}`}
          onClick={cycleLanguage} className="glass-button !px-3 !py-1.5 text-xs flex items-center gap-1.5">
          <Globe className="h-3.5 w-3.5" />
          <span className="font-bold">{LANGUAGE_LABELS[currentLang]}</span>
        </button>
      </div>
    </header>
  );
}
