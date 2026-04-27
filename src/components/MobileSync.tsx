import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck, ExternalLink } from 'lucide-react';
import { Link } from 'react-router-dom';

export const MobileSync: FC = () => {
  const [pairingCode, setPairingCode] = useState('JARVIS-SYNC');
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [devices, setDevices] = useState([
    { id: '1', name: 'iPhone 15 Pro', status: 'online', lastSeen: 'Just now' }
  ]);

  const handleRefreshCode = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      // Mock new code generation
      setPairingCode('JARVIS-' + Math.random().toString(36).substring(7).toUpperCase());
      setIsRefreshing(false);
    }, 1000);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 mb-2">
        <Smartphone className="w-5 h-5 text-accent" />
        <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Mobile Synchronization</h3>
      </div>

      <div className="glass-panel p-6 border-accent/20 bg-accent/5">
        <div className="flex flex-col items-center text-center space-y-4">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/30 shadow-[0_0_20px_rgba(94,106,210,0.1)]">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">Pair Your Device</h4>
            <p className="text-[10px] text-foreground-muted max-w-[240px]">
              Scan the QR code or enter this pairing code on your mobile app to monitor JARVIS remotely.
            </p>
          </div>

          <div className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5 w-full max-w-[280px]">
            <span className="text-2xl font-mono font-black tracking-[0.2em] text-accent flex-1 text-center">
              {pairingCode}
            </span>
            <button 
              onClick={handleRefreshCode}
              disabled={isRefreshing}
              className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
            >
              <RefreshCw className="w-4 h-4 text-foreground-muted" />
            </button>
          </div>

          <Link 
            to="/mobile" 
            className="flex items-center gap-2 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest mt-2"
          >
            <ExternalLink className="w-3 h-3" />
            Launch Mobile Preview
          </Link>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted flex items-center gap-2">
          Paired Devices
          <div className="h-px flex-1 bg-white/5"></div>
        </h4>

        <div className="space-y-2">
          {devices.map(device => (
            <div key={device.id} className="glass-panel p-3 flex justify-between items-center bg-white/[0.02]">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                  <Smartphone className="w-4 h-4 text-accent" />
                </div>
                <div className="flex flex-col">
                  <span className="text-[11px] font-bold text-foreground">{device.name}</span>
                  <span className="text-[9px] text-foreground-muted font-mono">{device.lastSeen}</span>
                </div>
              </div>
              <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-full border border-accent/20">
                <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                <span className="text-[8px] font-bold text-accent uppercase tracking-tighter">Connected</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};
