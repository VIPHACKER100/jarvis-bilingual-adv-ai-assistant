import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Link, ShieldCheck, Zap, Globe, MoreHorizontal, RefreshCw } from 'lucide-react';
import { PairedDevice } from '../types/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

import { useJarvisBridge } from '../hooks/useJarvisBridge';

export const DeviceSyncHub: FC = () => {
  const { getPairedDevices, getPairingCode, unpairDevice } = useJarvisBridge();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
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
    <div className="flex flex-col h-full max-w-6xl mx-auto p-6 space-y-10">
      {/* Hero Section */}
      <div className="relative overflow-hidden rounded-3xl bg-background-elevated border border-border-default p-8 md:p-12">
        <div className="relative z-10 max-w-2xl">
          <Badge variant="accent" className="mb-4 bg-cyber-cyan/10 border-cyber-cyan/30 text-cyber-cyan px-3 py-1">
            NETWORK_STATUS: OPTIMAL
          </Badge>
          <h1 className="text-4xl md:text-5xl font-display font-bold mb-4 tracking-tight uppercase italic">
            Device_Sync_<span className="text-cyber-cyan">Nexus</span>
          </h1>
          <p className="text-foreground-muted text-lg leading-relaxed mb-8">
            Manage your JARVIS mobile ecosystem. Synchronize neural weights, 
            voice profiles, and secure command history across all authorized nodes.
          </p>
          <div className="flex flex-wrap gap-4">
            <Button variant="neon" className="gap-2" onClick={generateCode}>
              <Link className="w-4 h-4" />
              Pair_New_Device
            </Button>
            <Button variant="secondary" className="gap-2" onClick={fetchDevices}>
              <RefreshCw className="w-4 h-4" />
              Sync_Ecosystem
            </Button>
          </div>
        </div>

        {/* Pairing Code Overlay */}
        <AnimatePresence>
          {showPairing && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              className="absolute inset-0 z-20 bg-background-base/90 backdrop-blur-md flex flex-col items-center justify-center p-8 text-center"
            >
              <h3 className="text-2xl font-bold font-display uppercase tracking-widest text-cyber-cyan mb-2">Neural_Handshake_Initiated</h3>
              <p className="text-foreground-muted mb-8 text-sm">Enter this code on your mobile device to establish the neural link.</p>
              
              <div className="bg-background-deep border border-cyber-cyan/30 rounded-2xl p-8 mb-6 shadow-[0_0_30px_rgba(6,182,212,0.1)]">
                <span className="text-5xl font-bold font-mono tracking-[0.5em] text-foreground pl-[0.5em]">
                  {pairingCode}
                </span>
              </div>
              
              <p className="text-[10px] font-mono text-foreground-subtle uppercase mb-8">
                Code expires in {Math.floor(pairingExpiry / 60)}m {pairingExpiry % 60}s
              </p>
              
              <Button variant="ghost" onClick={() => setShowPairing(false)} className="text-danger border border-danger/20">
                Abort_Pairing
              </Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Decorative Background Elements */}
        <div className="absolute top-0 right-0 w-1/2 h-full opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-gradient-to-l from-cyber-cyan/40 to-transparent" />
          <Globe className="absolute -right-20 -top-20 w-[400px] h-[400px] text-cyber-cyan animate-spin-slow" />
        </div>
      </div>

      {/* Device Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <AnimatePresence>
          {devices.map((device, index) => (
            <motion.div
              key={device.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card className="p-6 h-full flex flex-col hover:border-cyber-cyan/40 transition-all group">
                <div className="flex justify-between items-start mb-6">
                  <div className={`w-12 h-12 rounded-2xl bg-background-base border border-border-default flex items-center justify-center ${
                    new Date(device.last_seen).getTime() > Date.now() - 300000 
                    ? 'text-cyber-cyan' 
                    : 'text-foreground-subtle'
                  }`}>
                    {getDeviceIcon(device.type)}
                  </div>
                  <button 
                    onClick={() => handleUnpair(device.id)}
                    className="text-foreground-subtle hover:text-danger transition-colors"
                    title="Unpair Device"
                  >
                    <MoreHorizontal className="w-5 h-5" />
                  </button>
                </div>

                <div className="flex-1 space-y-4">
                  <div>
                    <h3 className="text-lg font-bold font-display uppercase tracking-wide group-hover:text-cyber-cyan transition-colors">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-2 mt-1">
                      <div className={`w-1.5 h-1.5 rounded-full ${
                        new Date(device.last_seen).getTime() > Date.now() - 300000 
                        ? 'bg-cyber-cyan animate-pulse' 
                        : 'bg-foreground-subtle'
                      }`} />
                      <span className="text-[10px] font-mono text-foreground-subtle uppercase tracking-widest">
                        {new Date(device.last_seen).getTime() > Date.now() - 300000 ? 'Online' : 'Last_Seen: ' + new Date(device.last_seen).toLocaleDateString()}
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border-subtle">
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-tighter">Latency</span>
                      <p className="text-xs font-bold font-mono text-cyber-cyan">24ms</p>
                    </div>
                    <div className="space-y-1">
                      <span className="text-[9px] font-mono text-foreground-subtle uppercase tracking-tighter">Sync_Health</span>
                      <p className="text-xs font-bold font-mono text-success">98%</p>
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex gap-2">
                  <Button variant="ghost" className="flex-1 text-xs py-2 bg-background-base/50">
                    Diagnostics
                  </Button>
                  <Button variant="secondary" className="flex-1 text-xs py-2" onClick={() => fetchDevices()}>
                    Resync
                  </Button>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>

      {/* Security Banner */}
      <div className="bg-cyber-cyan/5 border border-cyber-cyan/20 rounded-2xl p-6 flex items-center gap-6">
        <div className="w-12 h-12 rounded-full bg-cyber-cyan/10 flex items-center justify-center flex-shrink-0">
          <ShieldCheck className="w-6 h-6 text-cyber-cyan" />
        </div>
        <div>
          <h4 className="font-bold text-cyber-cyan uppercase font-display tracking-wide">End-to-End Encryption Active</h4>
          <p className="text-sm text-foreground-muted">
            All data transmitted between your devices is secured with AES-256-GCM. 
            Pairing uses a 2048-bit RSA handshake.
          </p>
        </div>
      </div>
    </div>
  );
};
