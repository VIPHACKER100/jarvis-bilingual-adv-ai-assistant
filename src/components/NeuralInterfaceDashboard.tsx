import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, BarChart3,
  Cpu, Database, HardDrive,
  RefreshCw, Scan, Search, Server,
  Settings2, Shield, Terminal, Thermometer, Wifi, Zap, XCircle,
  ArrowUp, ArrowDown, CheckCircle, Radio,
} from 'lucide-react';
import { APP_VERSION } from '../config';

interface MetricSnapshot {
  value: number;
  trend: number;
  data: number[];
}

interface DashboardMetrics {
  cpu: MetricSnapshot;
  memory: MetricSnapshot;
  latency: MetricSnapshot;
  tasks: MetricSnapshot;
}

interface LogEntry {
  id: string;
  category: 'SYS_CORE' | 'MODULE' | 'AI' | 'NETWORK' | 'SECURITY';
  message: string;
  timestamp: Date;
}

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  status: 'ONLINE' | 'OFFLINE';
  uptime: string;
}

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  data: number[];
  icon: React.ReactNode;
}

interface Point {
  x: number;
  y: number;
}

const sparkline = (len = 8, min = 10, max = 90): number[] =>
  Array.from({ length: len }, () => min + Math.random() * (max - min));

const randomTrend = (): number => (Math.random() - 0.5) * 10;

const initialMetrics = (): DashboardMetrics => ({
  cpu:    { value: 42 + Math.random() * 20, trend: -2.4, data: sparkline(8, 20, 80) },
  memory: { value: 56 + Math.random() * 15, trend: 3.1, data: sparkline(8, 30, 85) },
  latency:{ value: 18 + Math.random() * 15, trend: -1.6, data: sparkline(8, 5, 50) },
  tasks:  { value: Math.floor(9 + Math.random() * 8), trend: 0.8, data: sparkline(8, 4, 18) },
});

const generateLogs = (): LogEntry[] => {
  const now = Date.now();
  return [
    { id: 'l1', category: 'SYS_CORE', message: 'System Booting...',                     timestamp: new Date(now - 10000) },
    { id: 'l2', category: 'MODULE',   message: 'Vision Overlay Initialized',            timestamp: new Date(now - 7500) },
    { id: 'l3', category: 'AI',       message: 'Neural Core Connected',                 timestamp: new Date(now - 5000) },
    { id: 'l4', category: 'SECURITY', message: 'Encryption Handshake Complete',         timestamp: new Date(now - 2500) },
    { id: 'l5', category: 'NETWORK',  message: 'WebSocket Bridge Established',          timestamp: new Date(now) },
    { id: 'l6', category: 'SYS_CORE', message: 'Telemetry Pipeline Active',             timestamp: new Date(now + 500) },
  ];
};

const categoryStyle: Record<string, { color: string; bg: string; label: string }> = {
  SYS_CORE:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'SYS_CORE' },
  MODULE:    { color: '#00D4FF', bg: 'rgba(0,212,255,0.10)',  label: 'MODULE' },
  AI:        { color: '#5E6AD2', bg: 'rgba(94,106,210,0.12)', label: 'AI' },
  NETWORK:   { color: '#00E58B', bg: 'rgba(0,229,139,0.10)',  label: 'NETWORK' },
  SECURITY:  { color: '#FFB020', bg: 'rgba(255,176,32,0.10)', label: 'SECURITY' },
};

const modulesData: ModuleInfo[] = [
  { id: 'm1', name: 'Vision Overlay',  version: 'v4', status: 'ONLINE',  uptime: '2h 45m' },
  { id: 'm2', name: 'Neural Core',     version: 'v4', status: 'ONLINE',  uptime: '14h 12m' },
  { id: 'm3', name: 'Threat Monitor',  version: 'v3', status: 'OFFLINE', uptime: '0m' },
  { id: 'm4', name: 'Data Optimizer',  version: 'v2', status: 'OFFLINE', uptime: '0m' },
];

const healthData: HealthMetric[] = [
  { id: 'h1', label: 'Core Temperature', value: '68°C',  status: 'good',    data: sparkline(6, 55, 75), icon: <Thermometer className="w-4 h-4" /> },
  { id: 'h2', label: 'Sync Status',      value: '98.2%', status: 'good',    data: sparkline(6, 90, 100), icon: <RefreshCw className="w-4 h-4" /> },
  { id: 'h3', label: 'Disk Activity',    value: '340MB/s',status:'warning', data: sparkline(6, 100, 500),icon: <HardDrive className="w-4 h-4" /> },
  { id: 'h4', label: 'Power Usage',     value: '147W',  status: 'good',    data: sparkline(6, 100, 180),icon: <Zap className="w-4 h-4" /> },
];

