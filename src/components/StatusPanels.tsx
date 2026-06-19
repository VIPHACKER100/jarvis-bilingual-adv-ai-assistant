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
    <section className="w-full space-y-12">
      {/* Metrics Section */}
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <LayoutDashboard className="w-5 h-5 text-accent" />
            <h2 className="text-xl font-bold tracking-tight gradient-text">System_Intelligence // Dashboard</h2>
          </div>
          <Badge variant="accent" className="border-border-subtle bg-surface-low">Realtime_Telemetry</Badge>
        </div>
        
        <SystemMetricsWidget />
      </div>

      {/* Main Grid: Activity & Extended Status */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left 2/3: Activity Feed */}
        <div className="lg:col-span-2 space-y-6">
          <div className="flex items-center gap-3">
            <Activity className="w-5 h-5 text-secondary" />
            <h2 className="text-xl font-bold tracking-tight gradient-text">Session_Log</h2>
          </div>
          <ActivityFeed />
        </div>

        {/* Right 1/3: Extended Modules / Info */}
        <div className="space-y-6">
          <div className="flex items-center gap-3">
            <Database className="w-5 h-5 text-info" />
            <h2 className="text-xl font-bold tracking-tight gradient-text">Module_Manifest</h2>
          </div>

          <VolumeControl level={volume} />

          <div className="space-y-4">
            <ModuleCard 
              name="Vision_Overlay_v4" 
              status="Online" 
              uptime="2h 45m"
              color="var(--info)"
            />
            <ModuleCard 
              name="Bilingual_Parser_v2" 
              status="Optimized" 
              uptime="14h 12m"
              color="var(--success)"
            />
            <ModuleCard 
              name="Mobile_Sync_Service" 
              status="Connected" 
              uptime="32m"
              color="var(--accent)"
            />
            <ModuleCard 
              name="Autonomous_Agent" 
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
  <Card elevation="mid" interactive className="border-border-subtle group">
    <div className="flex justify-between items-center">
      <div className="flex flex-col">
        <span className="text-xs font-bold text-foreground group-hover:text-accent transition-colors">{name}</span>
        <span className="text-[10px] font-mono text-foreground-subtle uppercase tracking-widest mt-1">Uptime: {uptime}</span>
      </div>
      <div className="flex flex-col items-end gap-1">
        <span className="text-[9px] font-mono font-bold uppercase tracking-widest" style={{ color }}>{status}</span>
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
