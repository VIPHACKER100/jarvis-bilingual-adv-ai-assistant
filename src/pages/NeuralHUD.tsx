import React, { useState } from "react";
import { useStore } from "../store";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { apiClient } from "../services/apiClient";
import {
  Mic,
  Send,
  Lightbulb,
  X,
  Wifi,
  ShieldCheck,
  Zap,
  Terminal,
  Activity,
  ChevronRight,
  Triangle,
  RefreshCcw,
  LayoutGrid,
} from "lucide-react";
import { LineChart, Line, ResponsiveContainer, YAxis } from "recharts";

export function NeuralHUD() {
  const systemStatus = useStore((state) => state.systemStatus);
  const history = useStore((state) => state.history);
  const addCommandResult = useStore((state) => state.addCommandResult);
  const isConnected = useStore((state) => state.isConnected);

  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;

    setLoading(true);
    const result = await apiClient.safeRequest(() =>
      apiClient.executeCommand(command),
    );
    if (result) {
      addCommandResult(result);
    } else {
      addCommandResult({
        command,
        response: "Error connecting to backend.",
        language: "en",
        success: false,
      });
    }
    setCommand("");
    setLoading(false);
  };

  // Mock data for charts
  const mockData = Array.from({ length: 20 }, (_, i) => ({
    val: 30 + Math.random() * 40,
  }));

  return (
    <div className="grid grid-cols-12 gap-4 h-full pb-4">
      {/* Left Column (3 spans) */}
      <div className="col-span-3 flex flex-col gap-4">
        {/* Metric Cards */}
        <div className="grid grid-cols-2 gap-4">
          <MetricWidget
            title="CPU USAGE"
            value={`${systemStatus?.cpu_percent ?? 0}%`}
            trend="↑ 2% vs yesterday"
            color="cyan"
            data={mockData}
          />
          <MetricWidget
            title="MEMORY"
            value={`${systemStatus?.memory_percent ?? 0} MB`}
            trend="↑ 8% vs yesterday"
            color="purple"
            data={mockData}
          />
          <MetricWidget
            title="LATENCY"
            value={`${systemStatus?.event_loop_lag ?? 0} ms`}
            trend="↓ 3ms vs yesterday"
            color="emerald"
            data={mockData}
          />
          <MetricWidget
            title="TASKS"
            value="3"
            subValue="Active"
            trend="● Running"
            color="blue"
            data={mockData}
          />
        </div>

        {/* Connection & Agent Status */}
        <div className="grid grid-cols-2 gap-4">
          <Card className="hud-bg hud-border p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20">
              <Wifi size={40} />
            </div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">
              CONNECTION
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 box-shadow-cyan"></div>
              <span className="font-semibold text-emerald-400">Connected</span>
            </div>
            <div className="mt-auto space-y-1">
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
                WebSocket: Live
              </div>
              <div className="flex items-center gap-2 text-[10px] text-slate-400">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
                SSE Stream: Active
              </div>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-4 flex flex-col gap-3 relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">
              AGENT STATUS
            </h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold text-slate-200 text-sm">
                GPT-5{" "}
                <span className="text-[10px] text-slate-500">(OpenAI)</span>
              </span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                ONLINE
              </span>
            </div>
            <div className="mt-auto text-[10px] text-slate-400 space-y-1">
              <div>
                Response Time <span className="text-slate-200">320ms</span>
              </div>
              <div className="flex items-center gap-2">
                Personality:{" "}
                <span className="bg-purple-500/20 text-purple-400 border border-purple-500/30 px-1.5 py-0.5 rounded text-[9px]">
                  JARVIS
                </span>
              </div>
            </div>
          </Card>
        </div>

        {/* Quick Actions */}
        <Card className="hud-bg hud-border p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-1">
            QUICK ACTIONS
          </h3>
          <div className="grid grid-cols-2 gap-2">
            <Button
              variant="secondary"
              className="justify-start px-3 py-2 h-auto border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-950/20"
            >
              <ShieldCheck size={14} className="text-cyan-400 mr-2" />
              <span className="text-xs">Start Scan</span>
            </Button>
            <Button
              variant="secondary"
              className="justify-start px-3 py-2 h-auto border-purple-500/20 hover:border-purple-500/50 bg-purple-950/20"
            >
              <Zap size={14} className="text-purple-400 mr-2" />
              <span className="text-xs">Automation</span>
            </Button>
            <Button
              variant="secondary"
              className="justify-start px-3 py-2 h-auto border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/20"
            >
              <Terminal size={14} className="text-emerald-400 mr-2" />
              <span className="text-xs">Terminal</span>
            </Button>
            <Button
              variant="secondary"
              className="justify-start px-3 py-2 h-auto border-amber-500/20 hover:border-amber-500/50 bg-amber-950/20 text-slate-400 border-dashed"
            >
              <span className="text-xs mx-auto">+ Add Action</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Center Column (5 spans) */}
      <div className="col-span-5 flex flex-col gap-4">
        {/* Smart Suggestion */}
        <div className="bg-gradient-to-r from-amber-950/40 to-transparent border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full text-amber-400">
            <Lightbulb size={16} />
          </div>
          <div>
            <div className="text-xs font-bold text-amber-400 tracking-wider">
              SMART SUGGESTION
            </div>
            <div className="text-sm text-slate-300">
              System memory usage is above 80%.
            </div>
          </div>
          <div className="ml-auto flex items-center gap-2">
            <Button
              size="sm"
              className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30"
            >
              Optimize Now
            </Button>
            <Button
              variant="ghost"
              size="sm"
              className="text-slate-400 hover:text-white px-2"
            >
              <X size={16} />
            </Button>
          </div>
        </div>

        {/* AI Core Arc Reactor */}
        <Card className="flex-1 hud-bg hud-border flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>

          <div className="absolute top-6 flex flex-col items-center">
            <h2 className="text-slate-400 text-xs font-bold tracking-[0.3em]">
              AI CORE
            </h2>
            <div className="text-emerald-400 font-display text-3xl font-bold tracking-wider text-shadow-cyan flex items-center gap-2 mt-1">
              ONLINE{" "}
              <div className="w-2 h-2 bg-emerald-400 rounded-full box-shadow-cyan"></div>
            </div>
          </div>

          {/* Arc Reactor Rings */}
          <div className="relative w-64 h-64 flex items-center justify-center">
            {/* Outer dotted ring */}
            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full animate-[spin_60s_linear_infinite]"></div>
            {/* Middle segmented ring */}
            <div className="absolute inset-4 border-[4px] border-transparent border-t-cyan-500 border-b-cyan-500 border-l-cyan-500/20 border-r-cyan-500/20 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
            {/* Inner solid ring */}
            <div className="absolute inset-10 border-2 border-cyan-400/50 rounded-full box-shadow-cyan flex items-center justify-center bg-cyan-950/20 backdrop-blur-sm">
              <Triangle
                size={48}
                className="text-cyan-400 stroke-[2] drop-shadow-[0_0_8px_rgba(6,182,212,0.8)]"
              />
            </div>
          </div>

          <div className="absolute bottom-6 flex items-center gap-3">
            <div className="h-px w-16 bg-cyan-500/30"></div>
            <span className="text-cyan-400 text-xs font-mono tracking-widest uppercase">
              MODE: <span className="text-slate-200">IDLE</span>
            </span>
            <div className="h-px w-16 bg-cyan-500/30"></div>
          </div>
        </Card>

        {/* Command Input Area */}
        <Card className="hud-bg hud-border p-4 flex flex-col gap-3 relative">
          <form onSubmit={handleCommand} className="flex gap-3">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-950 border border-cyan-500/30 box-shadow-cyan shrink-0">
              <Mic size={20} className="text-cyan-400" />
            </div>
            <div className="relative flex-1">
              <input
                type="text"
                value={command}
                onChange={(e) => setCommand(e.target.value)}
                placeholder="Speak or type a command..."
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-4 pr-12 py-3.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all font-medium text-sm"
                disabled={loading}
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">
                Press Ctrl + K
              </span>
            </div>
            <Button
              type="submit"
              loading={loading}
              className="w-12 h-12 rounded-xl bg-blue-600 hover:bg-blue-500 text-white p-0 flex items-center justify-center"
            >
              <Send size={18} />
            </Button>
          </form>
          <div className="flex items-center justify-between px-2 text-[10px] text-slate-400 uppercase tracking-wide font-semibold mt-1">
            <div className="flex items-center gap-2">
              <Mic size={10} className="text-cyan-500" /> Voice Active
            </div>
            <div className="flex items-center gap-2 text-amber-500">
              Auto Listen
            </div>
            <div className="flex items-center gap-2 text-purple-400">
              Wake Word: JARVIS
            </div>
            <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full"></div>{" "}
              Streaming: On
            </div>
          </div>
        </Card>
      </div>

      {/* Right Column (4 spans) */}
      <div className="col-span-4 flex flex-col gap-4">
        {/* Offline Banner (Mocking) */}
        {!isConnected && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 flex items-start gap-3 relative overflow-hidden">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <ShieldCheck size={20} className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] font-bold text-red-500 tracking-wider">
                CRITICAL
              </div>
              <div className="text-sm font-semibold text-slate-200">
                Backend Offline
              </div>
              <div className="text-[10px] text-slate-400 mt-1">
                Last heartbeat: 2m ago
              </div>
            </div>
            <Button
              size="sm"
              variant="danger"
              className="text-xs h-7 px-2 border-red-500/50"
            >
              Reconnect
            </Button>
          </div>
        )}

        {/* System Health */}
        <Card className="hud-bg hud-border p-5 flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">
              SYSTEM HEALTH
            </h3>
            <span className="text-[10px] text-slate-500 border border-slate-700 px-1.5 py-0.5 rounded">
              24H ∨
            </span>
          </div>

          <div className="space-y-4">
            <HealthRow
              label="Core Temperature"
              icon={<Activity size={14} />}
              value="34.2 °C"
              status="Normal"
              color="emerald"
              data={mockData}
            />
            <HealthRow
              label="Sync Status"
              icon={<RefreshCcw size={14} />}
              value="99%"
              status="Optimal"
              color="emerald"
              data={mockData}
            />
            <HealthRow
              label="Disk Activity"
              icon={<LayoutGrid size={14} />}
              value="22%"
              status="Normal"
              color="emerald"
              data={mockData}
            />
            <HealthRow
              label="Power Usage"
              icon={<Zap size={14} />}
              value="18%"
              status="Optimal"
              color="emerald"
              data={mockData}
            />
          </div>
        </Card>

        {/* Active Modules */}
        <Card className="flex-1 hud-bg hud-border p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">
              ACTIVE MODULES
            </h3>
            <span className="text-xs text-cyan-400 font-mono">
              7 / 12 ONLINE
            </span>
          </div>

          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            <ModuleRow
              name="Vision Overlay v4"
              uptime="2h 45m"
              status="ONLINE"
            />
            <ModuleRow
              name="Bilingual Parser v2"
              uptime="1h 12m"
              status="ONLINE"
            />
            <ModuleRow name="Neural Core" uptime="2h 45m" status="ONLINE" />
            <ModuleRow
              name="Mobile Sync Service"
              uptime="1h 05m"
              status="ONLINE"
            />
            <ModuleRow name="Data Optimizer" uptime="45m" status="OFFLINE" />
            <ModuleRow name="Threat Monitor" uptime="-" status="OFFLINE" />
          </div>

          <Button
            variant="secondary"
            className="w-full mt-3 text-xs h-8 bg-slate-900 border-slate-700 text-slate-300"
          >
            Manage Modules
          </Button>
        </Card>
      </div>
    </div>
  );
}

