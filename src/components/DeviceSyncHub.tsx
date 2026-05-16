import React, { FC, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, Tablet, Monitor, Link, ShieldCheck, Zap, Globe, MoreHorizontal } from 'lucide-react';
import { PairedDevice } from '../types/api';
import { Card } from './ui/Card';
import { Badge } from './ui/Badge';
import { Button } from './ui/Button';

import { useJarvisBridge } from '../hooks/useJarvisBridge';

export const DeviceSyncHub: FC = () => {
  const { getPairedDevices } = useJarvisBridge();
  const [devices, setDevices] = useState<PairedDevice[]>([]);
  const [isLoading, setIsLoading] = useState(true);

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

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000); // Poll every 10s
    return () => clearInterval(interval);
  }, [getPairedDevices]);

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
            <Button variant="neon" className="gap-2">
              <Link className="w-4 h-4" />
              Pair_New_Device
            </Button>
            <Button variant="secondary" className="gap-2">
              <Zap className="w-4 h-4" />
              Force_Global_Sync
            </Button>
          </div>
        </div>

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
                  <button className="text-foreground-subtle hover:text-foreground transition-colors">
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
                  <Button variant="secondary" className="flex-1 text-xs py-2">
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