/* ── Skeleton ── */

const Skeleton: FC<{ className?: string }> = ({ className = '' }) => (
  <div className={`skeleton rounded-lg ${className}`} />
);

/* ── Mini Sparkline ── */

const MiniSparkline: FC<{ data: number[]; color: string; height?: number }> = ({ data, color, height = 20 }) => {
  const max = Math.max(...data, 1);
  return (
    <div className="flex items-end gap-[2px] w-full" style={{ height }}>
      {data.map((d, i) => (
        <motion.div
          key={i}
          initial={{ height: 0 }}
          animate={{ height: `${(d / max) * 100}%` }}
          transition={{ delay: i * 0.03, duration: 0.4, ease: 'easeOut' }}
          className="flex-1 rounded-t-sm min-w-[3px]"
          style={{ backgroundColor: color, opacity: 0.2 + (i / data.length) * 0.5 }}
        />
      ))}
    </div>
  );
};

/* ── Status Dot ── */

const StatusDot: FC<{ status: 'good' | 'warning' | 'critical' | 'online' | 'offline' | 'stable' }> = ({ status }) => {
  const colorMap: Record<string, string> = {
    good: '#00E58B', warning: '#FFB020', critical: '#FF4D67',
    online: '#00E58B', offline: '#FF4D67', stable: '#00E58B',
  };
  const color = colorMap[status] || '#00E58B';
  return (
    <span className="relative flex h-2.5 w-2.5 shrink-0" role="img" aria-label={status}>
      <span className="absolute inline-flex h-full w-full rounded-full animate-ping" style={{ backgroundColor: color, opacity: 0.6 }} />
      <span className="relative inline-flex rounded-full h-2.5 w-2.5" style={{ backgroundColor: color }} />
    </span>
  );
};

/* ── Metric Card ── */

const MetricCard: FC<{
  icon: React.ReactNode;
  label: string;
  value: string;
  trend: number;
  color: string;
  data: number[];
  status: 'good' | 'warning' | 'critical';
  loading?: boolean;
}> = ({ icon, label, value, trend, color, data, status, loading }) => {
  const trendIsGood = trend < 0;
  const trendColor = trendIsGood ? '#00E58B' : '#FF4D67';

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="flex flex-col gap-3">
          <div className="flex items-center justify-between">
            <Skeleton className="h-8 w-8 rounded-lg" />
            <Skeleton className="h-3 w-3 rounded-full" />
          </div>
          <Skeleton className="h-8 w-24" />
          <Skeleton className="h-5 w-full" />
        </div>
      </div>
    );
  }

  return (
    <motion.div
      whileHover={{ y: -2 }}
      transition={{ duration: 0.2 }}
      className="glass-panel p-4 group cursor-default"
    >
      <div className="flex flex-col gap-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg" style={{ backgroundColor: `${color}18`, color }}>
              {icon}
            </div>
            <span className="text-xs font-medium tracking-wide" style={{ color: '#94A3B8' }}>
              {label}
            </span>
          </div>
          <StatusDot status={status} />
        </div>

        <div className="flex items-baseline justify-between">
          <span className="text-2xl font-bold font-mono tracking-tight" style={{ color: '#E6EDF7' }}>
            {value}
          </span>
          <div className="flex items-center gap-0.5 text-xs font-mono font-semibold tabular-nums" style={{ color: trendColor }}>
            {trend >= 0 ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />}
            <span>{Math.abs(trend).toFixed(1)}%</span>
          </div>
        </div>

        <MiniSparkline data={data} color={color} height={20} />
      </div>
    </motion.div>
  );
};

/* ── Session Log Panel ── */

