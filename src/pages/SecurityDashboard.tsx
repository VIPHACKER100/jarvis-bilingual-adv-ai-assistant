import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";
import {
  ShieldAlert,
  Activity,
  Cpu,
  Network,
  Search,
  AlertOctagon,
  TerminalSquare,
  ShieldCheck,
  Crosshair,
  Lock,
  Play,
  Square,
  RefreshCcw,
} from "lucide-react";
import { cn } from "../lib/utils";

interface Process {
  id: number;
  name: string;
  cpu: number;
  mem: number;
  status: "Running" | "Suspended" | "Terminated";
  threat: "Low" | "Medium" | "High" | "Critical";
}

const MOCK_PROCESSES: Process[] = [
  {
    id: 1024,
    name: "neural_core.exe",
    cpu: 12.4,
    mem: 240,
    status: "Running",
    threat: "Low",
  },
  {
    id: 4502,
    name: "chrome.exe",
    cpu: 4.2,
    mem: 1200,
    status: "Running",
    threat: "Low",
  },
  {
    id: 893,
    name: "unknown_agent.sys",
    cpu: 0.1,
    mem: 12,
    status: "Suspended",
    threat: "High",
  },
  {
    id: 1102,
    name: "system_idle",
    cpu: 80.5,
    mem: 4,
    status: "Running",
    threat: "Low",
  },
  {
    id: 5633,
    name: "discord.exe",
    cpu: 1.2,
    mem: 350,
    status: "Running",
    threat: "Low",
  },
  {
    id: 9942,
    name: "svchost.exe",
    cpu: 0.5,
    mem: 85,
    status: "Running",
    threat: "Medium",
  },
  {
    id: 1002,
    name: "telemetry_upload.exe",
    cpu: 5.8,
    mem: 42,
    status: "Running",
    threat: "Critical",
  },
];

