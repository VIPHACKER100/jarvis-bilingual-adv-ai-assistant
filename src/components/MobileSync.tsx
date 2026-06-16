import { FC, useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Smartphone, RefreshCw, CheckCircle2, ShieldCheck, ExternalLink, Trash2, Wifi, WifiOff, QrCode } from 'lucide-react';
import { Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { apiClient } from '../services/apiClient';
import { API_BASE_URL } from '../config';

export const MobileSync: FC = () => {
  const [pairingCode, setPairingCode] = useState('------');
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
      const response = await apiClient.getPairedDevices();
      if (response?.success) {
        setDevices(response.devices);
      }
    } catch (error) {
      console.error('Error fetching paired devices:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const fetchNewCode = async () => {
    setIsRefreshing(true);
    try {
      const response = await apiClient.getPairingCode();
      if (response?.success) {
        setPairingCode(response.code);
      }
    } catch (error) {
      console.error('Error fetching pairing code:', error);
    } finally {
      setIsRefreshing(false);
    }
  };

  useEffect(() => {
    fetchDevices();
    fetchNewCode();
    
    // Refresh devices every 10 seconds
    const interval = setInterval(fetchDevices, 10000);
    return () => clearInterval(interval);
  }, []);

  const handleRefreshCode = () => {
    fetchNewCode();
  };

  const handleUnpair = async (deviceId: string) => {
    if (!confirm('Are you sure you want to unpair this device?')) return;
    
    try {
      const response = await apiClient.unpairDevice(deviceId);
      if (response.success) {
        setDevices(prev => prev.filter(d => d.id !== deviceId));
      }
    } catch (error) {
      console.error('Error unpairing device:', error);
    }
  };

  return (
    <div className="space-y-8 relative">
      {/* Tactical Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-accent/10 flex items-center justify-center border border-accent/20 shadow-[0_0_15px_rgba(76,215,246,0.1)]">
            <Smartphone className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="label-caps text-sm tracking-[0.3em]">Mobile_Sync_Hub // v3.9.0</h3>
            <p className="text-[10px] font-mono text-white/30 tracking-widest mt-0.5">Secure_Neural_Bridge_Active</p>
          </div>
        </div>
        {isLoading && (
          <div className="flex items-center gap-2 px-3 py-1 bg-accent/5 rounded-full border border-accent/10">
            <RefreshCw className="w-3 h-3 text-accent animate-spin" />
            <span className="text-[9px] font-mono text-accent uppercase tracking-widest">Polling_Nodes...</span>
          </div>
        )}
      </div>

      {/* Hero Sync Panel */}
      <div className="hud-panel p-8 relative overflow-hidden group">
        {/* Scanline Overlay */}
        <div className="absolute inset-0 pointer-events-none z-10 opacity-[0.03] scanline-overlay" />
        
        {/* Dynamic Background Glow */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-48 h-48 bg-accent/5 blur-[80px] rounded-full pointer-events-none transition-all duration-1000 group-hover:bg-accent/10 group-hover:w-64" />
        
        <div className="flex flex-col items-center text-center space-y-8 relative z-20">
          <div className="relative">
            <div className="absolute inset-0 bg-accent/20 blur-2xl rounded-full animate-pulse" />
            <div className="relative w-20 h-20 rounded-2xl bg-black/40 flex items-center justify-center border border-accent/30 shadow-[0_0_30px_rgba(76,215,246,0.2)]">
              <ShieldCheck className="w-10 h-10 text-accent" />
            </div>
          </div>
          
          <div className="space-y-2">
            <h4 className="label-caps text-lg tracking-[0.2em] text-white">Initialize_Neural_Handshake</h4>
            <p className="text-[11px] font-medium text-white/40 max-w-[320px] leading-relaxed font-mono tracking-wider">
              {showQR 
                ? "DECRYPTING_VISUAL_PAYLOAD... SCAN_OPTICAL_HASH_WITH_MOBILE_UNIT" 
                : "PENDING_AUTHORIZATION... ENTER_SECURE_TOKEN_ON_EXTERNAL_INTERFACE"}
            </p>
          </div>

          <AnimatePresence mode="wait">
            {showQR ? (
              <motion.div 
                key="qr"
                initial={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateX: -45 }}
                transition={{ type: "spring", damping: 15 }}
                className="p-5 bg-white rounded-2xl border-4 border-accent/20 shadow-[0_0_50px_rgba(76,215,246,0.3)] relative group/qr"
              >
                <div className="absolute -inset-4 border border-accent/10 rounded-[2.5rem] pointer-events-none group-hover/qr:border-accent/30 transition-all duration-500" />
                <QRCodeSVG 
                  value={qrData} 
                  size={180}
                  level="H"
                  includeMargin={true}
                  imageSettings={{
                    src: "/favicon.ico",
                    height: 36,
                    width: 36,
                    excavate: true,
                  }}
                />
              </motion.div>
            ) : (
              <motion.div 
                key="code"
                initial={{ opacity: 0, scale: 0.8, rotateX: -45 }}
                animate={{ opacity: 1, scale: 1, rotateX: 0 }}
                exit={{ opacity: 0, scale: 0.8, rotateX: 45 }}
                transition={{ type: "spring", damping: 15 }}
                className="w-full max-w-[320px] group/code"
              >
                <div className="relative p-6 bg-black/60 rounded-2xl border border-white/5 backdrop-blur-xl flex items-center justify-center gap-6 group-hover/code:border-accent/40 transition-all duration-500">
                  <div className="absolute -top-3 left-6 px-3 py-1 bg-black border border-white/10 rounded-md">
                    <span className="text-[8px] font-mono text-white/40 uppercase tracking-widest">Secure_Token</span>
                  </div>
                  <span className="text-3xl font-mono font-black tracking-[0.3em] text-accent drop-shadow-[0_0_15px_rgba(76,215,246,0.5)]">
                    {pairingCode}
                  </span>
                  <button 
                    onClick={handleRefreshCode}
                    disabled={isRefreshing}
                    className={`p-3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/5 transition-all ${isRefreshing ? 'animate-spin' : 'hover:scale-110 active:scale-95'}`}
                  >
                    <RefreshCw className="w-5 h-5 text-white/60" />
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>

          <div className="flex items-center gap-6 pt-4">
            <button 
              onClick={() => setShowQR(!showQR)}
              className="group flex items-center gap-3 px-4 py-2 rounded-full bg-accent/5 border border-accent/20 hover:bg-accent/10 transition-all active:scale-95"
            >
              {showQR ? <Smartphone className="w-4 h-4 text-accent" /> : <QrCode className="w-4 h-4 text-accent" />}
              <span className="label-caps text-[10px] tracking-[0.2em] text-accent">
                {showQR ? "Switch_To_Code" : "Switch_To_QR"}
              </span>
            </button>
            
            <div className="w-px h-4 bg-white/10" />

            <Link 
              to="/mobile" 
              className="flex items-center gap-3 text-[10px] label-caps tracking-[0.2em] text-white/40 hover:text-white transition-all group"
            >
              <ExternalLink className="w-4 h-4 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
              HUD_Simulator
            </Link>
          </div>
        </div>
      </div>

      {/* Paired Devices Registry */}
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <h4 className="label-caps text-[10px] tracking-[0.3em] text-white/30 whitespace-nowrap">Neural_Registry_Nodes</h4>
          <div className="h-px flex-1 bg-gradient-to-r from-white/5 to-transparent"></div>
        </div>

        <div className="grid gap-3">
          <AnimatePresence mode="popLayout">
            {devices?.length > 0 ? (
              devices.map(device => (
                <motion.div 
                  key={device.id}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, scale: 0.95, filter: 'blur(10px)' }}
                  className="hud-panel p-4 flex justify-between items-center group hover:bg-white/[0.02] transition-all"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-accent/5 flex items-center justify-center border border-accent/10 group-hover:border-accent/40 transition-all duration-500">
                      <Smartphone className="w-6 h-6 text-accent/60 group-hover:text-accent group-hover:scale-110 transition-all duration-500" />
                    </div>
                    <div>
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[12px] font-bold text-white tracking-wide">{device.name}</span>
                        <div className="px-1.5 py-0.5 rounded-sm bg-accent/10 border border-accent/20">
                          <span className="text-[8px] font-mono text-accent uppercase tracking-widest">{device.type}</span>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-1.5">
                          <Wifi className="w-3 h-3 text-green-500/60" />
                          <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">Signal_Nominal</span>
                        </div>
                        <span className="text-white/10">•</span>
                        <span className="text-[9px] font-mono text-white/30 uppercase tracking-widest">
                          Last_Seen: {device.last_seen ? new Date(device.last_seen).toLocaleTimeString([], { hour12: false }) : 'OFFLINE'}
                        </span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4">
                    <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-black/40 border border-white/5 rounded-lg group-hover:border-accent/20 transition-all">
                      <div className="w-1.5 h-1.5 rounded-full bg-accent animate-pulse" />
                      <span className="text-[9px] font-mono text-white/40 uppercase tracking-widest">Secure_Node_ID: {device.id.substring(0, 8)}</span>
                    </div>
                    <button 
                      onClick={() => handleUnpair(device.id)}
                      className="p-2.5 rounded-xl hover:bg-red-500/10 text-white/20 hover:text-red-400 transition-all border border-transparent hover:border-red-500/20 active:scale-95"
                      title="Terminate Link"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </motion.div>
              ))
            ) : (
              <div className="hud-panel py-16 flex flex-col items-center justify-center text-center space-y-4 opacity-50">
                <div className="p-5 rounded-full border border-dashed border-white/10">
                  <WifiOff className="w-10 h-10 text-white/20" />
                </div>
                <div>
                  <p className="label-caps text-[10px] tracking-[0.4em] text-white">No_Nodes_Connected</p>
                  <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mt-1">Awaiting_Neural_Handshake</p>
                </div>
              </div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
};
