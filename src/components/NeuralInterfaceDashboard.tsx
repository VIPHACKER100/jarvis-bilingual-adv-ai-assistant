import React, { FC, useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Activity, AlertTriangle, BarChart3, Bot, Brain,
  Cpu, Database, HardDrive,
  RefreshCw, Scan, Search, Server,
  Settings2, Shield, Terminal, Thermometer, Wifi, Zap, XCircle,
  ArrowUp, ArrowDown, CheckCircle, Radio, CircuitBoard, Pause, Play,
  Gauge, ChevronRight, ChevronDown, MoreHorizontal, Copy,
  Filter, Clock,
} from 'lucide-react';
import { APP_VERSION } from '../config';

interface MetricSnapshot {
  value: number;
  trend: number;
  data: number[];
  status: 'good' | 'warning' | 'critical';
  unit: string;
}

interface DashboardMetrics {
  cpu: MetricSnapshot;
  memory: MetricSnapshot;
  latency: MetricSnapshot;
  tasks: MetricSnapshot;
}

interface SystemAlert {
  id: string;
  type: 'error' | 'warning' | 'info';
  severity: 'critical' | 'high' | 'medium' | 'low';
  title: string;
  message: string;
  timestamp: Date;
  acknowledged: boolean;
  actions?: { label: string; action: string; variant: 'primary' | 'secondary' }[];
}

interface LogEntry {
  id: string;
  category: 'SYS_CORE' | 'MODULE' | 'AI' | 'NETWORK' | 'SECURITY' | 'USER';
  message: string;
  timestamp: Date;
  level: 'info' | 'warn' | 'error' | 'debug';
}

interface ModuleInfo {
  id: string;
  name: string;
  version: string;
  status: 'ONLINE' | 'OFFLINE' | 'DEGRADED' | 'STARTING';
  uptime: string;
  dependencies?: string[];
  errorRate?: number;
  responseTime?: number;
}

interface HealthMetric {
  id: string;
  label: string;
  value: string;
  status: 'good' | 'warning' | 'critical';
  data: number[];
  icon: React.ReactNode;
  unit?: string;
  threshold?: { warning: number; critical: number };
}

interface AIProcessingState {
  status: 'idle' | 'processing' | 'analyzing' | 'responding' | 'error';
  load: number;
  tokensProcessed: number;
  avgResponseTime: number;
  contextWindows: number;
  queueLength: number;
}

interface Point {
  x: number;
  y: number;
}

const sparkline = (len = 8, min = 10, max = 90): number[] =>
  Array.from({ length: len }, () => min + Math.random() * (max - min));

const randomTrend = (): number => (Math.random() - 0.5) * 10;

const initialMetrics = (): DashboardMetrics => ({
  cpu: { 
    value: 42 + Math.random() * 20, 
    trend: -2.4, 
    data: sparkline(8, 20, 80), 
    status: 'good',
    unit: '%' 
  },
  memory: { 
    value: 56 + Math.random() * 15, 
    trend: 3.1, 
    data: sparkline(8, 30, 85), 
    status: 'good',
    unit: '%' 
  },
  latency: { 
    value: 18 + Math.random() * 15, 
    trend: -1.6, 
    data: sparkline(8, 5, 50), 
    status: 'good',
    unit: 'ms' 
  },
  tasks: { 
    value: Math.floor(9 + Math.random() * 8), 
    trend: 0.8, 
    data: sparkline(8, 4, 18), 
    status: 'good',
    unit: '' 
  },
});

const generateAlerts = (): SystemAlert[] => [
  {
    id: 'alert-1',
    type: 'error',
    severity: 'critical',
    title: 'Backend Offline',
    message: 'Connection to backend services lost. Last heartbeat received 2 minutes ago.',
    timestamp: new Date(Date.now() - 120000),
    acknowledged: false,
    actions: [
      { label: 'Reconnect', action: 'reconnect', variant: 'primary' },
      { label: 'View Logs', action: 'logs', variant: 'secondary' },
    ],
  },
  {
    id: 'alert-2',
    type: 'warning',
    severity: 'medium',
    title: 'High Memory Usage',
    message: 'Memory usage has exceeded 80% for the past 10 minutes.',
    timestamp: new Date(Date.now() - 600000),
    acknowledged: false,
    actions: [
      { label: 'Optimize', action: 'optimize', variant: 'primary' },
    ],
  },
];

