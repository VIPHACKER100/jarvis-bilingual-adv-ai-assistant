import { FC, useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { BarChart2, Clock, TrendingUp, AlertCircle } from 'lucide-react';
import { apiClient } from '../services/apiClient';

interface TopCommand {
  command_type: string;
  count: number;
}

interface DayActivity {
  day: string;
  count: number;
}

interface InsightsData {
  top_commands: TopCommand[];
  daily_activity: DayActivity[];
  peak_hour: { hour: number | null; count: number };
  failure_patterns: { command_type: string; failures: number; total: number }[];
  period_days: number;
}

export const CommandInsights: FC = () => {
  const [insights, setInsights] = useState<InsightsData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInsights = async () => {
      try {
        const res = await apiClient.getCommandInsights(30);
        if (res.success && res.data) {
          setInsights(res.data);
        }
      } catch {

        /* silent — panel just won't render */
      } finally {
        setLoading(false);
      }
    };

    fetchInsights();
    // Refresh every 5 minutes
    const interval = setInterval(fetchInsights, 5 * 60 * 1000);
    return () => clearInterval(interval);
  }, []);

  if (loading || !insights || !insights.top_commands || insights.top_commands.length === 0) return null;

  const maxCount = Math.max(...insights.top_commands.map(c => c.count), 1);
  const maxDay = Math.max(...(insights.daily_activity?.map(d => d.count) ?? [1]), 1);

  const formatHour = (h: number | null) => {
    if (h === null) return '—';
    const ampm = h < 12 ? 'AM' : 'PM';
    const h12 = h % 12 || 12;
    return `${h12}:00 ${ampm}`;
  };

  const shortLabel = (cmd: string) =>
    cmd.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()).slice(0, 12);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="glass-panel p-4 space-y-4"
    >
      {/* Header */}
      <div className="flex items-center gap-2">
        <BarChart2 className="w-3.5 h-3.5 text-accent" />
        <span className="text-[9px] font-bold uppercase tracking-[0.2em] text-foreground-muted">
          Command_Analytics
        </span>
        <div className="h-px flex-1 bg-border-default" />
        <span className="text-[7px] font-mono text-foreground-muted opacity-50">
          30d
        </span>
      </div>

      {/* Top Commands Bars */}
      <div className="space-y-2">
        {insights.top_commands.slice(0, 5).map((cmd, i) => (
          <div key={cmd.command_type} className="space-y-0.5">
            <div className="flex justify-between items-center">
              <span className="text-[9px] font-mono text-foreground-muted truncate">
                {shortLabel(cmd.command_type)}
              </span>
              <span className="text-[8px] font-mono text-accent ml-2 shrink-0">
                {cmd.count}x
              </span>
            </div>
            <div className="h-1 bg-white/5 rounded-full overflow-hidden">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${(cmd.count / maxCount) * 100}%` }}
                transition={{ duration: 1, delay: i * 0.1, ease: 'easeOut' }}
                className="h-full rounded-full"
                style={{
                  background: `linear-gradient(90deg, var(--accent) 0%, var(--accent) 60%, transparent 100%)`,
                  opacity: 1 - i * 0.12,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      {/* 7-day Activity Sparkline */}
      {insights.daily_activity?.length > 0 && (
        <div className="pt-3 border-t border-border-default">
          <div className="flex items-center gap-2 mb-2">
            <TrendingUp className="w-3 h-3 text-foreground-muted" />
            <span className="text-[7px] uppercase tracking-widest text-foreground-muted font-bold">
              7d_Activity
            </span>
          </div>
          <div className="flex items-end gap-1 h-10">
            {insights.daily_activity.map((d, i) => (
              <motion.div
                key={d.day}
                initial={{ scaleY: 0 }}
                animate={{ scaleY: 1 }}
                transition={{ duration: 0.6, delay: i * 0.06, ease: 'backOut' }}
                style={{
                  originY: 1,
                  height: `${Math.max(8, (d.count / maxDay) * 100)}%`,
                  background: 'var(--accent)',
                  opacity: 0.3 + (i / insights.daily_activity.length) * 0.7,
                }}
                className="flex-1 rounded-t"
                title={`${d.day}: ${d.count}`}
              />
            ))}
          </div>
        </div>
      )}

      {/* Peak Hour + Failure Hint */}
      <div className="flex justify-between items-center pt-2 border-t border-border-default">
        <div className="flex items-center gap-1.5">
          <Clock className="w-3 h-3 text-foreground-muted" />
          <span className="text-[8px] font-mono text-foreground-muted">
            Peak: <span className="text-accent">{formatHour(insights.peak_hour.hour)}</span>
          </span>
        </div>
        {insights.failure_patterns.length > 0 && (
          <div className="flex items-center gap-1">
            <AlertCircle className="w-3 h-3 text-red-400" />
            <span className="text-[8px] font-mono text-red-400">
              {insights.failure_patterns[0].failures} fails
            </span>
          </div>
        )}
      </div>
    </motion.div>
  );
};
