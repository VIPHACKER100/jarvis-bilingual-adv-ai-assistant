import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck, ExternalLink, Trash2, Wifi, WifiOff, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../services/apiClient';
import { API_BASE_URL } from '../config';

export const MobileSync: FC = () => {
  const [pairingCode, setPairingCode] = useState('JARVIS-SYNC');
  const [showQR, setShowQR] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [devices, setDevices] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Payload for the mobile app to scan
  const qrData = JSON.stringify({
    server_url: API_BASE_URL,
    pairing_code: pairingCode,
    timestamp: Date.now()
  });

  const fetchDevices = async () => {
    try {
      const response = await apiClient.getSyncStatus();
      if (response?.success) {
        setDevices([]);
      }
    } catch (error) {
      console.error('Error fetching sync status:', error);
      setDevices([]);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshCode = () => {
    setIsRefreshing(true);
    setTimeout(() => {
      setPairingCode('JARVIS-' + Math.random().toString(36).substring(7).toUpperCase());
      setIsRefreshing(false);
    }, 800);
  };

  const handleUnpair = async (deviceId: string) => {
    if (!confirm('Are you sure you want to unpair this device?')) return;
    
    try {
      setDevices(prev => prev.filter(d => d.id !== deviceId));
    } catch (error) {
      console.error('Error unpairing device:', error);
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-3">
          <Smartphone className="w-5 h-5 text-accent" />
          <h3 className="text-sm font-bold uppercase tracking-widest text-foreground">Mobile Synchronization</h3>
        </div>
        {isLoading && <RefreshCw className="w-3 h-3 text-accent animate-spin" />}
      </div>

      <div className="glass-panel p-6 border-accent/20 bg-accent/5 overflow-hidden relative">
        {/* Background glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-32 h-32 bg-accent/10 blur-[60px] rounded-full pointer-events-none" />
        
        <div className="flex flex-col items-center text-center space-y-4 relative z-10">
          <div className="w-16 h-16 rounded-2xl bg-accent/10 flex items-center justify-center border border-accent/30 shadow-[0_0_20px_rgba(94,106,210,0.1)]">
            <ShieldCheck className="w-8 h-8 text-accent" />
          </div>
          
          <div className="space-y-1">
            <h4 className="text-base font-bold text-foreground">Pair Your Device</h4>
            <p className="text-[10px] text-foreground-muted max-w-[240px]">
              {showQR ? "Scan this code with the JARVIS Mobile App" : "Scan the QR code or enter this pairing code on your mobile app to monitor JARVIS remotely."}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showQR ? (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                transition={{ type: "spring", damping: 12 }}
                className="p-3 bg-white rounded-2xl border-4 border-accent/30 shadow-[0_0_40px_rgba(94,106,210,0.2)]"
              >
                <QRCodeSVG 
                  value={qrData} 
                  size={160}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    x: undefined,
                    y: undefined,
                    height: 30,
                    width: 30,
                    excavate: true,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="code"
                initial={{ opacity: 0, scale: 0.8, rotateY: -90 }}
                animate={{ opacity: 1, scale: 1, rotateY: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateY: 90 }}
                transition={{ type: "spring", damping: 12 }}
                className="flex items-center gap-3 p-4 bg-black/40 rounded-xl border border-white/5 w-full max-w-[280px]"
              >
                <span className="text-2xl font-mono font-black tracking-[0.2em] text-accent flex-1 text-center">
                  {pairingCode}
                </span>
                <button 
                  onClick={handleRefreshCode}
                  disabled={isRefreshing}
                  title="Refresh pairing code"
                  aria-label="Refresh pairing code"
                  className={`p-2 rounded-lg hover:bg-white/5 transition-colors ${isRefreshing ? 'animate-spin' : ''}`}
                >
                  <RefreshCw className="w-4 h-4 text-foreground-muted" />
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-4 mt-2">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="flex items-center gap-2 text-[10px] font-bold text-accent hover:text-accent/80 transition-colors uppercase tracking-widest"
            >
              {showQR ? <Smartphone className="w-3 h-3" /> : <QrCode className="w-3 h-3" />}
              {showQR ? "Show Pairing Code" : "Show QR Code"}
            </button>
            
            <div className="w-px h-3 bg-white/10" />

            <Link 
              to="/mobile" 
              className="flex items-center gap-2 text-[10px] font-bold text-foreground-muted hover:text-foreground transition-colors uppercase tracking-widest"
            >
              <ExternalLink className="w-3 h-3" />
              Launch Preview
            </Link>
          </div>
        </div>
      </div>

      <div className="space-y-3">
        <h4 className="text-[10px] font-bold uppercase tracking-[0.2em] text-foreground-muted flex items-center gap-2">
          Paired Devices
          <div className="h-px flex-1 bg-white/5"></div>
        </h4>

        <div className="space-y-2">
          <AnimatePresence mode="popLayout">
            {devices?.length > 0 ? (
              devices.map(device => (
                <motion.div 
                  key={device.id}
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }}
                  className="glass-panel p-3 flex justify-between items-center bg-white/[0.02] border-white/5 hover:border-accent/30 transition-colors group"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center">
                      <Smartphone className="w-4 h-4 text-accent" />
                    </div>
                    <div className="flex flex-col">
                      <span className="text-[11px] font-bold text-foreground">{device.name}</span>
                      <span className="text-[9px] text-foreground-muted font-mono">
                        {device.type} • {device.last_seen ? new Date(device.last_seen).toLocaleTimeString() : 'N/A'}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-1.5 px-2 py-1 bg-accent/10 rounded-full border border-accent/20">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[8px] font-mono text-slate-500 uppercase tracking-widest">Registered: {devices?.length || 0} Nodes</span>
                    </div>
                    <button 
                      onClick={() => handleUnpair(device.id)}
                      className="p-1.5 rounded-md hover:bg-red-500/10 text-foreground-muted hover:text-red-400 opacity-0 group-hover:opacity-100 transition-all"
                      title="Unpair Device"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center space-y-2 opacity-50">
                <WifiOff className="w-8 h-8 text-foreground-muted" />
                <p className="text-[10px] uppercase tracking-widest text-foreground-muted font-bold">No Devices Paired</p>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