const generateLogs = (): LogEntry[] => {
  const now = Date.now();
  return [
    { id: 'l1', category: 'SYS_CORE', level: 'info', message: 'Neural Interface initialization complete', timestamp: new Date(now - 15000) },
    { id: 'l2', category: 'MODULE', level: 'info', message: 'Vision Processing Module v4.2 loaded', timestamp: new Date(now - 12000) },
    { id: 'l3', category: 'AI', level: 'info', message: 'Language Model connected (GPT-4 Turbo)', timestamp: new Date(now - 9000) },
    { id: 'l4', category: 'SECURITY', level: 'info', message: 'SSL handshake completed, 256-bit encryption active', timestamp: new Date(now - 6000) },
    { id: 'l5', category: 'NETWORK', level: 'info', message: 'WebSocket bridge established on port 8000', timestamp: new Date(now - 3000) },
    { id: 'l6', category: 'SYS_CORE', level: 'info', message: 'Telemetry pipeline synchronized', timestamp: new Date(now) },
  ];
};

const categoryStyle: Record<string, { color: string; bg: string; label: string }> = {
  SYS_CORE:  { color: '#8B5CF6', bg: 'rgba(139,92,246,0.12)', label: 'SYS_CORE' },
  MODULE:    { color: '#00D4FF', bg: 'rgba(0,212,255,0.10)',  label: 'MODULE' },
  AI:        { color: '#5E6AD2', bg: 'rgba(94,106,210,0.12)', label: 'AI' },
  NETWORK:   { color: '#00E58B', bg: 'rgba(0,229,139,0.10)',  label: 'NETWORK' },
  SECURITY:  { color: '#FFB020', bg: 'rgba(255,176,32,0.10)', label: 'SECURITY' },
  USER:      { color: '#FF4D67', bg: 'rgba(255,77,103,0.10)', label: 'USER' },
};

const levelStyle: Record<string, { color: string; icon: React.ReactNode }> = {
  info:  { color: '#00E58B', icon: <CheckCircle className="w-3 h-3" /> },
  warn:  { color: '#FFB020', icon: <AlertTriangle className="w-3 h-3" /> },
  error: { color: '#FF4D67', icon: <XCircle className="w-3 h-3" /> },
  debug: { color: '#94A3B8', icon: <Settings2 className="w-3 h-3" /> },
};

const modulesData: ModuleInfo[] = [
  { 
    id: 'm1', 
    name: 'Vision Overlay', 
    version: 'v4.2', 
    status: 'ONLINE', 
    uptime: '2h 45m',
    dependencies: ['Camera Driver', 'OpenCV'],
    errorRate: 0.02,
    responseTime: 15
  },
  { 
    id: 'm2', 
    name: 'Neural Core', 
    version: 'v4.0', 
    status: 'ONLINE', 
    uptime: '14h 12m',
    dependencies: ['PyTorch', 'CUDA'],
    errorRate: 0.001,
    responseTime: 8
  },
  { 
    id: 'm3', 
    name: 'Threat Monitor', 
    version: 'v3.8', 
    status: 'OFFLINE', 
    uptime: '0m',
    dependencies: ['Security DB', 'ML Model'],
    errorRate: 0,
    responseTime: 0
  },
  { 
    id: 'm4', 
    name: 'Data Optimizer', 
    version: 'v2.1', 
    status: 'DEGRADED', 
    uptime: '6h 30m',
    dependencies: ['Cache Layer'],
    errorRate: 0.15,
    responseTime: 45
  },
  { 
    id: 'm5', 
    name: 'Voice Synthesis', 
    version: 'v3.5', 
    status: 'STARTING', 
    uptime: '0m',
    dependencies: ['Audio Driver', 'TTS Engine'],
    errorRate: 0,
    responseTime: 0
  },
];

