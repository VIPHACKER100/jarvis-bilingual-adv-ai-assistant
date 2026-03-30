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

  const cpuColor = data.cpu.percent > 80 ? '#ec4899' : data.cpu.percent > 50 ? '#d946ef' : '#8b5cf6';
  const memColor = data.memory.percent > 80 ? '#ec4899' : data.memory.percent > 50 ? '#d946ef' : '#0ea5e9';

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
              className="transition-all duration-1000 ease-out drop-shadow-[0_0_8px_rgba(139,92,246,0.6)]"
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
    <div className="w-full max-w-md glass-panel border border-cyan-500/20 rounded-xl p-6 relative overflow-hidden group hover:border-purple-500/40 transition-all shadow-[inset_0_0_20px_rgba(6,182,212,0.05)]">
      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-4 h-4 border-t-2 border-l-2 border-purple-500/40 rounded-tl-xl transition-colors group-hover:border-cyan-400"></div>
      <div className="absolute top-0 right-0 w-4 h-4 border-t-2 border-r-2 border-purple-500/40 rounded-tr-xl transition-colors group-hover:border-cyan-400"></div>
      <div className="absolute bottom-0 left-0 w-4 h-4 border-b-2 border-l-2 border-purple-500/40 rounded-bl-xl transition-colors group-hover:border-cyan-400"></div>
      <div className="absolute bottom-0 right-0 w-4 h-4 border-b-2 border-r-2 border-purple-500/40 rounded-br-xl transition-colors group-hover:border-cyan-400"></div>

      {/* Header */}
      <div className="flex justify-between items-center mb-6 border-b border-gradient-to-r from-cyan-500/30 to-purple-500/30 pb-3">
        <h3 className="text-xs font-bold text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-purple-400 tracking-[0.3em] uppercase drop-shadow-sm">System_Diagnostics_v3</h3>
        <span className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">{data.platform || 'LOCAL_HOST'} // {new Date().toLocaleTimeString()}</span>
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
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
               <div 
                 className={`h-full transition-all duration-1000 ${(data.battery.percent || 0) < 20 ? 'bg-pink-500 shadow-[0_0_10px_#ec4899]' : 'bg-gradient-to-r from-cyan-400 to-purple-400 shadow-[0_0_10px_#8b5cf6]'}`} 
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
            <div className="h-1.5 bg-slate-800/80 rounded-full overflow-hidden shadow-inner">
               <div 
                 className="h-full bg-gradient-to-r from-blue-400 to-cyan-400 transition-all duration-1000 shadow-[0_0_10px_#38bdf8]" 
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
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent animate-scan pointer-events-none"></div>
    </div>
  );
};
