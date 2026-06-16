import React, { FC } from 'react';
import { motion } from 'framer-motion';
import { Database, Network, ShieldCheck, Cpu } from 'lucide-react';
import { useJarvisStore } from '../../store/jarvisStore';

export const Footer: FC = () => {
  const { isConnected, systemStatus, language } = useJarvisStore();

  return (
    <motion.footer 
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="fixed bottom-0 left-0 right-0 z-40 px-6 py-3 flex justify-center bg-background-overlay/50 blur-bg border-t border-border-subtle"
    >
      <div className="w-full max-w-7xl flex flex-col md:flex-row justify-between items-center gap-4">
        {/* Left Side: System Metadata */}
        <div className="flex items-center gap-6">
          <StatusItem 
            icon={<Database className="w-3.5 h-3.5" />} 
            label="Memory_Pool" 
            value={systemStatus?.memory?.used ? `${(systemStatus.memory.used / 1024 / 1024).toFixed(0)}MB` : '256MB'} 
          />
          <StatusItem 
            icon={<Network className="w-3.5 h-3.5" />} 
            label="Neural_Throughput" 
            value="1.2 GB/s" 
          />
          <div className="hidden lg:flex items-center gap-2 px-3 py-1 rounded-full bg-accent-soft border border-border-accent">
            <ShieldCheck className="w-3 h-3 text-accent" />
            <span className="text-[9px] font-mono font-bold text-accent uppercase tracking-widest">
              Protocol_39_Active
            </span>
          </div>
        </div>

        {/* Center: Neural Network Activity (Minimal) */}
        <div className="hidden md:flex items-center gap-1.5">
          <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-[0.3em] mr-2">Neural_Sync</span>
          <div className="flex items-center gap-1">
            {[1, 2, 3, 4, 5].map((i) => (
              <motion.div
                key={i}
                animate={{ 
                  opacity: [0.3, 1, 0.3],
                  scale: [1, 1.2, 1],
                  backgroundColor: isConnected ? ['#5E6AD2', '#7C87EA', '#5E6AD2'] : '#8E9196'
                }}
                transition={{ 
                  repeat: Infinity, 
                  duration: 2, 
                  delay: i * 0.2,
                  ease: "easeInOut"
                }}
                className="w-1.5 h-1.5 rounded-full bg-accent shadow-[0_0_5px_rgba(94,106,210,0.5)]"
              />
            ))}
          </div>
        </div>

        {/* Right Side: Environment Info */}
        <div className="flex items-center gap-4">
          <div className="text-[9px] font-mono text-foreground-subtle flex items-center gap-2">
            <span className="uppercase tracking-widest">Runtime:</span>
            <span className="text-foreground font-bold tabular-nums">VITE_PROD_v3.9.0</span>
          </div>
          <div className="h-4 w-px bg-border-subtle" />
          <div className="text-[9px] font-mono text-foreground-subtle flex items-center gap-2">
            <span className="uppercase tracking-widest">Language:</span>
            <span className="text-accent font-bold uppercase">{language}</span>
          </div>
        </div>
      </div>
    </motion.footer>
  );
};

const StatusItem: FC<{ icon: React.ReactNode, label: string, value: string }> = ({ icon, label, value }) => (
  <div className="flex items-center gap-2.5 group">
    <div className="text-foreground-subtle group-hover:text-accent transition-colors">
      {icon}
    </div>
    <div className="flex flex-col -gap-0.5">
      <span className="text-[8px] font-mono text-foreground-subtle uppercase tracking-tighter leading-none">{label}</span>
      <span className="text-[10px] font-mono font-bold text-foreground leading-tight">{value}</span>
    </div>
  </div>
);