const healthData: HealthMetric[] = [
  { 
    id: 'h1', 
    label: 'Core Temperature', 
    value: '68°C', 
    status: 'good', 
    data: sparkline(6, 55, 75), 
    icon: <Thermometer className="w-4 h-4" />,
    unit: '°C',
    threshold: { warning: 75, critical: 85 }
  },
  { 
    id: 'h2', 
    label: 'Sync Status', 
    value: '98.2%', 
    status: 'good', 
    data: sparkline(6, 90, 100), 
    icon: <RefreshCw className="w-4 h-4" />,
    unit: '%',
    threshold: { warning: 90, critical: 80 }
  },
  { 
    id: 'h3', 
    label: 'Disk I/O', 
    value: '340MB/s', 
    status: 'warning', 
    data: sparkline(6, 100, 500), 
    icon: <HardDrive className="w-4 h-4" />,
    unit: 'MB/s',
    threshold: { warning: 300, critical: 450 }
  },
  { 
    id: 'h4', 
    label: 'Power Draw', 
    value: '147W', 
    status: 'good', 
    data: sparkline(6, 100, 180), 
    icon: <Zap className="w-4 h-4" />,
    unit: 'W',
    threshold: { warning: 160, critical: 200 }
  },
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

/* ── Enhanced Session Log Panel ── */

const SessionLogPanel: FC<{ 
  logs: LogEntry[]; 
  loading?: boolean;
  onCopy?: (entry: LogEntry) => void;
}> = ({ logs, loading, onCopy }) => {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [filterCategory, setFilterCategory] = useState<string>('');
  const [filterLevel, setFilterLevel] = useState<string>('');
  const [isAutoScroll, setIsAutoScroll] = useState(true);

  useEffect(() => {
    if (scrollRef.current && isAutoScroll) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [logs, isAutoScroll]);

  const filteredLogs = logs.filter(log => {
    if (filterCategory && log.category !== filterCategory) return false;
    if (filterLevel && log.level !== filterLevel) return false;
    return true;
  });

  if (loading) {
    return (
      <div className="glass-panel flex flex-col overflow-hidden" style={{ minHeight: 320 }}>
        <div className="flex items-center justify-between px-4 py-3 border-b border-border">
          <Skeleton className="h-5 w-32" />
          <Skeleton className="h-5 w-5 rounded" />
        </div>
        <div className="flex-1 p-4 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
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
    <div className="glass-panel flex flex-col overflow-hidden" style={{ minHeight: 320 }}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <div className="flex items-center gap-2">
          <Terminal className="w-4 h-4 text-primary" />
          <h2 className="text-sm font-semibold text-text-primary">Session Log</h2>
          <span className="text-xs text-text-secondary">
            ({filteredLogs.length} entries)
          </span>
        </div>
        <div className="flex items-center gap-2">
          <button 
            className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" 
            title="Filter logs"
            onClick={() => {/* Open filter menu */}}
          >
            <Filter className="w-3.5 h-3.5 text-text-secondary" />
          </button>
          <button 
            className="p-1.5 rounded-md hover:bg-surface-hover transition-colors" 
            title="Search logs"
          >
            <Search className="w-3.5 h-3.5 text-text-secondary" />
          </button>
          <button
            onClick={() => setIsAutoScroll(!isAutoScroll)}
            className={`p-1.5 rounded-md transition-colors ${
              isAutoScroll ? 'bg-primary/20 text-primary' : 'hover:bg-surface-hover text-text-secondary'
            }`}
            title={isAutoScroll ? 'Disable auto-scroll' : 'Enable auto-scroll'}
          >
            {isAutoScroll ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          </button>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-success animate-pulse" />
            <span className="text-xs text-success font-medium">LIVE</span>
          </div>
        </div>
      </div>

      {/* Log Content */}
      <div 
        ref={scrollRef} 
        className="flex-1 overflow-y-auto px-4 py-2 space-y-0.5 font-mono text-sm"
        style={{ maxHeight: 280 }}
      >
        {filteredLogs.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-8 text-center">
            <Terminal className="w-8 h-8 text-text-secondary mb-2" />
            <span className="text-sm text-text-secondary">No log entries match filter</span>
          </div>
        ) : (
          <AnimatePresence initial={false}>
            {filteredLogs.map((entry) => {
              const categoryStyles = categoryStyle[entry.category];
              const levelIcon = levelStyle[entry.level];
              
              return (
                <motion.div
                  key={entry.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ duration: 0.2 }}
                  className="group flex items-start gap-2 py-1.5 px-2 rounded hover:bg-surface-low transition-colors"
                >
                  {/* Timestamp */}
                  <span className="text-xs text-text-secondary shrink-0 w-20 mt-0.5">
                    {entry.timestamp.toLocaleTimeString([], { 
                      hour12: false, 
                      hour: '2-digit', 
                      minute: '2-digit', 
                      second: '2-digit',
                      fractionalSecondDigits: 3
                    })}
                  </span>

                  {/* Level Icon */}
                  <div className="shrink-0 mt-0.5" style={{ color: levelIcon.color }}>
                    {levelIcon.icon}
                  </div>

                  {/* Category Badge */}
                  <span 
                    className="text-xs font-bold shrink-0 px-1.5 py-0.5 rounded mt-0.5" 
                    style={{ 
                      color: categoryStyles.color,
                      backgroundColor: categoryStyles.bg
                    }}
                  >
                    {categoryStyles.label}
                  </span>

                  {/* Message */}
                  <span className="text-sm flex-1 text-text-primary break-words">
                    {entry.message}
                  </span>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 transition-opacity shrink-0 flex gap-1">
                    <button
                      onClick={() => onCopy?.(entry)}
                      className="p-1 rounded hover:bg-surface-hover transition-colors"
                      title="Copy log entry"
                    >
                      <Copy className="w-3 h-3 text-text-secondary" />
                    </button>
                    <button
                      className="p-1 rounded hover:bg-surface-hover transition-colors"
                      title="More actions"
                    >
                      <MoreHorizontal className="w-3 h-3 text-text-secondary" />
                    </button>
                  </div>
                </motion.div>
              );
            })}
          </AnimatePresence>
        )}
      </div>

      {/* Footer */}
      <div className="px-4 py-2 flex items-center justify-between border-t border-border bg-background-elevated/50">
        <div className="flex items-center gap-3 text-xs">
          {/* Category Filter */}
          <select 
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="bg-transparent border border-border rounded px-2 py-1 text-text-secondary"
          >
            <option value="">All Categories</option>
            {Object.keys(categoryStyle).map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
          
          {/* Level Filter */}
          <select 
            value={filterLevel}
            onChange={(e) => setFilterLevel(e.target.value)}
            className="bg-transparent border border-border rounded px-2 py-1 text-text-secondary"
          >
            <option value="">All Levels</option>
            <option value="info">Info</option>
            <option value="warn">Warning</option>
            <option value="error">Error</option>
            <option value="debug">Debug</option>
          </select>
        </div>

        <div className="text-xs text-text-secondary">
          Showing {filteredLogs.length} of {logs.length} entries
        </div>
      </div>
    </div>
  );
};

/* ── Enhanced AI Core Panel with HUD Visualization ── */

const AICoreCentralHUD: FC<{ 
  metrics: DashboardMetrics; 
  aiState: AIProcessingState;
  loading?: boolean 
}> = ({ metrics, aiState, loading }) => {
  const [rotation, setRotation] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation(prev => prev + 0.5);
    }, 50);
    return () => clearInterval(interval);
  }, []);

  if (loading) {
    return (
      <div className="glass-panel p-8 flex items-center justify-center" style={{ minHeight: 320 }}>
        <div className="flex flex-col items-center gap-4">
          <div className="w-32 h-32 rounded-full border-4 border-primary/20 border-t-primary animate-spin" />
          <span className="text-sm font-mono text-text-secondary">Initializing Neural Core...</span>
        </div>
      </div>
    );
  }

  const coreRadius = 120;
  const ringCount = 4;
  const statusColor = aiState.status === 'error' ? '#FF4D67' : 
                     aiState.status === 'processing' ? '#FFB020' : '#00E58B';

  return (
    <div className="glass-panel p-6 relative overflow-hidden" style={{ minHeight: 320 }}>
      {/* Background Glow Effect */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          background: `radial-gradient(circle at center, ${statusColor} 0%, transparent 70%)`,
        }}
      />

      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg" style={{ backgroundColor: 'rgba(0,212,255,0.12)' }}>
            <Brain className="w-6 h-6 text-primary" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-text-primary">AI CORE</h2>
            <div className="flex items-center gap-2 text-sm">
              <div 
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ backgroundColor: statusColor }}
              />
              <span style={{ color: statusColor }} className="font-semibold uppercase">
                {aiState.status}
              </span>
            </div>
          </div>
        </div>
        
        <div className="text-right">
          <div className="text-xs text-text-secondary">System Load</div>
          <div className="text-lg font-mono font-bold text-text-primary">
            {Math.round(aiState.load)}%
          </div>
        </div>
      </div>

      {/* Central HUD Visualization */}
      <div className="flex items-center justify-center mb-6">
        <div className="relative" style={{ width: coreRadius * 2, height: coreRadius * 2 }}>
          {/* Animated Rings */}
          {Array.from({ length: ringCount }, (_, i) => {
            const ringRadius = 30 + (i * 20);
            const opacity = 0.1 + (i * 0.05);
            return (
              <motion.div
                key={i}
                className="absolute inset-0 rounded-full border"
                style={{
                  width: ringRadius * 2,
                  height: ringRadius * 2,
                  top: '50%',
                  left: '50%',
                  transform: `translate(-50%, -50%) rotate(${rotation * (1 + i * 0.3)}deg)`,
                  borderColor: statusColor,
                  borderWidth: 1,
                  opacity: opacity,
                }}
                animate={{
                  scale: [1, 1.05, 1],
                  opacity: [opacity * 0.5, opacity, opacity * 0.5],
                }}
                transition={{
                  duration: 3 + i,
                  repeat: Infinity,
                  repeatType: "reverse",
                }}
              />
            );
          })}

          {/* Core Circle */}
          <div 
            className="absolute inset-0 rounded-full flex items-center justify-center"
            style={{
              width: 80,
              height: 80,
              top: '50%',
              left: '50%',
              transform: 'translate(-50%, -50%)',
              background: `radial-gradient(circle, ${statusColor}20 0%, ${statusColor}10 50%, transparent 100%)`,
              border: `2px solid ${statusColor}`,
              boxShadow: `0 0 20px ${statusColor}40`,
            }}
          >
            <motion.div
              animate={{ 
                scale: [1, 1.1, 1],
                rotate: [0, 360],
              }}
              transition={{
                scale: { duration: 2, repeat: Infinity, repeatType: "reverse" },
                rotate: { duration: 10, repeat: Infinity, ease: "linear" },
              }}
            >
              <Bot className="w-8 h-8" style={{ color: statusColor }} />
            </motion.div>
          </div>

          {/* Data Points */}
          {[
            { angle: 0, label: 'CPU', value: `${Math.round(metrics.cpu.value)}%`, color: '#00D4FF' },
            { angle: 90, label: 'MEM', value: `${Math.round(metrics.memory.value)}%`, color: '#8B5CF6' },
            { angle: 180, label: 'LAT', value: `${Math.round(metrics.latency.value)}ms`, color: '#00E58B' },
            { angle: 270, label: 'PROC', value: `${aiState.tokensProcessed}k`, color: '#FFB020' },
          ].map((point, i) => {
            const x = Math.cos((point.angle - 90) * Math.PI / 180) * 90;
            const y = Math.sin((point.angle - 90) * Math.PI / 180) * 90;
            return (
              <div
                key={i}
                className="absolute flex flex-col items-center gap-1"
                style={{
                  left: '50%',
                  top: '50%',
                  transform: `translate(calc(-50% + ${x}px), calc(-50% + ${y}px))`,
                }}
              >
                <div 
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: point.color, boxShadow: `0 0 8px ${point.color}` }}
                />
                <div className="text-center">
                  <div className="text-xs font-mono text-text-secondary">{point.label}</div>
                  <div 
                    className="text-xs font-mono font-bold"
                    style={{ color: point.color }}
                  >
                    {point.value}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Status Indicators */}
      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Response Time</span>
            <span className="text-sm font-mono text-text-primary">{aiState.avgResponseTime}ms</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Context Windows</span>
            <span className="text-sm font-mono text-text-primary">{aiState.contextWindows}</span>
          </div>
        </div>
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Queue Length</span>
            <span className="text-sm font-mono text-text-primary">{aiState.queueLength}</span>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-xs text-text-secondary">Tokens/sec</span>
            <span className="text-sm font-mono text-text-primary">{Math.round(aiState.tokensProcessed / 60)}</span>
          </div>
        </div>
      </div>

      {/* System Status */}
      <div className="flex items-center justify-center mt-4 pt-4 border-t border-border">
        <div className="flex items-center gap-2">
          <CheckCircle className="w-4 h-4 text-success" />
          <span className="text-sm font-medium text-success">SYSTEM STABLE</span>
        </div>
      </div>
    </div>
  );
};

