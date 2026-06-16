import React, { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe, Activity, Cpu, Zap, Command } from 'lucide-react';
import { Language } from '../../types';
import { useJarvisStore } from '../../store/jarvisStore';
import { APP_VERSION } from '../../config';
import { sfx } from '../../utils/audioUtils';

export const Header: FC = () => {
  const {
    isConnected,
    language,
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
      transition={{ duration: 0.5, ease: [0.19, 1, 0.22, 1] }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
        scrolled
          ? 'bg-background-overlay backdrop-blur-xl border-b border-border-subtle shadow-lg'
          : 'bg-transparent'
      }`}
    >
      <div className="container-fluid flex items-center justify-between h-16">
        <div className="flex items-center gap-4">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h1 className="text-xl md:text-2xl font-bold tracking-tight gradient-text">
                JARVIS
              </h1>
              <span className="text-[10px] font-bold text-cyber-yellow px-1.5 py-0.5 chamfered-sm bg-cyber-yellow/10 border border-cyber-yellow/30">
                v{APP_VERSION}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span
                className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-success' : 'bg-danger'} shadow-[0_0_8px_rgba(16,185,129,0.5)]`}
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

          <button
            onClick={() => {
              sfx.playSelect();
              toggleLanguage();
            }}
            className="flex items-center gap-2 px-2.5 py-1.5 rounded-lg glass-panel hover:bg-surface-high transition-all"
            title="Toggle language"
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
            </div>
          </button>

          <button
            onClick={() => {
              sfx.playSelect();
              setShowSettings(true);
            }}
            className="p-2 rounded-lg glass-panel hover:bg-surface-high transition-all"
            title="Settings"
          >
            <Settings className="w-4 h-4 text-foreground-muted hover:text-foreground transition-colors" />
          </button>

          <kbd className="hidden sm:inline-flex items-center justify-center w-7 h-7 rounded-lg border border-border-subtle bg-surface-low text-foreground-subtle text-[10px] font-mono">
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
            className={`w-1.5 h-2.5 chamfered-sm transition-colors duration-300 ${
              i < filledSegments
                ? numericValue > 80
                  ? 'bg-cyber-pink shadow-[0_0_4px_rgba(var(--cyber-pink-rgb),0.5)]'
                  : 'bg-accent shadow-[0_0_4px_rgba(var(--accent-rgb),0.5)]'
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
    className={`flex items-center gap-2 px-3 py-2 transition-all duration-300 ${
      active
        ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)] chamfered-sm'
        : 'text-foreground-subtle hover:text-foreground hover:bg-surface-low border border-transparent chamfered-sm'
    }`}
    aria-current={active ? 'page' : undefined}
  >
    {icon}
    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.08em]">{label}</span>
  </button>
);