function MetricWidget({
  title,
  value,
  subValue,
  trend,
  color,
  data,
}: {
  title: string;
  value: string;
  subValue?: string;
  trend: string;
  color: "cyan" | "purple" | "emerald" | "blue";
  data: any[];
}) {
  const colors = {
    cyan: "#22d3ee",
    purple: "#c084fc",
    emerald: "#34d399",
    blue: "#60a5fa",
  };

  return (
    <Card className="bg-slate-950/60 border border-slate-800 p-3 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold tracking-wider text-slate-400 flex items-center gap-1.5 uppercase">
          <div className={`w-1.5 h-1.5 rounded-full bg-${color}-500`}></div>{" "}
          {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-display font-bold text-slate-100">
          {value}
        </span>
        {subValue && (
          <span className="text-xs text-slate-500 font-mono tracking-widest uppercase">
            {subValue}
          </span>
        )}
      </div>
      <span className={`text-[9px] text-${color}-400 font-medium mb-3`}>
        {trend}
      </span>

      <div className="h-8 w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="val"
              stroke={colors[color]}
              strokeWidth={2}
              dot={false}
              isAnimationActive={false}
            />
            <YAxis domain={["auto", "auto"]} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </Card>
  );
}

function HealthRow({ label, icon, value, status, color, data }: any) {
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-500 bg-slate-900 p-1.5 rounded-md border border-slate-800">
        {icon}
      </div>
      <div className="flex-1">
        <div className="text-xs font-mono font-semibold tracking-wide uppercase text-slate-300">{label}</div>
      </div>
      <div className="text-sm font-mono text-slate-200">{value}</div>
      <div className="w-16 h-4 opacity-50">
        <ResponsiveContainer width="100%" height="100%">
          <LineChart data={data}>
            <Line
              type="monotone"
              dataKey="val"
              stroke="#34d399"
              strokeWidth={1}
              dot={false}
            />
            <YAxis domain={["auto", "auto"]} hide />
          </LineChart>
        </ResponsiveContainer>
      </div>
      <div className={`text-[10px] text-${color}-400 w-12 text-right`}>
        {status}
      </div>
    </div>
  );
}

function ModuleRow({ name, uptime, status }: any) {
  const isOnline = status === "ONLINE";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-2">
        <div
          className={`p-1.5 rounded-md ${isOnline ? "bg-cyan-950/50 text-cyan-500" : "bg-red-950/50 text-red-500"}`}
        >
          <ChevronRight size={12} />
        </div>
        <div>
          <div className="text-xs text-slate-300 font-medium">{name}</div>
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">
            Uptime: {uptime}
          </div>
        </div>
      </div>
      <div
        className={`flex items-center gap-1.5 text-[9px] font-bold tracking-wider ${isOnline ? "text-emerald-400" : "text-red-500"}`}
      >
        {status}
        <div
          className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "border border-red-500 bg-transparent"}`}
        ></div>
      </div>
    </div>
  );
}
