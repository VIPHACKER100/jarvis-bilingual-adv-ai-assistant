import { FC } from 'react';
import { motion } from 'framer-motion';
import { ActivityFeed } from './ActivityFeed';
import { SystemMetricsWidget } from './SystemMetricsWidget';
import { VolumeControl } from './VolumeControl';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { useJarvisStore } from '../store/jarvisStore';
import { Activity, LayoutDashboard, Database } from 'lucide-react';

export const StatusPanels: FC = () => {
  const volume = useJarvisStore(s => s.volume);
  return (
    <section className="w-full space-y-10">
      {/* Metrics Section */}
      <div className="space-y-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-4 h-4 text-accent" />
            <h2 className="text-base font-bold tracking-tight gradient-text uppercase">System Intelligence</h2>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 rounded-full bg-success animate-pulse" />
            <Badge variant="accent" className="border-border-subtle bg-surface-low text-[10px]">Realtime Telemetry</Badge>
          </div>
        </div>
        
        <SystemMetricsWidget />
      </div>

      {/* Main Grid: Activity & Extended Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3: Activity Feed */}
        <div className="lg:col-span-2 space-y-5">
          <div className="flex items-center gap-3">
            <Activity className="w-4 h-4 text-secondary" />
            <h2 className="text-base font-bold tracking-tight gradient-text uppercase">Session Log</h2>
          </div>
          <ActivityFeed />
        </div>

        {/* Right 1/3: Extended Modules / Info */}
        <div className="space-y-5">
          <div className="flex items-center gap-3">
            <Database className="w-4 h-4 text-info" />
            <h2 className="text-base font-bold tracking-tight gradient-text uppercase">Module Manifest</h2>
          </div>

          <VolumeControl level={volume} />

          <div className="space-y-3">
            <ModuleCard 
              name="Vision Overlay v4" 
              status="Online" 
              uptime="2h 45m"
              color="var(--info)"
            />
            <ModuleCard 
              name="Bilingual Parser v2" 
              status="Optimized" 
              uptime="14h 12m"
              color="var(--success)"
            />
            <ModuleCard 
              name="Mobile Sync Service" 
              status="Connected" 
              uptime="32m"
              color="var(--accent)"
            />
            <ModuleCard 
              name="Autonomous Agent" 
              status="Standby" 
              uptime="0m"
              color="var(--secondary)"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

const ModuleCard: FC<{ name: string, status: string, uptime: string, color: string }> = ({ name, status, uptime, color }) => (
  <Card elevation="mid" interactive className="border-border-subtle group card-hover-lift hover:border-accent-cyan/30">
    <div className="flex justify-between items-center">
      <div className="flex flex-col gap-1">
        <span className="text-sm font-semibold text-foreground group-hover:text-accent-cyan transition-colors">{name}</span>
        <span className="text-xs font-mono text-foreground-muted uppercase tracking-wider">Uptime: {uptime}</span>
      </div>
      <div className="flex flex-col items-end gap-1.5">
        <span className="text-xs font-mono font-bold uppercase tracking-wide" style={{ color }}>{status}</span>
        <div className="w-8 h-1 bg-surface-high rounded-full overflow-hidden">
          <motion.div 
            initial={{ width: 0 }}
            animate={{ width: "100%" }}
            transition={{ duration: 1, delay: 0.5 }}
            className="h-full"
            style={{ backgroundColor: color }}
          />
        </div>
      </div>
    </div>
  </Card>
);
