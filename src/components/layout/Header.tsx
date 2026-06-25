/**
 * Header — Top navigation bar
 *
 * Features:
 * - Connection indicator dot (green/amber/red)
 * - Language toggle (EN / HI / HINGLISH)
 * - Navigation links
 * - Version info
 */

import { useWebSocket } from '@/hooks/useWebSocket';
import { Menu, Globe, Cpu } from 'lucide-react';
import { Link } from 'react-router-dom';
import { useState } from 'react';
import type { Language } from '@/config';

interface HeaderProps {
  onMenuToggle: () => void;
}

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  hi: 'HI',
  hinglish: 'HINGLISH',
};

export function Header({ onMenuToggle }: HeaderProps) {
  const { connectionStatus } = useWebSocket();
  const [currentLang, setCurrentLang] = useState<Language>('en');

  const cycleLanguage = () => {
    setCurrentLang((prev) => {
      const langs: Language[] = ['en', 'hi', 'hinglish'];
      const idx = langs.indexOf(prev);
      return langs[(idx + 1) % langs.length] ?? 'en';
    });
  };

  const statusDotClass =
    connectionStatus === 'connected'
      ? 'status-dot-connected'
      : connectionStatus === 'connecting'
        ? 'status-dot-connecting'
        : 'status-dot-disconnected';

  return (
    <header className="flex h-14 items-center justify-between border-b border-cyan-500/20 bg-cyber-surface/40 backdrop-blur-xl px-4 shrink-0">
      {/* Left section */}
      <div className="flex items-center gap-3">
        <button
          title="Toggle sidebar navigation"
          aria-label="Toggle sidebar navigation"
          onClick={onMenuToggle}
          className="glass-button !px-2 !py-1.5 text-cyan-300 hover:text-cyan-200"
        >
          <Menu className="h-5 w-5" />
        </button>

        {/* Connection status */}
        <div className="flex items-center gap-2" title={`Connection: ${connectionStatus}`}>
          <span className={statusDotClass} />
          <span className="text-xs text-slate-500 font-mono hidden sm:inline">
            {connectionStatus === 'connected'
              ? 'ONLINE'
              : connectionStatus === 'connecting'
                ? 'CONNECTING'
                : 'OFFLINE'}
          </span>
        </div>
      </div>

      {/* Center — Nav links */}
      <nav className="hidden md:flex items-center gap-1">
        <Link
          to="/hud"
          title="Neural HUD Dashboard"
          aria-label="Neural HUD Dashboard"
          className="glass-button !px-3 !py-1.5 text-xs"
        >
          <Cpu className="h-3.5 w-3.5 mr-1 inline" />
          HUD
        </Link>
        <Link
          to="/settings"
          title="Settings"
          aria-label="Settings"
          className="glass-button !px-3 !py-1.5 text-xs"
        >
          SETTINGS
        </Link>
      </nav>

      {/* Right section */}
      <div className="flex items-center gap-2">
        {/* Language toggle */}
        <button
          title={`Switch language (current: ${currentLang.toUpperCase()})`}
          aria-label={`Switch language (current: ${currentLang.toUpperCase()})`}
          onClick={cycleLanguage}
          className="glass-button !px-3 !py-1.5 text-xs flex items-center gap-1.5"
        >
          <Globe className="h-3.5 w-3.5" />
          <span className="font-bold">{LANGUAGE_LABELS[currentLang]}</span>
        </button>
      </div>
    </header>
  );
}