const SessionLogPanel: FC<{ logs: LogEntry[]; loading?: boolean }> = ({ logs, loading }) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
  }, [logs]);

  if (loading) {
    return (
      <div className="glass-panel flex flex-col overflow-hidden" style={{ minHeight: 280 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="flex items-center gap-3">
              <Skeleton className="h-4 w-20" />
              <Skeleton className="h-4 flex-1" />
              <Skeleton className="h-4 w-14" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel flex flex-col overflow-hidden" style={{ minHeight: 280 }}>
      <div className="flex items-center justify-between px-4 py-3 border-b" style={{ borderColor: 'var(--border-default)' }}>
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Session Log</h2>
        </div>
        <div className="flex items-center gap-2">
          <button className="p-1.5 rounded-md hover:bg-[rgba(255,255,255,0.06)] transition-colors" title="Search logs" aria-label="Search logs">
            <Search className="w-3.5 h-3.5" style={{ color: '#94A3B8' }} />
          </button>
          <StatusDot status="online" />
        </div>
      </div>

      <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5" style={{ maxHeight: 260, fontFamily: "'JetBrains Mono', 'Fira Code', monospace" }}>
        {logs.length === 0 ? (
          <div className="flex items-center justify-center py-8 text-sm" style={{ color: '#94A3B8' }}>
            No log entries yet
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {logs.map((entry) => {
              const style = categoryStyle[entry.category];
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -4 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-center gap-2 py-1.5 px-2 rounded hover:bg-[rgba(255,255,255,0.03)] transition-colors"
                >
                  <span className="text-xs font-bold shrink-0" style={{ color: style.color }}>
                    [{style.label}]
                  </span>
                  <span className="text-sm flex-1 truncate" style={{ color: '#C8D0DC' }}>
                    {entry.message}
                  </span>
                  <span className="text-xs font-mono shrink-0 tabular-nums" style={{ color: '#94A3B8' }}>
                    {entry.timestamp.toLocaleTimeString([], { hour12: false, hour: '2-digit', minute: '2-digit', second: '2-digit' })}
                  </span>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      <div className="px-4 py-2 flex items-center justify-between border-t" style={{ borderColor: 'var(--border-default)', backgroundColor: 'rgba(0,0,0,0.15)' }}>
        <div className="flex items-center gap-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-[#00E58B] animate-pulse" />
          <span className="text-xs font-mono tracking-wide" style={{ color: 'rgba(255,255,255,0.4)' }}>Live</span>
        </div>
        <span className="text-xs font-mono tabular-nums" style={{ color: 'rgba(255,255,255,0.3)' }}>
          {logs.length} entries
        </span>
      </div>
    </div>
  );
};

/* ── AI Core Panel ── */

const AICorePanel: FC<{ metrics: DashboardMetrics; loading?: boolean }> = ({ metrics, loading }) => {
  const coreMetrics = [
    { label: 'CPU', value: `${Math.round(metrics.cpu.value)}%`, color: '#00D4FF', pct: Math.round(metrics.cpu.value) },
    { label: 'Memory', value: `${Math.round(metrics.memory.value)}%`, color: '#8B5CF6', pct: Math.round(metrics.memory.value) },
    { label: 'Latency', value: `${Math.round(metrics.latency.value)}ms`, color: '#00E58B', pct: Math.min(100, Math.round(metrics.latency.value)) },
    { label: 'Tasks', value: `${Math.round(metrics.tasks.value)}`, color: '#FFB020', pct: Math.min(100, Math.round(metrics.tasks.value * 5)) },
  ];

  const isStable = metrics.cpu.value < 70 && metrics.latency.value < 50;

  if (loading) {
    return (
      <div className="glass-panel p-6" style={{ minHeight: 210 }}>
        <div className="flex items-center gap-3 mb-4">
          <Skeleton className="h-6 w-6 rounded-lg" />
          <Skeleton className="h-5 w-32" />
        </div>
        <div className="grid grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="space-y-2">
              <Skeleton className="h-4 w-16" />
              <Skeleton className="h-3 w-full rounded" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="glass-panel p-5 relative overflow-hidden" style={{ minHeight: 210 }}>
      <div className="absolute top-0 right-0 w-64 h-64 pointer-events-none opacity-[0.03]" style={{
        background: 'radial-gradient(circle, #00D4FF 0%, transparent 70%)',
        transform: 'translate(30%, -30%)',
      }} />

      <div className="flex items-center gap-3 mb-4">
        <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,212,255,0.12)' }}>
          <Cpu className="w-5 h-5" style={{ color: 'var(--accent-cyan)' }} />
        </div>
        <div>
          <h2 className="text-base font-bold tracking-tight" style={{ color: 'var(--foreground)' }}>AI Core</h2>
          <div className="flex items-center gap-1.5 mt-0.5">
            <span className="w-2 h-2 rounded-full bg-[#00E58B] shadow-[0_0_6px_rgba(0,229,139,0.6)] animate-pulse" />
            <span className="text-xs font-semibold" style={{ color: '#00E58B' }}>ONLINE</span>
            <span className="text-xs ml-2" style={{ color: '#94A3B8' }}>|</span>
            <span className="text-xs flex items-center gap-1" style={{ color: isStable ? '#00E58B' : '#FFB020' }}>
              <CheckCircle className="w-3 h-3" />
              System {isStable ? 'Stable' : 'Degraded'}
            </span>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-x-6 gap-y-3">
        {coreMetrics.map((m) => (
          <div key={m.label} className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium tracking-wide" style={{ color: '#94A3B8' }}>{m.label}</span>
              <span className="text-sm font-bold font-mono tabular-nums" style={{ color: m.color }}>{m.value}</span>
            </div>
            <div className="h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.06)' }}>
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${m.pct}%` }}
                transition={{ duration: 0.6, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{ backgroundColor: m.color }}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

/* ── Critical Alert Card ── */

const CriticalAlertCard: FC = () => (
  <div className="glass-panel p-4 overflow-hidden" style={{ borderColor: 'rgba(255,77,103,0.35)' }}>
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2.5">
        <div className="p-2 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(255,77,103,0.12)' }}>
          <AlertTriangle className="w-4 h-4" style={{ color: '#FF4D67' }} />
        </div>
        <div>
          <h3 className="text-sm font-bold" style={{ color: '#FF4D67' }}>Backend Offline</h3>
          <p className="text-xs font-mono mt-0.5" style={{ color: '#94A3B8' }}>Last heartbeat 2m ago</p>
        </div>
      </div>

      <div className="rounded-lg p-3 space-y-1.5" style={{ backgroundColor: 'rgba(255,77,103,0.05)', border: '1px solid rgba(255,77,103,0.1)' }}>
        <div className="flex justify-between items-center text-xs font-mono">
          <span style={{ color: '#94A3B8' }}>Connection</span>
          <div className="flex items-center gap-1">
            <XCircle className="w-3 h-3" style={{ color: '#FF4D67' }} />
            <span style={{ color: '#FF4D67' }}>Disconnected</span>
          </div>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span style={{ color: '#94A3B8' }}>Retries</span>
          <span style={{ color: '#FFB020' }}>3/5</span>
        </div>
        <div className="flex justify-between items-center text-xs font-mono">
          <span style={{ color: '#94A3B8' }}>Error Code</span>
          <span style={{ color: '#C8D0DC' }}>E-1047</span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <button
          className="flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all duration-200 hover:brightness-110 active:scale-[0.98]"
          style={{ backgroundColor: '#00D4FF', color: '#050A12' }}
          title="Attempt to reconnect to backend"
          aria-label="Attempt to reconnect to backend"
        >
          Reconnect
        </button>
        <button
          className="flex-1 py-2 px-3 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all duration-200 hover:bg-[rgba(255,255,255,0.06)] active:scale-[0.98]"
          style={{ color: '#94A3B8', border: '1px solid var(--border-default)' }}
          title="View backend connection logs"
          aria-label="View backend connection logs"
        >
          View Logs
        </button>
      </div>
    </div>
  </div>
);

/* ── System Health Panel ── */

const SystemHealthPanel: FC<{ healthMetrics: HealthMetric[]; loading?: boolean }> = ({ healthMetrics, loading }) => {
  if (loading) {
    return (
      <div className="glass-panel p-4">
        <Skeleton className="h-5 w-32 mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center gap-3 py-2">
            <Skeleton className="h-8 w-8 rounded-lg shrink-0" />
            <div className="flex-1 space-y-1">
              <Skeleton className="h-4 w-full" />
              <Skeleton className="h-3 w-full" />
            </div>
          </div>
        ))}
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center gap-2 mb-3">
        <Activity className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>System Health</h3>
      </div>

      <div className="space-y-2">
        {healthMetrics.map((metric) => (
          <div key={metric.id} className="flex items-center gap-3 p-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.03)]">
            <div className="p-1.5 rounded-lg shrink-0" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }}>
              <div style={{ color: '#94A3B8' }}>{metric.icon}</div>
            </div>

            <div className="flex-1 min-w-0">
              <div className="flex items-center justify-between mb-0.5">
                <span className="text-xs font-medium" style={{ color: '#C8D0DC' }}>
                  {metric.label}
                </span>
                <span className="text-sm font-bold font-mono tabular-nums" style={{ color: 'var(--foreground)' }}>
                  {metric.value}
                </span>
              </div>
              <MiniSparkline data={metric.data} color={metric.status === 'good' ? '#00E58B' : metric.status === 'warning' ? '#FFB020' : '#FF4D67'} height={16} />
            </div>

            <StatusDot status={metric.status} />
          </div>
        ))}
      </div>

      <div className="flex items-center gap-1.5 mt-3 pt-3 border-t" style={{ borderColor: 'var(--border-default)' }}>
        <CheckCircle className="w-3.5 h-3.5" style={{ color: '#00E58B' }} />
        <span className="text-xs font-medium" style={{ color: '#00E58B' }}>
          All Systems Operational
        </span>
      </div>
    </div>
  );
};

/* ── Quick Actions Row ── */

const QuickActionsRow: FC = () => {
  const actions = [
    { icon: <Scan className="w-5 h-5" />, label: 'Start Scan',      description: 'Full system diagnostic',       color: '#00D4FF' },
    { icon: <Settings2 className="w-5 h-5" />, label: 'Run Automation', description: 'Background macro scripts',   color: '#8B5CF6' },
    { icon: <Terminal className="w-5 h-5" />,  label: 'Open Terminal',  description: 'Root command line access',   color: '#00E58B' },
    { icon: <Activity className="w-5 h-5" />,   label: 'Diagnostics',    description: 'Detailed performance data',  color: '#FFB020' },
  ];

  return (
    <div>
      <div className="flex items-center gap-2 mb-3">
        <Radio className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
        <h2 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Quick Actions</h2>
      </div>
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        {actions.map((action, idx) => (
          <motion.button
            key={idx}
            whileHover={{ y: -2 }}
            whileTap={{ scale: 0.98 }}
            transition={{ duration: 0.2 }}
            className="glass-panel p-4 text-left cursor-pointer group"
            title={action.label}
            aria-label={action.label}
          >
            <div className="flex flex-col gap-2.5">
              <div className="p-2.5 rounded-lg w-fit transition-all duration-200 group-hover:shadow-lg"
                style={{ backgroundColor: `${action.color}15`, color: action.color }}>
                {action.icon}
              </div>
              <div className="flex flex-col gap-0.5">
                <span className="text-sm font-semibold tracking-wide" style={{ color: '#E6EDF7' }}>
                  {action.label}
                </span>
                <span className="text-xs" style={{ color: '#94A3B8' }}>
                  {action.description}
                </span>
              </div>
            </div>
            <div className="absolute bottom-0 left-2 right-2 h-[2px] rounded-full opacity-0 group-hover:opacity-100 transition-opacity duration-200"
              style={{ background: `linear-gradient(90deg, transparent, ${action.color}, transparent)` }} />
          </motion.button>
        ))}
      </div>
    </div>
  );
};

/* ── System Overview Chart ── */

const SystemOverviewChart: FC<{
  timeRange: '1H' | '24H' | '7D';
  setTimeRange: (v: '1H' | '24H' | '7D') => void;
  chartData: { cpu: Point[]; memory: Point[]; latency: Point[] };
  buildPath: (data: Point[], w: number, h: number, minY: number, maxY: number) => string;
  loading?: boolean;
}> = ({ timeRange, setTimeRange, chartData, buildPath, loading }) => {
  const svgRef = useRef<HTMLDivElement>(null);
  const [dimensions, setDimensions] = useState({ width: 600, height: 160 });

  useEffect(() => {
    const updateSize = () => {
      if (svgRef.current) {
        const rect = svgRef.current.getBoundingClientRect();
        setDimensions({ width: rect.width - 4, height: 160 });
      }
    };
    updateSize();
    window.addEventListener('resize', updateSize);
    return () => window.removeEventListener('resize', updateSize);
  }, []);

  const { width, height } = dimensions;
  const pad = { top: 8, bottom: 20, left: 8, right: 8 };
  const drawW = width - pad.left - pad.right;
  const drawH = height - pad.top - pad.bottom;

  const lineConfig = [
    { data: chartData.cpu,    color: '#00D4FF', label: 'CPU' },
    { data: chartData.memory, color: '#8B5CF6', label: 'Memory' },
    { data: chartData.latency,color: '#00E58B', label: 'Latency' },
  ];

  const gridLines = [0, 25, 50, 75, 100];

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center justify-between mb-3">
          <Skeleton className="h-5 w-32" />
          <div className="flex gap-1">
            {[1, 2, 3].map((i) => <Skeleton key={i} className="h-6 w-10 rounded" />)}
          </div>
        </div>
        <Skeleton className="h-40 w-full rounded" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <BarChart3 className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
          <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>System Overview</h3>
        </div>
        <div className="flex items-center gap-1">
          {(['1H', '24H', '7D'] as const).map((range) => (
            <button
              key={range}
              onClick={() => setTimeRange(range)}
              className={`px-2.5 py-1 rounded-md text-xs font-mono font-semibold tracking-wide transition-all duration-200 ${
                timeRange === range
                  ? 'text-[#00D4FF] bg-[rgba(0,212,255,0.12)] border border-[rgba(0,212,255,0.25)]'
                  : 'text-[#94A3B8] hover:text-[#E6EDF7] hover:bg-[rgba(255,255,255,0.04)] border border-transparent'
              }`}
              title={`Show ${range} time range`}
              aria-label={`Show ${range} time range`}
            >
              {range}
            </button>
          ))}
        </div>
      </div>

      <div ref={svgRef} className="w-full" style={{ height: `${height + 20}px` }}>
        <svg width={width} height={height + 20} className="overflow-visible">
          {gridLines.map((g) => {
            const y = pad.top + (drawH - (g / 100) * drawH);
            return (
              <g key={g}>
                <line x1={pad.left} y1={y} x2={width - pad.right} y2={y} stroke="rgba(255,255,255,0.04)" strokeWidth="0.5" />
                <text x={pad.left - 4} y={y + 3} fill="#94A3B8" fontSize="7" textAnchor="end" fontFamily="'JetBrains Mono', monospace">{g}</text>
              </g>
            );
          })}

          {lineConfig.map((line) => {
            const path = buildPath(line.data, drawW, drawH, 0, 100);
            return (
              <g key={line.label}>
                <path d={path} fill="none" stroke={line.color} strokeWidth="3" opacity="0.12" style={{ filter: 'blur(4px)' }} transform={`translate(${pad.left}, ${pad.top})`} />
                <motion.path d={path} fill="none" stroke={line.color} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"
                  initial={{ pathLength: 0 }} animate={{ pathLength: 1 }}
                  transition={{ duration: 0.8, ease: [0.16, 1, 0.3, 1] }}
                  transform={`translate(${pad.left}, ${pad.top})`} />
              </g>
            );
          })}

          <g transform={`translate(${pad.left}, ${height - 2})`}>
            {lineConfig.map((line, i) => (
              <g key={line.label} transform={`translate(${i * 80}, 0)`}>
                <circle cx="0" cy="0" r="3" fill={line.color} />
                <text x="7" y="3" fill="#94A3B8" fontSize="8" fontFamily="'JetBrains Mono', monospace">{line.label}</text>
              </g>
            ))}
          </g>
        </svg>
      </div>
    </div>
  );
};

/* ── Module Manifest Panel ── */

const ModuleManifestPanel: FC<{ modules: ModuleInfo[]; loading?: boolean }> = ({ modules, loading }) => {
  if (loading) {
    return (
      <div className="glass-panel p-4">
        <Skeleton className="h-5 w-36 mb-3" />
        {[1, 2, 3, 4].map((i) => (
          <div key={i} className="flex items-center justify-between py-2.5 border-b last:border-0" style={{ borderColor: 'var(--border-default)' }}>
            <div className="space-y-1">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-3 w-20" />
            </div>
            <Skeleton className="h-4 w-4 rounded-full" />
          </div>
        ))}
        <Skeleton className="h-8 w-full mt-3 rounded-lg" />
      </div>
    );
  }

  return (
    <div className="glass-panel p-4 flex flex-col">
      <div className="flex items-center gap-2 mb-3">
        <Server className="w-4 h-4" style={{ color: 'var(--accent-cyan)' }} />
        <h3 className="text-sm font-semibold" style={{ color: 'var(--foreground)' }}>Module Manifest</h3>
      </div>

      <div className="space-y-1 flex-1">
        {modules.map((mod) => (
          <motion.div
            key={mod.id}
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.2 }}
            className="flex items-center justify-between py-2.5 px-2 rounded-lg transition-colors hover:bg-[rgba(255,255,255,0.03)]"
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <div className="flex items-center gap-2">
                <span className="text-sm font-medium truncate" style={{ color: '#E6EDF7' }}>
                  {mod.name}
                </span>
                <span className="text-xs font-mono px-1 py-0.5 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.04)', color: '#94A3B8' }}>
                  {mod.version}
                </span>
              </div>
              <span className="text-xs font-mono" style={{ color: '#94A3B8' }}>
                Uptime: {mod.uptime}
              </span>
            </div>
            <StatusDot status={mod.status === 'ONLINE' ? 'online' : 'offline'} />
          </motion.div>
        ))}
      </div>

      <button
        className="w-full py-2.5 px-3 rounded-lg text-xs font-mono font-semibold uppercase tracking-wide transition-all duration-200 mt-2 hover:brightness-110 active:scale-[0.98]"
        style={{ backgroundColor: 'rgba(0,212,255,0.1)', color: '#00D4FF', border: '1px solid rgba(0,212,255,0.2)' }}
        title="Open module management panel"
        aria-label="Open module management panel"
      >
        Manage Modules
      </button>
    </div>
  );
};

/* ── Main Dashboard Component ── */

export const NeuralInterfaceDashboard: FC = () => {
  const [metrics, setMetrics] = useState<DashboardMetrics>(initialMetrics);
  const [timeRange, setTimeRange] = useState<'1H' | '24H' | '7D'>('1H');
  const [logs, setLogs] = useState<LogEntry[]>(generateLogs);
  const [logCounter, setLogCounter] = useState(0);
  const [healthMetrics] = useState<HealthMetric[]>(healthData);
  const [loading, setLoading] = useState(true);

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 600);
    return () => clearTimeout(timer);
  }, []);

  // Live update every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      setMetrics((prev) => ({
        cpu: { ...prev.cpu, value: Math.min(95, Math.max(10, prev.cpu.value + (Math.random() - 0.5) * 8)), trend: randomTrend(), data: [...prev.cpu.data.slice(1), 20 + Math.random() * 60] },
        memory: { ...prev.memory, value: Math.min(95, Math.max(20, prev.memory.value + (Math.random() - 0.5) * 5)), trend: randomTrend(), data: [...prev.memory.data.slice(1), 30 + Math.random() * 50] },
        latency: { ...prev.latency, value: Math.min(150, Math.max(2, prev.latency.value + (Math.random() - 0.5) * 6)), trend: randomTrend(), data: [...prev.latency.data.slice(1), 5 + Math.random() * 30] },
        tasks: { ...prev.tasks, value: Math.min(20, Math.max(2, prev.tasks.value + (Math.random() - 0.5) * 3)), trend: randomTrend(), data: [...prev.tasks.data.slice(1), 4 + Math.random() * 14] },
      }));
      setLogCounter((c) => (c >= 3 ? 0 : c + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Append log on counter tick
  useEffect(() => {
    if (logCounter === 0) return;
    const categories: LogEntry['category'][] = ['SYS_CORE', 'NETWORK', 'AI', 'MODULE', 'SECURITY'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const msgs: Record<string, string[]> = {
      SYS_CORE:  [`Heartbeat #${Math.floor(Math.random() * 999)}`, 'Cycle check nominal', 'Pipeline flushed'],
      MODULE:    ['Module health poll ok', 'Dependency graph updated', 'Runtime config reloaded'],
      AI:        ['Inference cycle complete', 'Token buffer flushed', 'Context window optimized'],
      NETWORK:   [`Ping ${Math.floor(Math.random() * 80 + 5)}ms`, 'Packet loss: 0.0%', 'Bandwidth nominal'],
      SECURITY:  ['Certificate rotation ok', 'Rate limit check passed', 'Auth token refreshed'],
    };
    const msg = msgs[cat][Math.floor(Math.random() * msgs[cat].length)];
    setLogs((prev) => [...prev, { id: `log-${Date.now()}`, category: cat, message: msg, timestamp: new Date() }].slice(-50));
  }, [logCounter]);

  // Chart data
  const chartData = useMemo(() => {
    const points = 20;
    const now = Date.now();
    return {
      cpu: Array.from({ length: points }, (_, i) => ({ x: i, y: 30 + Math.sin(i * 0.5 + now * 0.001) * 15 + Math.random() * 10 })),
      memory: Array.from({ length: points }, (_, i) => ({ x: i, y: 50 + Math.cos(i * 0.4 + now * 0.0008) * 10 + Math.random() * 8 })),
      latency: Array.from({ length: points }, (_, i) => ({ x: i, y: 10 + Math.sin(i * 0.6 + now * 0.0012) * 8 + Math.random() * 5 })),
    };
  }, [metrics]);

  const buildPath = useCallback(
    (data: Point[], w: number, h: number, minY = 0, maxY = 100): string => {
      if (!data.length) return '';
      const xStep = w / (data.length - 1);
      return data.map((p, i) => {
        const x = i * xStep;
        const y = h - ((p.y - minY) / (maxY - minY)) * h;
        return `${i === 0 ? 'M' : 'L'} ${x} ${Math.max(0, Math.min(h, y))}`;
      }).join(' ');
    }, []);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-4 space-y-4">

      {/* ── TOP METRICS ROW ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <MetricCard icon={<Cpu className="w-4 h-4" />} label="CPU Load" value={`${Math.round(metrics.cpu.value)}%`}
          trend={metrics.cpu.trend} color="#00D4FF" data={metrics.cpu.data}
          status={metrics.cpu.value > 80 ? 'critical' : metrics.cpu.value > 60 ? 'warning' : 'good'} loading={loading} />
        <MetricCard icon={<Database className="w-4 h-4" />} label="Memory" value={`${Math.round(metrics.memory.value)}%`}
          trend={metrics.memory.trend} color="#8B5CF6" data={metrics.memory.data}
          status={metrics.memory.value > 85 ? 'critical' : metrics.memory.value > 70 ? 'warning' : 'good'} loading={loading} />
        <MetricCard icon={<Wifi className="w-4 h-4" />} label="Network Latency" value={`${Math.round(metrics.latency.value)}ms`}
          trend={metrics.latency.trend} color="#00E58B" data={metrics.latency.data}
          status={metrics.latency.value > 80 ? 'critical' : metrics.latency.value > 40 ? 'warning' : 'good'} loading={loading} />
        <MetricCard icon={<Activity className="w-4 h-4" />} label="Active Tasks" value={`${Math.round(metrics.tasks.value)}`}
          trend={metrics.tasks.trend} color="#FFB020" data={metrics.tasks.data}
          status={metrics.tasks.value > 15 ? 'warning' : 'good'} loading={loading} />
      </motion.div>

      {/* ── MAIN GRID: Session Log | AI Core | Alert + Health ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.05 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <div className="lg:col-span-3">
          <SessionLogPanel logs={logs} loading={loading} />
        </div>
        <div className="lg:col-span-5">
          <AICorePanel metrics={metrics} loading={loading} />
        </div>
        <div className="lg:col-span-4 space-y-4">
          <CriticalAlertCard />
          <SystemHealthPanel healthMetrics={healthMetrics} loading={loading} />
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.1 }}
      >
        <QuickActionsRow />
      </motion.div>

      {/* ── BOTTOM GRID: System Overview + Module Manifest ── */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: 0.15 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-4"
      >
        <div className="lg:col-span-8">
          <SystemOverviewChart
            timeRange={timeRange} setTimeRange={setTimeRange}
            chartData={chartData} buildPath={buildPath} loading={loading}
          />
        </div>
        <div className="lg:col-span-4">
          <ModuleManifestPanel modules={modulesData} loading={loading} />
        </div>
      </motion.div>

      {/* ── STATUS BAR ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.4, delay: 0.2 }}
        className="flex items-center justify-between py-3 px-4 rounded-lg"
        style={{ backgroundColor: 'rgba(13,21,34,0.6)', border: '1px solid var(--border-default)' }}
      >
        <div className="flex items-center gap-4 text-xs font-mono" style={{ color: '#94A3B8' }}>
          <span className="font-semibold" style={{ color: '#E6EDF7' }}>JARVIS Neural Interface {APP_VERSION}</span>
          <span className="hidden sm:inline" style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span className="hidden sm:inline-flex items-center gap-1">
            <Shield className="w-3 h-3" style={{ color: '#00E58B' }} />
            Secure Connection
          </span>
        </div>
        <div className="flex items-center gap-4 text-xs font-mono" style={{ color: '#94A3B8' }}>
          <div className="flex items-center gap-1.5">
            <StatusDot status="stable" />
            <span className="hidden sm:inline">Telemetry: Optimal</span>
          </div>
          <span style={{ color: 'rgba(255,255,255,0.15)' }}>|</span>
          <span className="tabular-nums">
            {new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })} IST
          </span>
        </div>
      </motion.div>
    </div>
  );
};
