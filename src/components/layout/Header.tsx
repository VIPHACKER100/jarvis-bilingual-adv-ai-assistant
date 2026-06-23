import React, { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, Activity, Cpu, Zap, Command, Mic } from 'lucide-react';
import { AppMode, Language } from '../../types';
import { useJarvisStore } from '../../store/jarvisStore';
import { APP_VERSION } from '../../config';
import { sfx } from '../../utils/audioUtils';

export const Header: FC = () => {
  const {
    isConnected,
    language,
    mode,
    toggleLanguage,
    setShowSettings,
    systemStatus,
    activeTacticalView,
    setActiveTacticalView,
  } = useJarvisStore();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header
      initial={{ opacity: 0, y: -16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 border-b border-accent/20 shadow-[0_1px_0_0_rgba(var(--accent-rgb),0.15)] ${
        scrolled
          ? 'bg-background-overlay backdrop-blur-xl shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="w-full px-4 md:px-6 lg:px-8 flex items-center justify-between h-16 flex-nowrap">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tight glow-text">
                JARVIS
              </h1>
              <span className="text-[10px] font-bold text-accent px-1.5 py-0.5 rounded-md bg-accent/10 border border-accent/20">
                v{APP_VERSION}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success status-dot-live' : 'bg-danger'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
              />
              <span className="text-[8px] font-mono text-foreground-subtle uppercase tracking-[0.15em]">
                Neural_Interface
              </span>
            </div>
          </div>
          <div className="hidden lg:flex items-center gap-3 pl-4 border-l border-border-subtle">
            <HealthIndicator
              icon={<Cpu className="w-3 h-3" />}
              label="CPU"
              value={systemStatus?.cpu?.percent ? `${Math.round(systemStatus.cpu.percent)}%` : '...'}
            />
            <HealthIndicator
              icon={<Zap className="w-3 h-3" />}
              label="LAT"
              value={systemStatus?.event_loop_lag ? `${Math.round(systemStatus.event_loop_lag)}ms` : '...'}
            />
          </div>
        </div>

        <nav className="hidden xl:flex items-center gap-1 p-0.5 bg-background-base/60 border border-border-default rounded-xl backdrop-blur-md">
          <NavButton
            active={activeTacticalView === 'HUD'}
            onClick={() => setActiveTacticalView('HUD')}
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="HUD"
          />
          <NavButton
            active={activeTacticalView === 'TIMELINE'}
            onClick={() => setActiveTacticalView('TIMELINE')}
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Timeline"
          />
          <NavButton
            active={activeTacticalView === 'SYNC'}
            onClick={() => setActiveTacticalView('SYNC')}
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Sync"
          />
          <NavButton
            active={activeTacticalView === 'TRAINING'}
            onClick={() => setActiveTacticalView('TRAINING')}
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Training"
          />
        </nav>

        <div className="flex items-center gap-3">
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-full border border-border-default glass-panel ${
              isConnected ? 'text-success' : 'text-danger'
            }`}
          >
            <Activity className={`w-3 h-3 ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest hidden sm:inline">
              {isConnected ? 'Online' : 'Offline'}
            </span>
          </div>

          <div className={`flex items-center gap-1.5 px-2 py-1.5 rounded-full border border-border-default glass-panel ${
            mode !== AppMode.IDLE ? 'text-accent' : 'text-foreground-subtle'
          }`}>
            <Mic className={`w-3 h-3 ${mode !== AppMode.IDLE ? 'animate-pulse' : ''}`} />
            <span className="text-[9px] font-mono font-bold uppercase tracking-widest hidden sm:inline">
              {mode !== AppMode.IDLE ? 'ACTIVE' : 'OFF'}
            </span>
          </div>

          <button
            onClick={() => {
              sfx.playSelect();
              toggleLanguage();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass-panel hover:bg-surface-high transition-all"
            title="Toggle language"
            aria-label="Toggle language"
          >
            <Globe className="w-3.5 h-3.5 text-foreground-muted" />
            <div className="flex items-center gap-1 font-mono text-[9px] font-bold">
              <span className={language === Language.ENGLISH ? 'text-accent' : 'text-foreground-subtle'}>
                EN
              </span>
              <span className="text-border-default">/</span>
              <span className={language === Language.HINDI ? 'text-accent' : 'text-foreground-subtle'}>
                HI
              </span>
              <span className="text-border-default">/</span>
              <span className={language === Language.HINGLISH ? 'text-accent' : 'text-foreground-subtle'}>
                Hx
              </span>
            </div>
          </button>

          <button
            onClick={() => {
              sfx.playSelect();
              setShowSettings(true);
            }}
            className="p-2 rounded-lg glass-panel hover:bg-surface-high transition-all"
            title="Settings"
            aria-label="Settings"
          >
            <Settings className="w-4 h-4 text-foreground-muted hover:text-foreground transition-colors" />
          </button>

          <div className="hidden md:flex items-center gap-1.5 px-2 py-1.5 rounded-lg border border-border-subtle bg-surface-low text-foreground-subtle">
            <Command className="w-3 h-3" />
            <span className="text-[8px] font-mono font-bold uppercase tracking-wider leading-none gap-0.5 flex items-center">
              <kbd className="px-1 py-0.5 rounded bg-surface-high border border-border-subtle text-[8px]">^</kbd>
              <span>+</span>
              <kbd className="px-1 py-0.5 rounded bg-surface-high border border-border-subtle text-[8px]">Space</kbd>
            </span>
          </div>
          <kbd className="inline-flex md:hidden items-center justify-center w-7 h-7 rounded-lg border border-border-subtle bg-surface-low text-foreground-subtle text-[10px] font-mono" title="Ctrl+Space to toggle voice">
            <Command className="w-3 h-3" />
          </kbd>
        </div>
      </div>
    </motion.header>
  );
};

const HealthIndicator: FC<{ icon: React.ReactNode; label: string; value: string }> = ({
  icon,
  label,
  value,
}) => {
  const numericValue = parseInt(value) || 0;
  const segments = 8;
  const filledSegments = Math.round((numericValue / 100) * segments);

  return (
    <div className="flex flex-col gap-1">
      <div className="flex items-center gap-1.5 text-foreground-subtle">
        {icon}
        <span className="text-[7px] font-mono uppercase tracking-[0.1em] terminal-text">{label}</span>
      </div>
      <div className="flex items-center gap-0.5">
        {Array.from({ length: segments }).map((_, i) => (
          <div
            key={i}
            className={`w-1.5 h-3 rounded-sm transition-colors duration-300 ${
              i < filledSegments
                ? numericValue > 80
                  ? 'bg-danger shadow-[0_0_8px_rgba(244,63,94,0.8)]'
                  : 'bg-accent-cyan shadow-[0_0_8px_rgba(var(--accent-cyan-rgb),0.6)]'
                : 'bg-surface-high'
            }`}
          />
        ))}
        <span className="text-[9px] font-mono font-semibold text-foreground tabular-nums ml-1.5">
          {value}
        </span>
      </div>
    </div>
  );
};

const NavButton: FC<{
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`relative flex items-center gap-2 px-3 py-2 transition-all duration-300 rounded-lg ${
      active
        ? 'text-accent-cyan bg-surface-high'
        : 'text-foreground-subtle hover:text-foreground hover:bg-surface-low'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em] z-10">{label}</span>
    {active && (
      <motion.div 
        layoutId="nav-indicator"
        className="absolute bottom-0 left-0 right-0 h-[2px] bg-accent-cyan shadow-[0_0_10px_rgba(var(--accent-cyan-rgb),0.8)] rounded-full"
      />
    )}
  </button>
);
