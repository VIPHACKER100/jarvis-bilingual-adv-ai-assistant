import React, { FC } from 'react';
import { AppMode } from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { HistoryLog } from './HistoryLog';
import { VolumeControl } from './VolumeControl';
import { SystemDiagnostics } from './SystemDiagnostics';

export const StatusPanels: FC = () => {
  const { mode, history, volume, systemStatus } = useJarvisStore();

  return (
    <div className="flex flex-col md:flex-row gap-8 w-full items-stretch justify-center">
      {/* Left: Event Stream */}
      <HistoryLog history={history} />

      {/* Right: Status & Controls */}
      <div className="flex flex-col space-y-6 w-full md:w-auto items-center md:items-start">
        <VolumeControl level={volume} />

        {systemStatus && systemStatus.success ? (
          <SystemDiagnostics systemStatus={systemStatus} />
        ) : (
          /* Fallback stats card with shimmer loading effect */
          <div className="glass-panel p-4 w-full md:w-64 text-[10px] sm:text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-3 rounded-xl shimmer-loading">
            <div className="flex justify-between border-b border-border-default pb-1.5">
              <span className="text-foreground-muted">CPU</span>
              <span className="text-accent font-bold">--%</span>
            </div>
            <div className="flex justify-between border-b border-border-default pb-1.5">
              <span className="text-foreground-muted">MEM</span>
              <span className="text-accent font-bold">--%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">NET</span>
              <span className="text-green-400 uppercase font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">Online</span>
            </div>
            <div className="flex justify-between">
              <span className="text-foreground-muted">MIC</span>
              <span className={mode !== AppMode.IDLE ? "text-pink-500 animate-pulse font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" : "text-foreground-muted/50"}>{mode !== AppMode.IDLE ? "ACTIVE" : "OFFLINE"}</span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
