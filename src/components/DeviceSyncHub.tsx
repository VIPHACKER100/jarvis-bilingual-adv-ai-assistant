import { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Link, ShieldCheck, Globe, RefreshCw, X } from 'lucide-react';
import { PairedDevice } from '../types/api';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

import { useJarvisBridge } from '../hooks/useJarvisBridge';

export const DeviceSyncHub: FC = () => {
  const { getPairedDevices, getPairingCode, unpairDevice } = useJarvisBridge();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [, setIsLoading] = useState(true);
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [pairingExpiry, setPairingExpiry] = useState<number>(0);
  const [showPairing, setShowPairing] = useState(false);

  const fetchDevices = async () => {
    try {
      const res = await getPairedDevices();
      if (res.success) {
        setDevices(res.devices);
      }
    } catch (err) {
      console.error('Failed to fetch paired devices:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const generateCode = async () => {
    try {
      const res = await getPairingCode();
      if (res.success) {
        setPairingCode(res.code);
        setPairingExpiry(res.expires_in);
        setShowPairing(true);
      }
    } catch (err) {
      console.error('Failed to generate pairing code:', err);
    }
  };

  const handleUnpair = async (id: string) => {
    if (confirm(`Are you sure you want to unpair device ${id}?`)) {
      try {
        const res = await unpairDevice(id);
        if (res.success) {
          setDevices(prev => prev.filter(d => d.id !== id));
        }
      } catch (err) {
        console.error('Failed to unpair device:', err);
      }
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [getPairedDevices]);

  useEffect(() => {
    let timer: NodeJS.Timeout;
    if (showPairing && pairingExpiry > 0) {
      timer = setInterval(() => {
        setPairingExpiry(prev => {
          if (prev <= 1) {
            setShowPairing(false);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
    return () => clearInterval(timer);
  }, [showPairing, pairingExpiry]);

  const getDeviceIcon = (type: string) => {
    switch (type) {
      case 'MOBILE': return <Smartphone className="w-6 h-6" />;
      case 'TABLET': return <Tablet className="w-6 h-6" />;
      case 'DESKTOP': return <Monitor className="w-6 h-6" />;
      default: return <Smartphone className="w-6 h-6" />;
    }
  };

  return (
    <div className="flex flex-col h-full max-w-7xl mx-auto p-6 space-y-12">
      {/* Hero Section: Sync Nexus */}
      <div className="hud-panel relative overflow-hidden p-8 md:p-16 border-accent/20 group">
        {/* Scanning Line Effect */}
        <div className="scanline opacity-10" />
        
        <div className="relative z-10 max-w-3xl">
          <div className="flex items-center gap-3 mb-6">
            <Badge variant="accent" className="bg-accent/10 border-accent/30 text-accent font-mono text-[10px] tracking-widest px-3 py-1">
              SYSTEM_STATUS: OPTIMAL
            </Badge>
            <div className="h-px w-12 bg-border-subtle" />
            <span className="label-caps opacity-50">NODE_INTERFACE // 0x4F2</span>
          </div>

          <h1 className="text-4xl md:text-6xl font-bold mb-6 tracking-tighter uppercase italic leading-none">
            Sync_<span className="text-accent glow-text">Nexus</span>
          </h1>
          
          <p className="text-foreground-muted text-lg leading-relaxed mb-10 font-sans max-w-2xl border-l-2 border-accent/20 pl-6">
            Manage the JARVIS autonomous ecosystem. Synchronize neural datasets, 
            biometric profiles, and encrypted command telemetry across authorized mobile nodes.
          </p>

          <div className="flex flex-wrap gap-6">
            <Button variant="neon" className="gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest" onClick={generateCode}>
              <Link className="w-4 h-4" />
              Initialize_Link
            </Button>
            <Button variant="secondary" className="gap-3 px-8 py-4 text-xs font-bold uppercase tracking-widest border-border-default hover:border-accent/40" onClick={fetchDevices}>
              <RefreshCw className="w-4 h-4" />
              Refresh_Ecosystem
            </Button>
          </div>
        </div>

        {/* Pairing Handshake Modal */}
        <AnimatePresence>
          {showPairing && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute inset-0 z-20 bg-background-base/95 backdrop-blur-xl flex flex-col items-center justify-center p-8 text-center"
            >
              <div className="absolute inset-0 grid-overlay opacity-20" />
              <div className="scanline opacity-30" />
              
              <motion.div
                initial={{ y: 20, opacity: 0 }}
                animate={{ y: 0, opacity: 1 }}
                className="relative z-10 flex flex-col items-center"
              >
                <div className="w-20 h-20 rounded-full border-2 border-accent flex items-center justify-center mb-8 relative">
                  <div className="absolute inset-0 border-2 border-accent rounded-full animate-ping opacity-20" />
                  <Link className="w-8 h-8 text-accent" />
                </div>

                <h3 className="text-2xl font-bold font-mono uppercase tracking-[0.3em] text-accent mb-2">Neural_Handshake</h3>
                <p className="label-caps mb-12">Authorization Required // Secure Channel v3.9</p>
                
                <div className="bg-surface-lowest/50 border border-accent/40 rounded-sm p-10 mb-8 relative group overflow-hidden">
                  <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-accent" />
                  <div className="absolute top-0 right-0 w-2 h-2 border-t-2 border-r-2 border-accent" />
                  <div className="absolute bottom-0 left-0 w-2 h-2 border-b-2 border-l-2 border-accent" />
                  <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-accent" />
                  
                  <span className="text-5xl md:text-7xl font-bold font-mono tracking-[0.4em] text-foreground pl-[0.4em] relative z-10">
                    {pairingCode}
                  </span>
                </div>
                
                <div className="flex items-center gap-4 mb-10">
                  <div className="w-32 h-1 bg-surface-high rounded-full overflow-hidden">
                    <motion.div 
                      initial={{ width: "100%" }}
                      animate={{ width: "0%" }}
                      transition={{ duration: pairingExpiry, ease: "linear" }}
                      className="h-full bg-accent"
                    />
                  </div>
                  <span className="text-[10px] font-mono text-accent uppercase tracking-widest">
                    Expiring: {Math.floor(pairingExpiry / 60)}m {pairingExpiry % 60}s
                  </span>
                </div>
                
                <Button variant="ghost" onClick={() => setShowPairing(false)} className="text-security-rose hover:bg-security-rose/10 px-8">
                  Abort_Protocol
                </Button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* HUD Decorative Elements */}
        <div className="absolute -right-20 -bottom-20 w-[600px] h-[600px] opacity-[0.03] pointer-events-none group-hover:opacity-[0.05] transition-opacity duration-1000">
          <Globe className="w-full h-full text-accent animate-spin-slow" />
        </div>
      </div>

      {/* Authorized Node Registry */}
      <div className="space-y-6">
        <div className="flex items-center justify-between px-2">
          <div className="flex items-center gap-3">
            <h2 className="text-xl font-bold font-mono uppercase tracking-widest">Node_Registry</h2>
            <div className="h-px w-24 bg-border-subtle" />
            <span className="label-caps opacity-40">{devices.length}_Authorized</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <AnimatePresence>
            {devices.map((device, index) => (
              <motion.div
                key={device.id}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
              >
                <div className="hud-panel p-6 hover:border-accent/40 transition-all group flex flex-col h-full">
                  <div className="flex justify-between items-start mb-8">
                    <div className={`w-14 h-14 rounded-sm flex items-center justify-center relative ${
                      new Date(device.last_seen).getTime() > Date.now() - 300000 
                      ? 'text-accent' 
                      : 'text-foreground-subtle'
                    }`}>
                      <div className="absolute inset-0 border border-current opacity-20" />
                      <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-current" />
                      {getDeviceIcon(device.type)}
                    </div>
                    
                    <button 
                      onClick={() => handleUnpair(device.id)}
                      className="p-2 text-foreground-subtle hover:text-security-rose transition-colors rounded-sm hover:bg-security-rose/5"
                    >
                      <X className="w-5 h-5" />
                    </button>
                  </div>

                  <div className="flex-1 space-y-6">
                    <div>
                      <h3 className="text-lg font-bold font-mono uppercase tracking-tight group-hover:text-accent transition-colors">
                        {device.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-2">
                        <div className={`w-1.5 h-1.5 rounded-full ${
                          new Date(device.last_seen).getTime() > Date.now() - 300000 
                          ? 'bg-accent shadow-[0_0_8px_rgba(76,215,246,0.5)]' 
                          : 'bg-surface-high'
                        }`} />
                        <span className="text-[10px] font-mono text-foreground-subtle uppercase tracking-widest">
                          {new Date(device.last_seen).getTime() > Date.now() - 300000 ? 'Link_Active' : 'Offline // ' + new Date(device.last_seen).toLocaleDateString()}
                        </span>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-px bg-border-subtle p-px">
                      <div className="bg-background-base p-3">
                        <span className="label-caps text-[9px] opacity-60">Latency</span>
                        <p className="text-sm font-bold font-mono text-accent mt-1">24ms</p>
                      </div>
                      <div className="bg-background-base p-3">
                        <span className="label-caps text-[9px] opacity-60">Reliability</span>
                        <p className="text-sm font-bold font-mono text-success mt-1">98.4%</p>
                      </div>
                    </div>
                  </div>

                  <div className="mt-8 pt-6 border-t border-border-subtle flex gap-3">
                    <Button variant="ghost" className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2 hover:bg-accent/5">
                      Diagnostics
                    </Button>
                    <Button variant="secondary" className="flex-1 text-[10px] font-mono uppercase tracking-widest py-2" onClick={() => fetchDevices()}>
                      Re-Sync
                    </Button>
                  </div>
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      </div>

      {/* Protocol Security Banner */}
      <div className="hud-panel p-6 border-accent/20 bg-accent/[0.02]">
        <div className="flex flex-col md:flex-row items-center gap-8">
          <div className="w-16 h-16 rounded-sm bg-accent/5 flex items-center justify-center flex-shrink-0 border border-accent/20">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          <div className="flex-1 text-center md:text-left">
            <h4 className="font-bold text-accent font-mono uppercase tracking-[0.2em] mb-2">Neural_Encryption_v3.9_Active</h4>
            <p className="text-sm text-foreground-muted font-sans leading-relaxed">
              All telemetry packets are secured via <strong>AES-256-GCM</strong>. 
              Neural handshakes utilize <strong>RSA-4096</strong> peer verification. 
              Unauthorized access attempts are automatically logged and quarantined.
            </p>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-background-deep border border-border-default rounded-sm">
            <div className="w-2 h-2 rounded-full bg-success shadow-[0_0_8px_#10B981]" />
            <span className="text-[10px] font-mono font-bold uppercase tracking-widest">Secure_Link</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default DeviceSyncHub;
