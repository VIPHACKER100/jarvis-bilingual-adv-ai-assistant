import { FC, useMemo } from 'react';
import { motion } from 'framer-motion';
import { Cpu, Zap, Database } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { Card } from './ui/Card';

export const SystemMetricsWidget: FC = () => {
  const { systemStatus } = useJarvisStore();

  const metrics = useMemo(() => [
    { 
      id: 'cpu', 
      label: 'Core_Load', 
      value: systemStatus?.cpu?.percent || 12, 
      unit: '%', 
      icon: <Cpu className="w-4 h-4" />, 
      color: '#5E6AD2',
      data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 20 + 5))
    },
    { 
      id: 'mem', 
      label: 'Memory_Map', 
      value: systemStatus?.memory?.used ? Math.round(systemStatus.memory.used / 1024 / 1024) : 240, 
      unit: 'MB', 
      icon: <Database className="w-4 h-4" />, 
      color: '#A855F7',
      data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 50 + 200))
    },
    { 
      id: 'lat', 
      label: 'Signal_Lag', 
      value: systemStatus?.event_loop_lag || 8, 
      unit: 'ms', 
      icon: <Zap className="w-4 h-4" />, 
      color: '#0EA5E9',
      data: Array.from({ length: 10 }, () => Math.floor(Math.random() * 10 + 2))
    }
  ], [systemStatus]);

  return (
    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 w-full">
      {metrics.map((m) => (
        <Card key={m.id} elevation="mid" interactive className="group border-border-subtle hover:border-accent-cyan/30 overflow-hidden card-hover-lift">
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-start">
              <div className="flex flex-col gap-1">
                <span className="text-[10px] font-mono text-foreground-subtle uppercase tracking-[0.2em]">{m.label}</span>
                <div className="flex items-baseline gap-1">
                  <span className="text-xl font-bold font-mono tracking-tight text-foreground glow-text group-hover:text-accent-cyan transition-colors">{Math.round(m.value)}</span>
                  <span className="text-xs font-mono text-foreground-subtle uppercase">{m.unit}</span>
                </div>
              </div>
              <div 
                className="p-2 rounded-lg bg-surface-low transition-colors group-hover:bg-accent-cyan/10"
                style={{ color: m.color }}
              >
                {m.icon}
              </div>
            </div>

            {/* Mini Sparkline Visualization */}
            <div className="h-10 w-full flex items-end gap-1 px-1">
              {m.data.map((d, i) => (
                <motion.div
                  key={i}
                  initial={{ height: 0 }}
                  animate={{ height: `${(d / Math.max(...m.data)) * 100}%` }}
                  transition={{ delay: i * 0.05, duration: 0.5 }}
                  className="flex-1 rounded-t-sm"
                  style={{ 
                    backgroundColor: m.color,
                    opacity: 0.2 + (i * 0.08)
                  }}
                />
              ))}
            </div>
          </div>
        </Card>
      ))}
    </div>
  );
};
