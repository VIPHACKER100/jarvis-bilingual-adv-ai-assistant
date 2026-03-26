import { FC, useMemo } from 'react';

interface SystemDiagnosticsProps {
  data: {
    cpu: { percent: number; count: number };
    memory: { used: number; total: number; percent: number };
    disk?: { used: number; total: number; percent: number };
    network?: { bytes_sent: number; bytes_recv: number };
    battery?: { percent: number | null; is_charging: boolean | null };
    volume?: number;
    uptime?: number;
    platform?: string;
  };
}

export const SystemDiagnostics: FC<SystemDiagnosticsProps> = ({ data }) => {
  const formatBytes = (bytes: number) => {
    if (!bytes) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const cpuColor = data.cpu.percent > 80 ? '#ef4444' : data.cpu.percent > 50 ? '#f59e0b' : '#22d3ee';
  const memColor = data.memory.percent > 80 ? '#ef4444' : data.memory.percent > 50 ? '#f59e0b' : '#22d3ee';

  // Circular Gauge Component
  const Gauge = ({ percent, color, label, sublabel }: { percent: number; color: string; label: string; sublabel: string }) => {
    const radius = 35;
    const circumference = 2 * Math.PI * radius;
    const offset = circumference - (percent / 100) * circumference;

    return (
      <div className="flex flex-col items-center justify-center p-2">
        <div className="relative w-24 h-24 flex items-center justify-center">
          <svg className="w-full h-full transform -rotate-90">
            {/* Background circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke="currentColor"
              strokeWidth="4"
              fill="transparent"
              className="text-slate-800"
            />
            {/* Progress circle */}
            <circle
              cx="48"
              cy="48"
              r={radius}
              stroke={color}
              strokeWidth="4"
              strokeDasharray={circumference}
              strokeDashoffset={offset}
              strokeLinecap="round"
              fill="transparent"
              className="transition-all duration-1000 ease-out drop-shadow-[0_0_5px_rgba(6,182,212,0.5)]"
            />
          </svg>
          <div className="absolute inset-0 flex flex-col items-center justify-center">
            <span className="text-lg font-bold text-white leading-none">{Math.round(percent)}%</span>
            <span className="text-[8px] text-slate-500 uppercase tracking-tighter mt-1">{label}</span>
          </div>
        </div>
        <span className="text-[10px] text-cyan-500/80 font-mono mt-1">{sublabel}</span>
      </div>
    );
  };

  return (
    <div className="w-full max-w-md bg-slate-900/40 backdrop-blur-md border border-cyan-500/20 rounded-lg p-5 shadow-2xl relative overflow-hidden group">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-cyan-500/40 rounded-tl-sm"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-cyan-500/40 rounded-tr-sm"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-cyan-500/40 rounded-bl-sm"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-cyan-500/40 rounded-br-sm"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-cyan-500/10 pb-2">
        <h3 className="text-xs font-bold text-cyan-400 tracking-[0.3em] uppercase">System_Diagnostics_v2</h3>
        <span className="text-[8px] font-mono text-slate-500 uppercase">{data.platform || 'LOCAL_HOST'} // {new Date().toLocaleTimeString()}</span>
      </div>

      {/* Primary Gauges */}
      <div className="flex justify-around mb-6">
        <Gauge 
          percent={data.cpu.percent} 
          color={cpuColor} 
          label="CPU LOAD" 
          sublabel={`${data.cpu.count} CORES`} 
        />
        <Gauge 
          percent={data.memory.percent} 
          color={memColor} 
          label="RAM USAGE" 
          sublabel={`${formatBytes(data.memory.used)}`} 
        />
      </div>

      {/* Secondary Stats List */}
      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {data.battery && (
          <div className="space-y-1">
            <div className="flex justify-between text-[9px] font-mono">
              <span className="text-slate-400 uppercase">Energy Grid</span>
              <span className={data.battery.is_charging ? "text-green-400" : "text-cyan-400"}>
                {data.battery.is_charging ? 'CHARGING' : 'BATTERY'}
              </span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className={`h-full transition-all duration-1000 ${(data.battery.percent || 0) < 20 ? 'bg-red-500' : 'bg-cyan-500'}`} 
                 style={{ width: `${data.battery.percent || 0}%` }}
               ></div>
            </div>
            <div className="flex justify-end text-[9px] font-mono text-slate-500">
              {data.battery.percent}% CAPACITY
            </div>
          </div>
        )}

        {data.disk && (
          <div className="space-y-1">
             <div className="flex justify-between text-[9px] font-mono">
              <span className="text-slate-400 uppercase">Mass Storage</span>
              <span className="text-cyan-400">{data.disk.percent.toFixed(0)}%</span>
            </div>
            <div className="h-1 bg-slate-800 rounded-full overflow-hidden">
               <div 
                 className="h-full bg-blue-500 transition-all duration-1000" 
                 style={{ width: `${data.disk.percent}%` }}
               ></div>
            </div>
            <div className="flex justify-end text-[9px] font-mono text-slate-500">
              {formatBytes(data.disk.used)} / {formatBytes(data.disk.total)}
            </div>
          </div>
        )}

        {data.network && (
          <div className="col-span-2 mt-2 pt-2 border-t border-cyan-500/5">
             <div className="flex justify-between items-center text-[9px] font-mono">
                <div className="flex items-center gap-4">
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[8px]">UPLINK ADDRESS</span>
                    <span className="text-cyan-400">0.0.0.0</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-slate-500 text-[8px]">DATA PACKETS</span>
                    <span className="text-cyan-400 font-bold">ACTIVE</span>
                  </div>
                </div>
                <div className="flex gap-4">
                  <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[8px]">SENT</span>
                    <span className="text-green-400">{formatBytes(data.network.bytes_sent)}</span>
                  </div>
                  <div className="flex flex-col items-end">
                    <span className="text-slate-500 text-[8px]">RECV</span>
                    <span className="text-blue-400">{formatBytes(data.network.bytes_recv)}</span>
                  </div>
                </div>
             </div>
          </div>
        )}
      </div>

      {/* Decorative Scanner Line */}
      <div className="absolute top-0 left-0 w-full h-[1px] bg-gradient-to-r from-transparent via-cyan-500/30 to-transparent animate-scan pointer-events-none"></div>
    </div>
  );
};
