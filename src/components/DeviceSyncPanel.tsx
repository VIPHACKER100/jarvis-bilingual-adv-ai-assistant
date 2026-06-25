import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Smartphone, Tablet, Monitor, RefreshCw, Link2, Unlink,
  Copy, Check, QrCode, X, Clock, Shield,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import {
  usePairedDevices, useUnpairDevice, usePairingCode,
} from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { PairedDevice } from '../types/api';

export const DeviceSyncPanel: FC = () => {
  const { showDeviceSync, setShowDeviceSync } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [pairingCode, setPairingCode] = useState<string | null>(null);
  const [codeExpiry, setCodeExpiry] = useState<number>(0);
  const [copied, setCopied] = useState(false);

  const devicesQuery = usePairedDevices();
  const unpairMutation = useUnpairDevice();
  const pairingMutation = usePairingCode();

  const devices = devicesQuery.data?.devices ?? [];

  const generatePairingCode = async () => {
    try {
      const res = await pairingMutation.mutateAsync();
      setPairingCode(res.code);
      setCodeExpiry(res.expires_in);
      addNotification({ type: 'info', title: 'Pairing Code Generated', message: `Code expires in ${res.expires_in} seconds`, duration: 5000 });
    } catch {
      addNotification({ type: 'error', title: 'Code Generation Failed', message: 'Could not generate pairing code', duration: 4000 });
    }
  };

  const copyCode = () => {
    if (pairingCode) {
      navigator.clipboard.writeText(pairingCode);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  const handleUnpair = async (deviceId: string, deviceName: string) => {
    if (!confirm(`Unpair ${deviceName}? This will remove the device from your trusted list.`)) return;
    try {
      await unpairMutation.mutateAsync(deviceId);
      addNotification({ type: 'warning', title: 'Device Unpaired', message: `${deviceName} removed`, duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'Unpair Failed', message: 'Could not unpair device', duration: 4000 });
    }
  };

  const getDeviceIcon = (type: string) => {
    switch (type.toLowerCase()) {
      case 'phone': case 'mobile': return <Smartphone className="w-5 h-5" />;
      case 'tablet': return <Tablet className="w-5 h-5" />;
      default: return <Monitor className="w-5 h-5" />;
    }
  };

  if (!showDeviceSync) return null;

  return (
    <Modal isOpen={showDeviceSync} onClose={() => setShowDeviceSync(false)} title="DEVICE_SYNC_HUB // v4.0" size="lg">
      <div className="flex flex-col h-full min-h-[400px] gap-6">
        {/* Pairing Section */}
        <div className="p-5 bg-background-deep/60 border border-accent/20 rounded-xl">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 rounded-lg bg-accent/10 border border-accent/30">
              <Link2 className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-foreground tracking-tight">Pair New Device</h3>
              <p className="text-[10px] font-mono text-foreground-muted">Generate a 6-digit code to link a mobile device</p>
            </div>
          </div>

          {pairingCode ? (
            <div className="flex flex-col items-center gap-4 p-6 bg-background-deep rounded-lg border border-accent/30">
              <div className="text-4xl font-mono font-black tracking-[0.3em] text-accent">{pairingCode}</div>
              <div className="flex items-center gap-2 text-[10px] font-mono text-foreground-muted">
                <Clock className="w-3 h-3" /> Expires in {codeExpiry}s
              </div>
              <div className="flex gap-3">
                <button onClick={copyCode} className="flex items-center gap-2 px-4 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                  {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />} {copied ? 'Copied' : 'Copy Code'}
                </button>
                <button onClick={() => setPairingCode(null)} className="flex items-center gap-2 px-4 py-2 bg-surface hover:bg-surface-hover text-foreground-muted border border-border-default rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all">
                  <X className="w-3.5 h-3.5" /> Dismiss
                </button>
              </div>
            </div>
          ) : (
            <Button onClick={generatePairingCode} isLoading={pairingMutation.isPending} className="w-full" size="lg">
              <QrCode className="w-4 h-4 mr-2" /> Generate Pairing Code
            </Button>
          )}
        </div>

        {/* Paired Devices */}
        <div className="flex-1">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4 text-accent" />
              <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Trusted Devices ({devices.length})</span>
            </div>
            <button onClick={() => devicesQuery.refetch()} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Refresh" aria-label="Refresh device list">
              <RefreshCw className={`w-3.5 h-3.5 text-foreground-muted ${devicesQuery.isLoading ? 'animate-spin' : ''}`} />
            </button>
          </div>

          <div className="space-y-2 max-h-64 overflow-y-auto">
            {devicesQuery.isLoading ? (
              <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin text-accent/50" /></div>
            ) : devices.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-foreground-muted/50 gap-3">
                <Smartphone className="w-8 h-8" />
                <span className="text-xs font-mono">No devices paired yet</span>
                <span className="text-[9px] font-mono opacity-60">Generate a code and enter it on your mobile device</span>
              </div>
            ) : (
              devices.map((d: PairedDevice, i) => (
                <motion.div key={d.id} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.05 }}
                  className="flex items-center gap-4 px-4 py-3 bg-background-deep/40 border border-border-default rounded-lg hover:border-accent/30 transition-all group">
                  <div className="p-2 rounded-lg bg-accent/5 border border-accent/10 text-accent">
                    {getDeviceIcon(d.type)}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground truncate">{d.name}</div>
                    <div className="flex items-center gap-3 text-[9px] font-mono text-foreground-muted">
                      <span className="uppercase">{d.type}</span>
                      <span>Paired: {new Date(d.paired_at).toLocaleDateString()}</span>
                      <span>Last seen: {new Date(d.last_seen).toLocaleDateString()}</span>
                    </div>
                  </div>
                  <Badge variant="success" className="text-[8px]">Trusted</Badge>
                  <button onClick={() => handleUnpair(d.id, d.name)}
                    className="p-1.5 hover:bg-danger/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Unpair device" aria-label="Unpair device">
                    <Unlink className="w-3.5 h-3.5 text-danger" />
                  </button>
                </motion.div>
              ))
            )}
          </div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between pt-3 border-t border-border-subtle text-[9px] font-mono text-foreground-muted">
          <span>Sync Protocol v4.0 — Encrypted</span>
          <button onClick={() => devicesQuery.refetch()} className="flex items-center gap-1 hover:text-accent transition-colors">
            <RefreshCw className="w-3 h-3" /> Refresh
          </button>
        </div>
      </div>
    </Modal>
  );
};
