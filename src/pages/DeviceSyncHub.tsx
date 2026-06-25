import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";
import {
  Smartphone,
  Laptop,
  RefreshCw,
  Wifi,
  WifiOff,
  HardDrive,
  Battery,
  Signal,
} from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_DEVICES = [
  {
    id: "dev_1",
    name: "Commander-PC",
    type: "desktop",
    status: "connected",
    battery: 100,
    signal: 100,
    lastSync: "Just now",
  },
  {
    id: "dev_2",
    name: "Neural-Link-Phone",
    type: "mobile",
    status: "connected",
    battery: 78,
    signal: 85,
    lastSync: "2m ago",
  },
  {
    id: "dev_3",
    name: "Auxiliary-Pad",
    type: "tablet",
    status: "disconnected",
    battery: 12,
    signal: 0,
    lastSync: "4h ago",
  },
];

export function DeviceSyncHub() {
  const [syncing, setSyncing] = useState<string | null>(null);

  const handleSync = (id: string) => {
    setSyncing(id);
    setTimeout(() => setSyncing(null), 2000);
  };

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-emerald-950/50 border border-emerald-500/30 rounded-lg text-emerald-400">
            <Wifi size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              DEVICE SYNC HUB
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Cross-Platform Integration
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" className="font-mono text-xs">
          <Smartphone size={14} className="mr-2" /> PAIR NEW DEVICE
        </Button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {MOCK_DEVICES.map((device, i) => (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: i * 0.1 }}
            key={device.id}
          >
            <Card
              className={cn(
                "hud-bg hud-border p-6 relative overflow-hidden transition-all group",
                device.status === "connected"
                  ? "hover:border-emerald-500/50"
                  : "opacity-70 grayscale",
              )}
            >
              <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none group-hover:scale-110 transition-transform duration-500">
                {device.type === "desktop" ? (
                  <Laptop size={120} />
                ) : (
                  <Smartphone size={120} />
                )}
              </div>

              <div className="flex justify-between items-start relative z-10">
                <div className="flex items-center gap-3">
                  <div
                    className={cn(
                      "p-2.5 rounded-lg border",
                      device.status === "connected"
                        ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400"
                        : "bg-slate-800 border-slate-700 text-slate-500",
                    )}
                  >
                    {device.type === "desktop" ? (
                      <Laptop size={20} />
                    ) : (
                      <Smartphone size={20} />
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-200 font-display tracking-wide">
                      {device.name}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <div
                        className={cn(
                          "w-1.5 h-1.5 rounded-full",
                          device.status === "connected"
                            ? "bg-emerald-400 animate-pulse"
                            : "bg-slate-500",
                        )}
                      ></div>
                      <span className="text-[10px] font-mono uppercase tracking-widest text-slate-400">
                        {device.status}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2 mt-6 relative z-10">
                <div className="bg-slate-900/50 rounded p-2 text-center border border-slate-800">
                  <Battery
                    size={14}
                    className={cn(
                      "mx-auto mb-1",
                      device.battery > 20 ? "text-emerald-500" : "text-red-500",
                    )}
                  />
                  <span className="text-xs font-mono">{device.battery}%</span>
                </div>
                <div className="bg-slate-900/50 rounded p-2 text-center border border-slate-800">
                  <Signal size={14} className="mx-auto mb-1 text-cyan-500" />
                  <span className="text-xs font-mono">{device.signal}%</span>
                </div>
                <div className="bg-slate-900/50 rounded p-2 text-center border border-slate-800">
                  <HardDrive
                    size={14}
                    className="mx-auto mb-1 text-purple-500"
                  />
                  <span className="text-xs font-mono">{device.type}</span>
                </div>
              </div>

              <div className="mt-6 flex items-center justify-between relative z-10">
                <span className="text-[10px] font-mono text-slate-500">
                  Last Sync: {device.lastSync}
                </span>
                <Button
                  size="sm"
                  variant="ghost"
                  className={cn(
                    "h-8 px-3 text-xs font-mono",
                    device.status !== "connected" && "hidden",
                  )}
                  onClick={() => handleSync(device.id)}
                  disabled={syncing !== null}
                >
                  <RefreshCw
                    size={12}
                    className={cn(
                      "mr-2",
                      syncing === device.id && "animate-spin",
                    )}
                  />
                  {syncing === device.id ? "SYNCING..." : "SYNC NOW"}
                </Button>
              </div>
            </Card>
          </motion.div>
        ))}
      </div>

      <div className="mt-8">
        <h3 className="text-sm font-bold tracking-wider font-display text-slate-400 mb-4 border-b border-cyan-900/30 pb-2">
          DATA STREAMS
        </h3>
        <Card className="hud-bg hud-border p-6 flex flex-col items-center justify-center min-h-[200px] text-center">
          <RefreshCw
            size={32}
            className="text-cyan-900 mb-4 animate-spin-slow"
          />
          <p className="text-slate-400 font-mono text-sm">
            Waiting for active data streams...
          </p>
          <p className="text-[10px] text-slate-500 mt-2 font-mono uppercase tracking-widest">
            Connect a device and initiate a transfer to visualize stream data
          </p>
        </Card>
      </div>
    </div>
  );
}
