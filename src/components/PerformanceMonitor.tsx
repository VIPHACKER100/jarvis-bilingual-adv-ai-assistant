import { FC } from 'react';
import { motion } from 'framer-motion';
import {
  Activity, Cpu, HardDrive, Wifi, Zap,
  RefreshCw,   CheckCircle,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { usePerformanceHistory } from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Badge } from './ui/Badge';
import type { PerformancePoint } from '../types/api';

interface MetricBarProps {
  label: string;
  value: number;
  unit: string;
  color?: string;
  history?: number[];
}

const MetricBar: FC<MetricBarProps> = ({ label, value, unit, color = 'accent', history = [] }) => {
  const pct = Math.min(value, 100);
  const colorMap: Record<string, string> = {
    accent: 'bg-accent',
    success: 'bg-success',
    warning: 'bg-amber-500',
    danger: 'bg-danger',
    info: 'bg-cyan-400',
  };
  const barColor = colorMap[color] ?? 'bg-accent';

  return (
    <div className="space-y-1.5">
      <div className="flex items-center justify-between">
        <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">{label}</span>
        <span className="text-[10px] font-mono text-foreground font-bold">{value.toFixed(1)} {unit}</span>
      </div>
      <div className="relative h-2 bg-background-deep rounded-full overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
          className={`h-full ${barColor} rounded-full opacity-80`}
        />
      </div>
      {history.length > 1 && (
        <div className="flex items-end gap-[2px] h-6">
          {history.map((h, i) => {
            const hpct = Math.min(h, 100);
            return (
              <div key={i}
                className={`w-[3px] rounded-t ${barColor} opacity-60`}
                style={{ height: `${Math.max(hpct, 4)}%` }}
              />
            );
          })}
        </div>
      )}
    </div>
  );
};

export const PerformanceMonitor: FC = () => {
  const { showPerformanceMonitor, setShowPerformanceMonitor } = useJarvisStore();
  const { data, isLoading, refetch, isRefetching, dataUpdatedAt } = usePerformanceHistory();

  if (!showPerformanceMonitor) return null;

  const points: PerformancePoint[] = data?.data ?? [];
  const latest = points[points.length - 1];
  const cpu = latest?.cpu_percent ?? 0;
  const memory = latest?.memory_percent ?? 0;
  const disk = latest?.disk_percent ?? 0;
  const bytesSent = latest?.network_bytes_sent ?? 0;
  const bytesRecv = latest?.network_bytes_recv ?? 0;

  const cpuHistory = points.map(p => p.cpu_percent);
  const memHistory = points.map(p => p.memory_percent);
  const diskHistory = points.map(p => p.disk_percent);
  const netHistory = points.map(p => p.network_bytes_sent / 1024 / 1024);

  const lastUpdated = dataUpdatedAt ? new Date(dataUpdatedAt).toLocaleTimeString() : '—';

  return (
    <Modal isOpen={showPerformanceMonitor} onClose={() => setShowPerformanceMonitor(false)} title="PERFORMANCE_MONITOR // v4.0" size="lg">
      <div className="flex flex-col gap-5 min-h-[400px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-accent" />
            <span className="text-xs font-mono text-foreground-muted">
              <span className="text-foreground font-bold">{points.length}</span> data points
              {latest?.timestamp && <span className="ml-3 opacity-60">Latest: {new Date(latest.timestamp).toLocaleTimeString()}</span>}
            </span>
          </div>
          <div className="flex items-center gap-3">
            <span className="text-[9px] font-mono text-foreground-muted/50">Updated: {lastUpdated}</span>
            <button onClick={() => refetch()} disabled={isRefetching}
              className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Refresh metrics" aria-label="Refresh performance metrics">
              <RefreshCw className={`w-3.5 h-3.5 text-foreground-muted ${isRefetching ? 'animate-spin' : ''}`} />
            </button>
          </div>
        </div>

        {isLoading ? (
          <div className="flex items-center justify-center py-16">
            <div className="flex flex-col items-center gap-3">
              <div className="w-8 h-8 rounded-full border-2 border-accent/20 border-t-accent animate-spin" />
              <span className="text-[10px] font-mono text-foreground-muted uppercase">Loading metrics...</span>
            </div>
          </div>
        ) : points.length === 0 ? (
          <div className="flex items-center justify-center py-16">
            <span className="text-xs font-mono text-foreground-muted">No performance data available</span>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
            {/* CPU */}
            <div className="p-4 bg-background-deep/60 border border-border-default rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Cpu className="w-4 h-4 text-cyan-400" />
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-bold">CPU</span>
              </div>
              <MetricBar label="Usage" value={cpu} unit="%" color="info" history={cpuHistory} />
            </div>

            {/* Memory */}
            <div className="p-4 bg-background-deep/60 border border-border-default rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Zap className="w-4 h-4 text-purple-400" />
                <span className="text-[10px] font-mono text-purple-400 uppercase tracking-widest font-bold">Memory</span>
                <Badge variant="info" className="ml-auto text-[8px]">{memory.toFixed(0)}%</Badge>
              </div>
              <MetricBar label="RAM" value={memory} unit="%" color="info" history={memHistory} />
            </div>

            {/* Disk */}
            <div className="p-4 bg-background-deep/60 border border-border-default rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <HardDrive className="w-4 h-4 text-emerald-400" />
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-bold">Disk</span>
              </div>
              <MetricBar label="Storage" value={disk} unit="%" color="success" history={diskHistory} />
            </div>

            {/* Network */}
            <div className="p-4 bg-background-deep/60 border border-border-default rounded-xl">
              <div className="flex items-center gap-2 mb-3">
                <Wifi className="w-4 h-4 text-amber-400" />
                <span className="text-[10px] font-mono text-amber-400 uppercase tracking-widest font-bold">Network</span>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-foreground-muted">⬇ Received</span>
                  <span className="text-foreground">{(bytesRecv / 1024 / 1024).toFixed(1)} MB/s</span>
                </div>
                <div className="flex items-center justify-between text-[10px] font-mono">
                  <span className="text-foreground-muted">⬆ Sent</span>
                  <span className="text-foreground">{(bytesSent / 1024 / 1024).toFixed(1)} MB/s</span>
                </div>
              </div>
              {netHistory.length > 1 && (
                <div className="mt-3">
                  <span className="text-[9px] font-mono text-foreground-muted/50 block mb-1">Traffic</span>
                  <div className="flex items-end gap-[2px] h-8">
                    {netHistory.map((h, i) => {
                      const hpct = Math.min(h, 100);
                      return <div key={i} className="w-[4px] rounded-t bg-amber-400/60" style={{ height: `${Math.max(hpct, 5)}%` }} />;
                    })}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        <div className="flex items-center gap-4 pt-3 border-t border-border-subtle">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-3.5 h-3.5 text-success" />
            <span className="text-[9px] font-mono text-foreground-muted">System Nominal</span>
          </div>
          <button onClick={() => refetch()} className="ml-auto flex items-center gap-1.5 text-[9px] font-mono text-accent hover:underline">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>
    </Modal>
  );
};
