import React, { FC } from 'react';
import { Language } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { DesktopControls } from './DesktopControls';
import { MediaTools } from './MediaTools';

export const AdvancedTools: FC = () => {
  const { language, showAdvanced, setShowAdvanced } = useJarvisStore();
  const langCode = language === Language.HINDI ? 'hi' : 'en';

  return (
    <div className="w-full flex flex-col items-center gap-4">
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="text-cyan-500/50 hover:text-cyan-400 text-[10px] tracking-[0.2em] uppercase border-b border-transparent hover:border-cyan-500/50 transition-all"
      >
        {showAdvanced ? 'Hide Advanced Tools' : 'Show Advanced Tools'}
      </button>

      {showAdvanced && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
          <DesktopControls language={langCode} />
          <MediaTools language={langCode} />
        </div>
      )}
    </div>
  );
};
