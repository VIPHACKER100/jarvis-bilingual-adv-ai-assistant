import React from "react";
import { Card } from "../components/ui/Card";
import { Info, Cpu, Network, Shield, Zap } from "lucide-react";

export function AboutPage() {
  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <Info size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              SYSTEM INFORMATION
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              About JARVIS Core v4.0.0
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hud-bg hud-border p-8 flex flex-col items-center text-center space-y-4">
          <div className="w-32 h-32 rounded-full bg-cyan-950/50 border-2 border-cyan-500/50 flex items-center justify-center shadow-[0_0_30px_rgba(6,182,212,0.2)] mb-4">
            <Cpu size={64} className="text-cyan-400" />
          </div>
          <h1 className="text-3xl font-display font-bold text-slate-100 tracking-wider">
            JARVIS OS
          </h1>
          <div className="flex gap-2 text-xs font-mono">
            <span className="px-2 py-1 bg-cyan-950 text-cyan-400 rounded border border-cyan-900/50">
              BUILD 4021.5
            </span>
            <span className="px-2 py-1 bg-indigo-950 text-indigo-400 rounded border border-indigo-900/50">
              KERNEL v9.4.2
            </span>
          </div>
          <p className="text-slate-400 text-sm max-w-md mt-4">
            Just A Rather Very Intelligent System. An advanced neural interface
            designed to integrate seamlessly with host machine operations,
            providing unparalleled control, automation, and security oversight.
          </p>
        </Card>

        <div className="space-y-6">
          <Card className="hud-bg hud-border p-6 group hover:border-cyan-500/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-cyan-500 group-hover:text-cyan-400 transition-colors">
                <Network size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 font-display tracking-wider mb-1">
                  Neural Network Hub
                </h3>
                <p className="text-sm text-slate-400 font-mono">
                  Synchronized across 4 active nodes. Real-time telemetry and
                  seamless command execution over encrypted WebSockets.
                </p>
              </div>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-6 group hover:border-emerald-500/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-emerald-500 group-hover:text-emerald-400 transition-colors">
                <Shield size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 font-display tracking-wider mb-1">
                  Security Architecture
                </h3>
                <p className="text-sm text-slate-400 font-mono">
                  Zero-trust environment with AES-256 encryption. Continuous
                  threat monitoring and active firewall mitigation protocols.
                </p>
              </div>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-6 group hover:border-amber-500/50 transition-colors">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-slate-900/80 border border-slate-700 rounded-lg text-amber-500 group-hover:text-amber-400 transition-colors">
                <Zap size={24} />
              </div>
              <div>
                <h3 className="font-bold text-slate-200 font-display tracking-wider mb-1">
                  Automation Engine
                </h3>
                <p className="text-sm text-slate-400 font-mono">
                  Quantum-inspired macro processor for executing complex node
                  graphs and autonomous task delegation.
                </p>
              </div>
            </div>
          </Card>
        </div>
      </div>

      <div className="text-center mt-auto pt-8 border-t border-cyan-900/30">
        <p className="text-xs text-slate-600 font-mono tracking-widest uppercase">
          © {new Date().getFullYear()} Stark Industries. All rights reserved.
        </p>
      </div>
    </div>
  );
}
