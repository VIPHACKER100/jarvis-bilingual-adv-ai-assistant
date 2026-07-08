import React, { useRef, useEffect } from 'react';
import { LogEntry } from '../types';

interface LogPanelProps {
  logs: LogEntry[];
}

export const LogPanel: React.FC<LogPanelProps> = ({ logs }) => {
  return (
    <div className="w-full h-full overflow-y-auto pr-2 font-tech text-xs space-y-2">
      {logs.map((log) => (
        <div key={log.id} className="flex gap-2 animate-in fade-in slide-in-from-left-4 duration-300">
          <span className="text-gray-500 shrink-0">[{log.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute:'2-digit', second:'2-digit' })}]</span>
          <span className={`
            ${log.type === 'ERROR' ? 'text-red-500' : 
              log.type === 'ACTION' ? 'text-green-400' : 
              log.type === 'INPUT' ? 'text-white' : 'text-cyan-600'}
          `}>
            {log.type === 'SYSTEM' ? '> ' : ''}
            {log.type === 'INPUT' ? '<< ' : ''}
            {log.type === 'ACTION' ? '>> ' : ''}
            {log.message}
          </span>
        </div>
      ))}
    </div>
  );
};