/* ── Enhanced Critical Alerts Panel ── */

const CriticalAlertsPanel: FC<{ 
  alerts: SystemAlert[];
  onAcknowledge: (id: string) => void;
  onAction: (alertId: string, action: string) => void;
  loading?: boolean;
}> = ({ alerts, onAcknowledge, onAction, loading }) => {
  const [expandedAlert, setExpandedAlert] = useState<string | null>(null);

  if (loading) {
    return (
      <div className="glass-panel p-4">
        <div className="flex items-center gap-2 mb-3">
          <Skeleton className="h-5 w-5 rounded" />
          <Skeleton className="h-5 w-32" />
        </div>
        {[1, 2].map(i => (
          <div key={i} className="p-3 rounded-lg border mb-3">
            <div className="flex items-start gap-3">
              <Skeleton className="h-8 w-8 rounded-lg" />
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-full" />
                <Skeleton className="h-3 w-3/4" />
              </div>
            </div>
          </div>
        ))}
      </div>
    );
  }

  const criticalAlerts = alerts.filter(alert => !alert.acknowledged);
  const hasCritical = criticalAlerts.some(alert => alert.severity === 'critical');

  return (
    <div className="glass-panel p-4 overflow-hidden">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <AlertTriangle 
            className="w-5 h-5" 
            style={{ color: hasCritical ? '#FF4D67' : '#FFB020' }} 
          />
          <h3 className="text-sm font-semibold text-text-primary">
            Critical Alerts
          </h3>
          {criticalAlerts.length > 0 && (
            <span 
              className="px-2 py-0.5 rounded-full text-xs font-bold"
              style={{ 
                backgroundColor: hasCritical ? '#FF4D67' : '#FFB020',
                color: '#050A12'
              }}
            >
              {criticalAlerts.length}
            </span>
          )}
        </div>
        <button 
          className="p-1 rounded hover:bg-surface-hover transition-colors"
          title="Acknowledge all alerts"
        >
          <CheckCircle className="w-4 h-4 text-text-secondary" />
        </button>
      </div>

      <div className="space-y-2 max-h-64 overflow-y-auto">
        {criticalAlerts.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-6 text-center">
            <Shield className="w-8 h-8 text-success mb-2" />
            <span className="text-sm text-success font-medium">All Systems Operational</span>
            <span className="text-xs text-text-secondary mt-1">No active alerts</span>
          </div>
        ) : (
          criticalAlerts.map(alert => {
            const isExpanded = expandedAlert === alert.id;
            const severityColor = alert.severity === 'critical' ? '#FF4D67' : 
                                 alert.severity === 'high' ? '#FFB020' : '#00D4FF';
            
            return (
              <motion.div
                key={alert.id}
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                className="rounded-lg border p-3 transition-colors hover:bg-surface-low"
                style={{ borderColor: `${severityColor}35` }}
              >
                <div className="flex items-start gap-3">
                  <div 
                    className="p-2 rounded-lg shrink-0"
                    style={{ backgroundColor: `${severityColor}12` }}
                  >
                    {alert.type === 'error' && <XCircle className="w-4 h-4" style={{ color: severityColor }} />}
                    {alert.type === 'warning' && <AlertTriangle className="w-4 h-4" style={{ color: severityColor }} />}
                    {alert.type === 'info' && <CheckCircle className="w-4 h-4" style={{ color: severityColor }} />}
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="text-sm font-semibold text-text-primary">{alert.title}</h4>
                        <p className="text-xs text-text-secondary mt-0.5 line-clamp-2">
                          {alert.message}
                        </p>
                      </div>
                      <div className="flex items-center gap-1 ml-2">
                        <button
                          onClick={() => setExpandedAlert(isExpanded ? null : alert.id)}
                          className="p-1 rounded hover:bg-surface-hover transition-colors"
                        >
                          {isExpanded ? 
                            <ChevronDown className="w-3 h-3 text-text-secondary" /> :
                            <ChevronRight className="w-3 h-3 text-text-secondary" />
                          }
                        </button>
                        <button
                          onClick={() => onAcknowledge(alert.id)}
                          className="p-1 rounded hover:bg-surface-hover transition-colors"
                          title="Acknowledge alert"
                        >
                          <XCircle className="w-3 h-3 text-text-secondary" />
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between mt-2">
                      <div className="flex items-center gap-2 text-xs text-text-secondary">
                        <Clock className="w-3 h-3" />
                        <span>{alert.timestamp.toLocaleTimeString()}</span>
                        <span 
                          className="px-1.5 py-0.5 rounded text-xs font-bold uppercase"
                          style={{ 
                            backgroundColor: `${severityColor}20`,
                            color: severityColor 
                          }}
                        >
                          {alert.severity}
                        </span>
                      </div>
                    </div>

                    <AnimatePresence>
                      {isExpanded && alert.actions && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: 'auto', opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          className="mt-3 pt-3 border-t border-border overflow-hidden"
                        >
                          <div className="flex gap-2">
                            {alert.actions.map((action, idx) => (
                              <button
                                key={idx}
                                onClick={() => onAction(alert.id, action.action)}
                                className={`px-3 py-1.5 rounded text-xs font-semibold transition-all duration-200 ${
                                  action.variant === 'primary'
                                    ? 'bg-primary text-background hover:brightness-110'
                                    : 'border border-border text-text-secondary hover:bg-surface-hover'
                                }`}
                              >
                                {action.label}
                              </button>
                            ))}
                          </div>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                </div>
              </motion.div>
            );
          })
        )}
      </div>
    </div>
  );
};

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
  const [alerts, setAlerts] = useState<SystemAlert[]>(generateAlerts);
  const [logCounter, setLogCounter] = useState(0);
  const [healthMetrics] = useState<HealthMetric[]>(healthData);
  const [loading, setLoading] = useState(true);
  const [aiState, setAiState] = useState<AIProcessingState>({
    status: 'idle',
    load: 35,
    tokensProcessed: 2847,
    avgResponseTime: 142,
    contextWindows: 3,
    queueLength: 0,
  });

  // Simulate initial loading
  useEffect(() => {
    const timer = setTimeout(() => setLoading(false), 800);
    return () => clearTimeout(timer);
  }, []);

  // Live update every 2.5s
  useEffect(() => {
    const interval = setInterval(() => {
      // Update metrics with better status calculation
      setMetrics((prev) => {
        const newCpu = Math.min(95, Math.max(10, prev.cpu.value + (Math.random() - 0.5) * 8));
        const newMemory = Math.min(95, Math.max(20, prev.memory.value + (Math.random() - 0.5) * 5));
        const newLatency = Math.min(150, Math.max(2, prev.latency.value + (Math.random() - 0.5) * 6));
        const newTasks = Math.min(20, Math.max(2, prev.tasks.value + (Math.random() - 0.5) * 3));

        return {
          cpu: { 
            ...prev.cpu, 
            value: newCpu, 
            trend: randomTrend(), 
            data: [...prev.cpu.data.slice(1), 20 + Math.random() * 60],
            status: newCpu > 80 ? 'critical' : newCpu > 60 ? 'warning' : 'good'
          },
          memory: { 
            ...prev.memory, 
            value: newMemory, 
            trend: randomTrend(), 
            data: [...prev.memory.data.slice(1), 30 + Math.random() * 50],
            status: newMemory > 85 ? 'critical' : newMemory > 70 ? 'warning' : 'good'
          },
          latency: { 
            ...prev.latency, 
            value: newLatency, 
            trend: randomTrend(), 
            data: [...prev.latency.data.slice(1), 5 + Math.random() * 30],
            status: newLatency > 80 ? 'critical' : newLatency > 40 ? 'warning' : 'good'
          },
          tasks: { 
            ...prev.tasks, 
            value: newTasks, 
            trend: randomTrend(), 
            data: [...prev.tasks.data.slice(1), 4 + Math.random() * 14],
            status: newTasks > 15 ? 'warning' : 'good'
          },
        };
      });

      // Update AI state
      setAiState(prev => ({
        ...prev,
        load: Math.min(95, Math.max(5, prev.load + (Math.random() - 0.5) * 10)),
        tokensProcessed: prev.tokensProcessed + Math.floor(Math.random() * 50),
        avgResponseTime: Math.min(500, Math.max(50, prev.avgResponseTime + (Math.random() - 0.5) * 30)),
        queueLength: Math.max(0, prev.queueLength + Math.floor((Math.random() - 0.7) * 3)),
      }));

      setLogCounter((c) => (c >= 3 ? 0 : c + 1));
    }, 2500);
    return () => clearInterval(interval);
  }, []);

  // Generate new logs periodically
  useEffect(() => {
    if (logCounter === 0) return;
    const categories: LogEntry['category'][] = ['SYS_CORE', 'NETWORK', 'AI', 'MODULE', 'SECURITY', 'USER'];
    const levels: LogEntry['level'][] = ['info', 'warn', 'error', 'debug'];
    const cat = categories[Math.floor(Math.random() * categories.length)];
    const level = levels[Math.floor(Math.random() * levels.length)];
    
    const msgs: Record<string, string[]> = {
      SYS_CORE:  [`Heartbeat #${Math.floor(Math.random() * 9999)}`, 'System cycle check nominal', 'Memory cleanup completed'],
      MODULE:    ['Module health check passed', 'Dependency graph updated', 'Configuration reloaded'],
      AI:        ['Inference batch completed', 'Context window optimized', 'Model weights synchronized'],
      NETWORK:   [`RTT ${Math.floor(Math.random() * 50 + 10)}ms`, 'Bandwidth: 1.2Gbps', 'Connection pool refreshed'],
      SECURITY:  ['Certificate validation passed', 'Rate limit: 450/500 req/min', 'Access token renewed'],
      USER:      ['Voice command processed', 'UI interaction logged', 'Preference updated'],
    };
    
    const msg = msgs[cat][Math.floor(Math.random() * msgs[cat].length)];
    const newLog: LogEntry = { 
      id: `log-${Date.now()}-${Math.random()}`, 
      category: cat, 
      level, 
      message: msg, 
      timestamp: new Date() 
    };
    
    setLogs((prev) => [...prev, newLog].slice(-100)); // Keep last 100 logs
  }, [logCounter]);

  // Chart data generation
  const chartData = useMemo(() => {
    const points = 24;
    const now = Date.now();
    return {
      cpu: Array.from({ length: points }, (_, i) => ({ 
        x: i, 
        y: 30 + Math.sin(i * 0.5 + now * 0.001) * 15 + Math.random() * 10 
      })),
      memory: Array.from({ length: points }, (_, i) => ({ 
        x: i, 
        y: 50 + Math.cos(i * 0.4 + now * 0.0008) * 10 + Math.random() * 8 
      })),
      latency: Array.from({ length: points }, (_, i) => ({ 
        x: i, 
        y: 10 + Math.sin(i * 0.6 + now * 0.0012) * 8 + Math.random() * 5 
      })),
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

  // Alert handlers
  const handleAcknowledgeAlert = useCallback((id: string) => {
    setAlerts(prev => prev.map(alert => 
      alert.id === id ? { ...alert, acknowledged: true } : alert
    ));
  }, []);

  const handleAlertAction = useCallback((alertId: string, action: string) => {
    console.log(`Executing action ${action} for alert ${alertId}`);
    // Implement specific actions based on the action type
    if (action === 'reconnect') {
      // Simulate reconnection attempt
      setAlerts(prev => prev.filter(alert => alert.id !== alertId));
    }
  }, []);

  const handleCopyLog = useCallback((entry: LogEntry) => {
    const logText = `[${entry.timestamp.toISOString()}] [${entry.category}] [${entry.level.toUpperCase()}] ${entry.message}`;
    navigator.clipboard.writeText(logText);
  }, []);

  return (
    <div className="w-full max-w-[1440px] mx-auto px-4 md:px-6 lg:px-8 py-6 space-y-6">

      {/* ── TOP METRICS ROW ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4"
      >
        <MetricCard 
          icon={<Cpu className="w-5 h-5" />} 
          label="CPU Load" 
          value={`${Math.round(metrics.cpu.value)}%`}
          trend={metrics.cpu.trend} 
          color="#00D4FF" 
          data={metrics.cpu.data}
          status={metrics.cpu.status} 
          loading={loading} 
        />
        <MetricCard 
          icon={<Database className="w-5 h-5" />} 
          label="Memory" 
          value={`${Math.round(metrics.memory.value)}%`}
          trend={metrics.memory.trend} 
          color="#8B5CF6" 
          data={metrics.memory.data}
          status={metrics.memory.status} 
          loading={loading} 
        />
        <MetricCard 
          icon={<Wifi className="w-5 h-5" />} 
          label="Network Latency" 
          value={`${Math.round(metrics.latency.value)}ms`}
          trend={metrics.latency.trend} 
          color="#00E58B" 
          data={metrics.latency.data}
          status={metrics.latency.status} 
          loading={loading} 
        />
        <MetricCard 
          icon={<Activity className="w-5 h-5" />} 
          label="Active Tasks" 
          value={`${Math.round(metrics.tasks.value)}`}
          trend={metrics.tasks.trend} 
          color="#FFB020" 
          data={metrics.tasks.data}
          status={metrics.tasks.status} 
          loading={loading} 
        />
      </motion.div>

      {/* ── CENTER HERO SECTION: AI Core ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.1 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* Session Log */}
        <div className="lg:col-span-4">
          <SessionLogPanel 
            logs={logs} 
            loading={loading}
            onCopy={handleCopyLog}
          />
        </div>
        
        {/* AI Core HUD */}
        <div className="lg:col-span-4">
          <AICoreCentralHUD 
            metrics={metrics}
            aiState={aiState}
            loading={loading}
          />
        </div>

        {/* Right Panel: Alerts + Health */}
        <div className="lg:col-span-4 space-y-4">
          <CriticalAlertsPanel 
            alerts={alerts}
            onAcknowledge={handleAcknowledgeAlert}
            onAction={handleAlertAction}
            loading={loading}
          />
          <SystemHealthPanel 
            healthMetrics={healthMetrics} 
            loading={loading} 
          />
        </div>
      </motion.div>

      {/* ── QUICK ACTIONS ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.2 }}
      >
        <QuickActionsRow />
      </motion.div>

      {/* ── BOTTOM SECTION: Charts + Modules ── */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6, delay: 0.3 }}
        className="grid grid-cols-1 lg:grid-cols-12 gap-6"
      >
        {/* System Overview Chart */}
        <div className="lg:col-span-8">
          <SystemOverviewChart
            timeRange={timeRange} 
            setTimeRange={setTimeRange}
            chartData={chartData} 
            buildPath={buildPath} 
            loading={loading}
          />
        </div>
        
        {/* Module Manifest */}
        <div className="lg:col-span-4">
          <ModuleManifestPanel 
            modules={modulesData} 
            loading={loading} 
          />
        </div>
      </motion.div>

      {/* ── ENHANCED STATUS BAR ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 0.6, delay: 0.4 }}
        className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 py-4 px-6 rounded-xl"
        style={{ 
          backgroundColor: 'rgba(13,21,34,0.8)', 
          border: '1px solid rgba(255,255,255,0.08)',
          backdropFilter: 'blur(12px)'
        }}
      >
        <div className="flex items-center gap-6 text-sm font-mono">
          <div className="flex items-center gap-2">
            <CircuitBoard className="w-4 h-4 text-primary" />
            <span className="font-semibold text-text-primary">JARVIS Neural Interface {APP_VERSION}</span>
          </div>
          <div className="hidden sm:flex items-center gap-2">
            <Shield className="w-3 h-3 text-success" />
            <span className="text-success">Secure Connection</span>
          </div>
          <div className="hidden md:flex items-center gap-2">
            <Gauge className="w-3 h-3 text-warning" />
            <span className="text-text-secondary">
              Load: <span className="text-warning">{Math.round(aiState.load)}%</span>
            </span>
          </div>
        </div>
        
        <div className="flex items-center gap-6 text-sm font-mono">
          <div className="flex items-center gap-2">
            <StatusDot status="stable" />
            <span className="text-success">Telemetry: Optimal</span>
          </div>
          <div className="flex items-center gap-2">
            <Clock className="w-3 h-3 text-text-secondary" />
            <span className="text-text-secondary tabular-nums">
              {new Date().toLocaleTimeString([], { 
                hour: '2-digit', 
                minute: '2-digit', 
                second: '2-digit',
                hour12: false 
              })} UTC
            </span>
          </div>
        </div>
      </motion.div>
    </div>
  );
};
