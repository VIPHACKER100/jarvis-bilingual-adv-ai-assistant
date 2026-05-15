import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Activity, Clock } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface PerformanceMetric {
  timestamp: string;
  event_loop_lag: number;
  cpu_percent: number;
  memory_percent: number;
}

export const PerformanceHistory: FC = () => {
  const [history, setHistory] = useState<PerformanceMetric[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchHistory = async () => {
    try {
      const response = await apiClient.getPerformanceHistory(30);
      if (response.success && response.data) {
        // Reverse to get chronological order for the chart
        const historyData = Array.isArray(response.data) ? response.data : [];
        setHistory([...historyData].reverse());
      }
    } catch (error) {
      console.error('Failed to fetch performance history:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
    const interval = setInterval(fetchHistory, 10000);
    return () => clearInterval(interval);
  }, []);

  if (loading && history.length === 0) return null;

  // Simple line chart using SVG
  const generatePath = (data: number[], height: number, width: number, max: number) => {
    if (data.length < 2) return '';
    const step = width / (data.length - 1);
    return data.map((val, i) => {
      const x = i * step;
      const y = height - (val / max) * height;
      return `${i === 0 ? 'M' : 'L'} ${x} ${y}`;
    }).join(' ');
  };

  const lagData = history.map(m => m.event_loop_lag);
  const cpuData = history.map(m => m.cpu_percent);

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-panel p-4 space-y-4"
    >
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-2">
          <Clock className="w-3 h-3 text-accent" />
          <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">Performance_Timeline</span>
        </div>
        <span className="text-[8px] text-foreground-muted font-mono uppercase">Last 30 snapshots</span>
      </div>

      <div className="relative h-20 w-full group">
        {/* CPU Chart */}
        <svg className="absolute inset-0 w-full h-full overflow-visible">
          <defs>
            <linearGradient id="cpuGradient" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--accent)" stopOpacity="0.2" />
              <stop offset="100%" stopColor="var(--accent)" stopOpacity="0" />
            </linearGradient>
          </defs>
          
          {/* Grid lines */}
          <line x1="0" y1="0" x2="100%" y2="0" stroke="var(--border-default)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="50%" x2="100%" y2="50%" stroke="var(--border-default)" strokeWidth="0.5" strokeDasharray="2 2" />
          <line x1="0" y1="100%" x2="100%" y2="100%" stroke="var(--border-default)" strokeWidth="0.5" strokeDasharray="2 2" />

          {/* CPU Line */}
          <motion.path
            d={generatePath(cpuData, 80, 100, 100)}
            fill="none"
            stroke="var(--accent)"
            strokeWidth="1.5"
            strokeLinecap="round"
            initial={{ pathLength: 0 }}
            animate={{ pathLength: 1 }}
            className="vector-path"
            preserveAspectRatio="none"
            viewBox="0 0 100 80"
          />
          
          {/* Lag Line (dashed) */}
          <motion.path
            d={generatePath(lagData, 80, 100, 200)} // Max 200ms for scale
            fill="none"
            stroke="var(--foreground-muted)"
            strokeWidth="1"
            strokeDasharray="2 2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            preserveAspectRatio="none"
            viewBox="0 0 100 80"
          />
        </svg>

        {/* Hover overlay or info */}
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity bg-background/40 backdrop-blur-[2px]">
          <div className="flex gap-4 text-[9px] font-mono">
            <div className="flex flex-col items-center">
              <span className="text-accent">CPU_AVG</span>
              <span>{(cpuData.reduce((a, b) => a + b, 0) / (cpuData.length || 1)).toFixed(1)}%</span>
            </div>
            <div className="flex flex-col items-center">
              <span className="text-foreground-muted">LAG_AVG</span>
              <span>{(lagData.reduce((a, b) => a + b, 0) / (lagData.length || 1)).toFixed(1)}ms</span>
            </div>
          </div>
        </div>
      </div>

      <div className="flex justify-between text-[8px] font-mono text-foreground-muted uppercase">
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 bg-accent"></div>
          <span>Load_Trend</span>
        </div>
        <div className="flex items-center gap-1">
          <div className="w-2 h-0.5 border-t border-dashed border-foreground-muted"></div>
          <span>Latency_Trend</span>
        </div>
      </div>
    </motion.div>
  );
};