export function SecurityDashboard() {
  const [activeTab, setActiveTab] = useState<
    "processes" | "network" | "alerts"
  >("processes");
  const [search, setSearch] = useState("");

  const filteredProcesses = MOCK_PROCESSES.filter((p) =>
    p.name.toLowerCase().includes(search.toLowerCase()),
  );

  const getThreatColor = (threat: string) => {
    switch (threat) {
      case "Low":
        return "text-emerald-400 bg-emerald-500/10 border-emerald-500/20";
      case "Medium":
        return "text-amber-400 bg-amber-500/10 border-amber-500/20";
      case "High":
        return "text-orange-400 bg-orange-500/10 border-orange-500/20";
      case "Critical":
        return "text-red-400 bg-red-500/10 border-red-500/20 shadow-[0_0_10px_rgba(239,68,68,0.5)]";
      default:
        return "text-slate-400 bg-slate-500/10 border-slate-500/20";
    }
  };

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-red-950/50 border border-red-500/30 rounded-lg text-red-400 shadow-[0_0_15px_rgba(239,68,68,0.3)]">
            <ShieldAlert size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              THREAT & FIREWALL
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
              </span>
              <p className="text-[10px] text-emerald-400 tracking-widest uppercase font-mono">
                System Secure • Zero Active Breaches
              </p>
            </div>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="ghost" size="sm" className="font-mono text-xs">
            <RefreshCcw size={14} className="mr-2" /> REFRESH
          </Button>
          <Button
            variant="danger"
            size="sm"
            className="font-mono text-xs box-shadow-red shadow-[0_0_15px_rgba(239,68,68,0.4)]"
          >
            <Lock size={14} className="mr-2" /> LOCKDOWN
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 shrink-0">
        <Card className="hud-bg hud-border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
              Active Processes
            </p>
            <h4 className="text-2xl font-bold text-cyan-400 font-display">
              142
            </h4>
          </div>
          <Activity size={24} className="text-cyan-500/50" />
        </Card>
        <Card className="hud-bg hud-border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
              Network Conns
            </p>
            <h4 className="text-2xl font-bold text-purple-400 font-display">
              28
            </h4>
          </div>
          <Network size={24} className="text-purple-500/50" />
        </Card>
        <Card className="hud-bg hud-border p-4 flex items-center justify-between border-red-500/30 bg-red-950/10">
          <div>
            <p className="text-[10px] text-red-400 font-mono tracking-widest uppercase mb-1">
              Quarantined
            </p>
            <h4 className="text-2xl font-bold text-red-400 font-display">3</h4>
          </div>
          <AlertOctagon size={24} className="text-red-500/50" />
        </Card>
        <Card className="hud-bg hud-border p-4 flex items-center justify-between">
          <div>
            <p className="text-[10px] text-slate-400 font-mono tracking-widest uppercase mb-1">
              Firewall Status
            </p>
            <h4 className="text-lg font-bold text-emerald-400 font-display mt-1">
              ARMED
            </h4>
          </div>
          <ShieldCheck size={24} className="text-emerald-500/50" />
        </Card>
      </div>

      <Card className="flex-1 hud-bg hud-border flex flex-col overflow-hidden min-h-0">
        <div className="flex items-center justify-between p-2 border-b border-cyan-900/30 bg-slate-950/50 shrink-0">
          <div className="flex p-1 bg-slate-900 rounded-md">
            {[
              { id: "processes", label: "Process Monitor", icon: Cpu },
              { id: "network", label: "Network Graph", icon: Network },
              { id: "alerts", label: "Threat Log", icon: TerminalSquare },
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={cn(
                  "flex items-center gap-2 px-3 py-1.5 rounded text-xs font-mono tracking-wider uppercase transition-colors",
                  activeTab === tab.id
                    ? "bg-cyan-950/60 text-cyan-400 shadow-[inset_0_1px_0_rgba(34,211,238,0.2)]"
                    : "text-slate-500 hover:text-slate-300",
                )}
              >
                <tab.icon size={14} />
                {tab.label}
              </button>
            ))}
          </div>

          {activeTab === "processes" && (
            <div className="relative">
              <Search
                size={14}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Search processes..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="bg-slate-900 border border-cyan-900/50 rounded pl-8 pr-3 py-1.5 text-xs font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500/50 w-48 transition-all focus:w-64"
              />
            </div>
          )}
        </div>

        <div className="flex-1 overflow-auto p-4">
          <AnimatePresence mode="wait">
            {activeTab === "processes" && (
              <motion.div
                key="processes"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -10 }}
                className="w-full"
              >
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="border-b border-slate-800 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                      <th className="pb-3 pl-2 font-normal">PID</th>
                      <th className="pb-3 font-normal">Process Name</th>
                      <th className="pb-3 font-normal">CPU %</th>
                      <th className="pb-3 font-normal">Memory</th>
                      <th className="pb-3 font-normal">Status</th>
                      <th className="pb-3 font-normal">Threat Level</th>
                      <th className="pb-3 pr-2 text-right font-normal">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="font-mono text-xs">
                    {filteredProcesses.map((process, i) => (
                      <motion.tr
                        initial={{ opacity: 0, x: -10 }}
                        animate={{ opacity: 1, x: 0 }}
                        transition={{ delay: i * 0.05 }}
                        key={process.id}
                        className="border-b border-slate-800/50 hover:bg-cyan-950/10 transition-colors group"
                      >
                        <td className="py-3 pl-2 text-slate-500">
                          {process.id}
                        </td>
                        <td className="py-3 font-bold text-slate-300">
                          {process.name}
                        </td>
                        <td className="py-3 text-cyan-400">
                          {process.cpu.toFixed(1)}%
                        </td>
                        <td className="py-3 text-purple-400">
                          {process.mem} MB
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded-full text-[9px] uppercase border",
                              process.status === "Running"
                                ? "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                                : "bg-slate-500/10 text-slate-400 border-slate-500/20",
                            )}
                          >
                            {process.status}
                          </span>
                        </td>
                        <td className="py-3">
                          <span
                            className={cn(
                              "px-2 py-0.5 rounded text-[9px] uppercase border flex w-fit items-center gap-1",
                              getThreatColor(process.threat),
                            )}
                          >
                            {process.threat === "Critical" && (
                              <AlertOctagon size={10} />
                            )}
                            {process.threat}
                          </span>
                        </td>
                        <td className="py-3 pr-2 text-right opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="flex justify-end gap-2">
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-amber-400 hover:bg-amber-500/20 hover:text-amber-300"
                            >
                              <Square size={12} />
                            </Button>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="h-6 w-6 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300"
                            >
                              <Crosshair size={12} />
                            </Button>
                          </div>
                        </td>
                      </motion.tr>
                    ))}
                  </tbody>
                </table>
              </motion.div>
            )}

            {activeTab === "network" && (
              <motion.div
                key="network"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="h-full flex flex-col items-center justify-center text-slate-500 font-mono text-sm"
              >
                <Network size={48} className="mb-4 text-cyan-900 opacity-50" />
                <p>Network Graph Visualization Offline</p>
                <p className="text-[10px] mt-2 text-slate-600">
                  Requires pcap driver injection
                </p>
              </motion.div>
            )}

            {activeTab === "alerts" && (
              <motion.div
                key="alerts"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                className="font-mono text-xs space-y-2"
              >
                {[
                  {
                    time: "14:22:05",
                    level: "WARN",
                    msg: "Unauthorized registry read attempt blocked",
                    proc: "unknown_agent.sys",
                  },
                  {
                    time: "13:05:11",
                    level: "INFO",
                    msg: "Firewall rules updated successfully",
                    proc: "SYSTEM",
                  },
                  {
                    time: "11:42:33",
                    level: "CRIT",
                    msg: "Outbound connection to known malicious IP dropped",
                    proc: "telemetry_upload.exe",
                  },
                ].map((log, i) => (
                  <div
                    key={i}
                    className="flex items-start gap-4 p-2 rounded bg-slate-900/50 border border-slate-800/50 font-mono"
                  >
                    <span className="text-slate-500">{log.time}</span>
                    <span
                      className={cn(
                        "w-12 font-bold",
                        log.level === "CRIT"
                          ? "text-red-500"
                          : log.level === "WARN"
                            ? "text-amber-500"
                            : "text-cyan-500",
                      )}
                    >
                      {log.level}
                    </span>
                    <span className="text-slate-300 flex-1">{log.msg}</span>
                    <span className="text-purple-400/70">[{log.proc}]</span>
                  </div>
                ))}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </Card>
    </div>
  );
}
