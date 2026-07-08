// ==========================================================================
// JARVIS v4.0 — COMP-7: PerformanceChart
// Recharts line/area chart for system metrics
// ==========================================================================

import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from 'recharts';

interface PerformanceChartProps {
  data: Array<{ timestamp: string; value: number }>;
  label: string;
  color?: string;
  yAxisLabel?: string;
  isLoading?: boolean;
  isEmpty?: boolean;
}

function ChartSkeleton() {
  return (
    <div className="glass-panel rounded-xl p-4 animate-pulse">
      <div className="h-4 bg-cyan-900/30 rounded w-24 mb-4" />
      <div className="h-48 bg-cyan-900/10 rounded" />
    </div>
  );
}

function EmptyState() {
  return (
    <div className="glass-panel rounded-xl p-4 flex items-center justify-center h-48">
      <p className="text-sm font-mono text-slate-500">No data available</p>
    </div>
  );
}

export function PerformanceChart({
  data,
  label,
  color = '#00d4ff',
  yAxisLabel,
  isLoading = false,
  isEmpty = false,
}: PerformanceChartProps) {
  if (isLoading) return <ChartSkeleton />;
  if (isEmpty || data.length === 0) return <EmptyState />;

  const formattedData = data.map((d) => ({
    ...d,
    displayTime: new Date(d.timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    }),
  }));

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="font-display font-bold text-sm text-slate-200">{label}</h3>
        {yAxisLabel && (
          <span className="text-[10px] font-mono text-slate-500">{yAxisLabel}</span>
        )}
      </div>

      <div className="h-48">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={formattedData} margin={{ top: 5, right: 5, left: -20, bottom: 5 }}>
            <defs>
              <linearGradient id={`gradient-${label.replace(/\s+/g, '-')}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity={0.3} />
                <stop offset="100%" stopColor={color} stopOpacity={0.02} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="3 3" stroke="rgba(0, 212, 255, 0.05)" />
            <XAxis
              dataKey="displayTime"
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={{ stroke: 'rgba(0, 212, 255, 0.1)' }}
              tickLine={false}
              interval="preserveStartEnd"
            />
            <YAxis
              tick={{ fill: '#64748b', fontSize: 10, fontFamily: 'JetBrains Mono' }}
              axisLine={false}
              tickLine={false}
            />
            <Tooltip
              contentStyle={{
                backgroundColor: 'rgba(10, 22, 40, 0.9)',
                border: '1px solid rgba(0, 212, 255, 0.2)',
                borderRadius: '8px',
                fontSize: '12px',
                fontFamily: 'JetBrains Mono',
              }}
              labelStyle={{ color: '#94a3b8' }}
              itemStyle={{ color }}
            />
            <Area
              type="monotone"
              dataKey="value"
              stroke={color}
              strokeWidth={2}
              fill={`url(#gradient-${label.replace(/\s+/g, '-')})`}
              dot={false}
              activeDot={{ r: 4, fill: color, stroke: 'rgba(0, 0, 0, 0.5)', strokeWidth: 2 }}
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
