import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
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
    setActiveTacticalView
  } = useJarvisStore();

  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 px-6 py-4 flex justify-center ${
        scrolled ? 'bg-background-overlay blur-bg-heavy border-b border-border-subtle shadow-lg' : 'bg-transparent'
      }`}
    >
      <div className="w-full max-w-7xl flex justify-between items-center">
        {/* Left Side: Logo & System Meta */}
        <div className="flex items-center gap-6">
          <div className="flex flex-col">
            <div className="flex items-baseline gap-2">
              <h1 className="text-2xl md:text-3xl font-bold tracking-tighter text-display gradient-text">
                JARVIS
              </h1>
              <span className="text-xs font-bold text-accent px-1.5 py-0.5 rounded bg-accent-soft border border-border-accent">
                {APP_VERSION}
              </span>
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span className="w-1.5 h-1.5 rounded-full bg-success animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]"></span>
              <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-[0.2em]">
                Neural_Interface // Node_01
              </span>
            </div>
          </div>

          {/* System Health Indicators (Visible on Desktop) */}
          <div className="hidden lg:flex items-center gap-4 px-4 border-l border-border-subtle">
            <HealthIndicator 
              icon={<Cpu className="w-3 h-3" />} 
              label="CPU" 
              value={systemStatus?.cpu_usage ? `${Math.round(systemStatus.cpu_usage)}%` : '8%'} 
            />
            <HealthIndicator 
              icon={<Zap className="w-3 h-3" />} 
              label="LAT" 
              value={systemStatus?.event_loop_lag ? `${Math.round(systemStatus.event_loop_lag)}ms` : '12ms'} 
            />
          </div>
        </div>

        {/* Center: Tactical Navigation */}
        <nav className="hidden xl:flex items-center gap-1 p-1 bg-background-base/50 border border-border-default rounded-xl backdrop-blur-md">
          <NavButton 
            active={activeTacticalView === 'HUD'} 
            onClick={() => setActiveTacticalView('HUD')}
            icon={<Cpu className="w-3.5 h-3.5" />}
            label="Tactical_HUD"
          />
          <NavButton 
            active={activeTacticalView === 'TIMELINE'} 
            onClick={() => setActiveTacticalView('TIMELINE')}
            icon={<Activity className="w-3.5 h-3.5" />}
            label="Audit_Timeline"
          />
          <NavButton 
            active={activeTacticalView === 'SYNC'} 
            onClick={() => setActiveTacticalView('SYNC')}
            icon={<Zap className="w-3.5 h-3.5" />}
            label="Device_Sync"
          />
          <NavButton 
            active={activeTacticalView === 'TRAINING'} 
            onClick={() => setActiveTacticalView('TRAINING')}
            icon={<Settings className="w-3.5 h-3.5" />}
            label="Neural_Training"
          />
        </nav>

        {/* Right Side: Controls & Status */}
        <div className="flex items-center gap-4">
          {/* Connection Status Badge */}
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full glass-panel border border-border-default transition-all ${
            isConnected ? 'text-success' : 'text-danger'
          }`}>
            <Activity className={`w-3.5 h-3.5 ${isConnected ? 'animate-pulse' : ''}`} />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest hidden sm:inline">
              {isConnected ? 'Link_Established' : 'Link_Lost'}
            </span>
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => { sfx.playSelect(); toggleLanguage(); }}
              className="group flex items-center gap-2 px-3 py-1.5 rounded-lg glass-panel hover:glass-panel--high transition-all"
              title="Change Language"
            >
              <Globe className="w-4 h-4 text-foreground-muted group-hover:text-accent transition-colors" />
              <div className="flex items-center gap-1 font-mono text-[10px] font-bold">
                <span className={language === Language.ENGLISH ? "text-accent" : "text-foreground-subtle"}>EN</span>
                <span className="text-border-default">/</span>
                <span className={language === Language.HINDI ? "text-accent" : "text-foreground-subtle"}>HI</span>
              </div>
            </button>

            <button
              onClick={() => { sfx.playSelect(); setShowSettings(true); }}
              className="p-2 rounded-lg glass-panel hover:glass-panel--high group transition-all"
              title="System Configuration"
            >
              <Settings className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:rotate-90 transition-all duration-500" />
            </button>

            <div className="hidden sm:flex items-center justify-center w-8 h-8 rounded-lg border border-border-subtle bg-surface-low text-foreground-subtle">
              <Command className="w-3 h-3" />
            </div>
          </div>
        </div>
      </div>
    </motion.header>
  );
};

const HealthIndicator: FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex flex-col gap-0.5">
    <div className="flex items-center gap-1.5 text-foreground-subtle">
      {icon}
      <span className="text-[8px] font-mono uppercase tracking-tighter">{label}</span>
    </div>
    <span className="text-[10px] font-mono font-bold text-foreground tabular-nums">{value}</span>
  </div>
);

const NavButton: FC<{ active: boolean, onClick: () => void, icon: React.ReactNode, label: string }> = ({ active, onClick, icon, label }) => (
  <button
    onClick={onClick}
    className={`flex items-center gap-2 px-4 py-2 rounded-lg transition-all duration-300 ${
      active 
      ? 'bg-accent/10 text-accent border border-accent/20 shadow-[0_0_15px_rgba(var(--accent-rgb),0.1)]' 
      : 'text-foreground-subtle hover:text-foreground hover:bg-surface-low border border-transparent'
    }`}
  >
    {icon}
    <span className="text-[10px] font-mono font-bold uppercase tracking-[0.1em]">{label}</span>
  </button>
);
