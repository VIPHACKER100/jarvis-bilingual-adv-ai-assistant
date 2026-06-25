import { FC } from 'react';
import { Terminal, Activity, Scan, Settings2 } from 'lucide-react';
import { Card } from './ui/Card';

export const QuickActions: FC = () => {
  const actions = [
    { icon: <Scan className="w-5 h-5" />, label: 'Start Scan', description: 'Initiate full system diagnostic', active: true },
    { icon: <Settings2 className="w-5 h-5" />, label: 'Run Automation', description: 'Execute background macro scripts', active: false },
    { icon: <Terminal className="w-5 h-5" />, label: 'Open Terminal', description: 'Access root command line', active: false },
    { icon: <Activity className="w-5 h-5" />, label: 'Diagnostics', description: 'View detailed performance metrics', active: false },
  ];

  return (
    <div className="w-full max-w-5xl mx-auto px-4 mt-12 mb-20">
      <div className="flex items-center gap-3 mb-6 opacity-60">
        <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
        <h3 className="label-caps tracking-widest text-xs">Tactical Quick Actions</h3>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {actions.map((action, idx) => (
          <Card 
            key={idx} 
            interactive 
            className={`group relative overflow-hidden ${action.active ? 'border-accent-cyan/40 bg-accent-cyan/[0.03]' : 'border-border-default/40 hover:border-accent/40'}`}
          >
            {/* Hover Scanline */}
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-accent/5 to-transparent translate-y-[-100%] group-hover:translate-y-[100%] transition-transform duration-1000 ease-in-out pointer-events-none" />
            
            <div className="flex flex-col gap-4 relative z-10">
              <div className={`p-3 rounded-md inline-flex w-fit ${action.active ? 'bg-accent-cyan/10 text-accent-cyan shadow-[0_0_10px_rgba(var(--accent-cyan-rgb),0.2)]' : 'bg-surface-high text-foreground-muted group-hover:text-accent group-hover:bg-accent/10 transition-colors'}`}>
                {action.icon}
              </div>
              <div>
                <h4 className="font-bold text-foreground tracking-wide mb-1">{action.label}</h4>
                <p className="text-xs text-foreground-subtle leading-relaxed">{action.description}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>
    </div>
  );
};
