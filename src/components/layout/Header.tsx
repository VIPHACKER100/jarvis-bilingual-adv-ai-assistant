import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { Settings, Globe } from 'lucide-react';
import { Language } from '../../types';
import { useJarvisStore } from '../../store/jarvisStore';
import { APP_VERSION } from '../../config';
import { sfx } from '../../utils/audioUtils';

export const Header: FC = () => {
  const { 
    isConnected, 
    language, 
    toggleLanguage, 
    setShowSettings 
  } = useJarvisStore();

  return (
    <motion.header 
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="relative z-20 w-full max-w-6xl flex justify-between items-center mb-8 px-4"
    >
      <div className="flex flex-col">
        <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text-linear">
          JARVIS <span className="accent-text-linear text-2xl md:text-4xl ml-2">{APP_VERSION}</span>
        </h1>
        <p className="text-[10px] md:text-xs font-mono text-foreground-muted tracking-widest uppercase mt-2">
          Neural Interface // Active_Status: Online
        </p>
      </div>

      <div className="flex flex-col items-center md:items-end gap-3">
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-2 text-[10px] font-mono tracking-widest px-3 py-1.5 rounded-full border border-border-default bg-surface ${isConnected ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
            <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></span>
            <span>{isConnected ? 'Neural_Link: Active' : 'Neural_Link: Offline'}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => { sfx.playSelect(); setShowSettings(true); }}
              className="p-2 rounded-lg bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover transition-all group"
              title="System Settings"
              aria-label="Open system settings"
            >
              <Settings className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:rotate-45 transition-transform" />
            </button>
            
            <button
              onClick={() => { sfx.playSelect(); toggleLanguage(); }}
              className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover transition-all group"
              aria-label="Toggle language"
              title="Toggle language"
            >
              <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-tighter">
                <span className={language === Language.ENGLISH ? "text-accent font-bold" : "text-foreground-muted"}>EN</span>
                <span className="text-border-default">/</span>
                <span className={language === Language.HINDI ? "text-accent font-bold" : "text-foreground-muted"}>HI</span>
                <span className="text-border-default">/</span>
                <span className={language === Language.HINGLISH ? "text-accent font-bold" : "text-foreground-muted"}>HG</span>
              </div>
              <Globe className="w-3.5 h-3.5 text-foreground-muted group-hover:text-accent transition-colors" />
            </button>
          </div>
        </div>
        <div className="text-[9px] font-mono text-foreground-muted uppercase tracking-[0.2em] opacity-60">
          Node_Identifier: {language === Language.HINGLISH ? 'HI_EN_PARSER' : language === Language.HINDI ? 'NATIVE_HINDI_v2' : 'UNIVERSAL_ENGLISH'}
        </div>
      </div>
    </motion.header>
  );
};
