import { useState } from "react";
import { useStore } from "@/store";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { apiClient } from "@/services/api";
import {
  Mic, Send, Lightbulb, X, Wifi, ShieldCheck, Zap, Terminal,
  Activity, ChevronRight, Triangle, LayoutGrid,
} from "lucide-react";

export function NeuralHUD() {
  const addHistory = useStore((s) => s.addHistory);
  const isConnected = useStore((s) => s.isConnected);
  const [command, setCommand] = useState("");
  const [loading, setLoading] = useState(false);

  const handleCommand = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!command.trim()) return;
    setLoading(true);
    try {
      const result = await apiClient.post<{ success: boolean; response?: string }>("/command", { command, language: "en" });
      addHistory({ command, response: result.response ?? "Done" });
    } catch {
      addHistory({ command, response: "Error connecting to backend." });
    }
    setCommand("");
    setLoading(false);
  };

  const mockData = Array.from({ length: 20 }, () => 30 + Math.random() * 40);

  const Sparkline = ({ data, color = "#22d3ee" }: { data: number[]; color?: string }) => {
    const max = Math.max(...data);
    const min = Math.min(...data);
    const range = max - min || 1;
    const w = 100 / (data.length - 1);
    const points = data.map((d, i) => `${i * w},${30 - ((d - min) / range) * 28}`).join(" ");
    return <svg viewBox="0 0 100 30" className="w-full h-full"><polyline fill="none" stroke={color} strokeWidth="1.5" points={points} /></svg>;
  };

  return (
    <div className="grid grid-cols-1 gap-4 h-full pb-4 xl:grid-cols-12">
      <div className="flex flex-col gap-4 xl:col-span-3">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <MetricWidget title="CPU USAGE" value="0%" trend="" color="cyan" data={mockData} Sparkline={Sparkline} />
          <MetricWidget title="MEMORY" value="0%" trend="" color="purple" data={mockData} Sparkline={Sparkline} />
          <MetricWidget title="LATENCY" value="0 ms" trend="" color="emerald" data={mockData} Sparkline={Sparkline} />
          <MetricWidget title="TASKS" value="3" subValue="Active" trend="● Running" color="blue" data={mockData} Sparkline={Sparkline} />
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
          <Card className="hud-bg hud-border p-4 flex flex-col gap-3 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 opacity-20"><Wifi size={40} /></div>
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">CONNECTION</h3>
            <div className="flex items-center gap-2 mt-2">
              <div className={`w-2 h-2 rounded-full ${isConnected ? 'bg-emerald-500' : 'bg-red-500'}`} />
              <span className={`font-semibold ${isConnected ? 'text-emerald-400' : 'text-red-400'}`}>
                {isConnected ? 'Connected' : 'Offline'}
              </span>
            </div>
          </Card>
          <Card className="hud-bg hud-border p-4 flex flex-col gap-3 relative overflow-hidden">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">AGENT STATUS</h3>
            <div className="flex items-center gap-2 mt-2">
              <span className="font-semibold text-slate-200 text-sm">GPT-5 <span className="text-[10px] text-slate-500">(OpenAI)</span></span>
              <span className="text-[9px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">ONLINE</span>
            </div>
          </Card>
        </div>

        <Card className="hud-bg hud-border p-4 flex flex-col gap-3">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider mb-1">QUICK ACTIONS</h3>
          <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <Button variant="secondary" className="justify-start px-3 py-2 h-auto border-cyan-500/20 hover:border-cyan-500/50 bg-cyan-950/20">
              <ShieldCheck size={14} className="text-cyan-400 mr-2" /><span className="text-xs">Start Scan</span>
            </Button>
            <Button variant="secondary" className="justify-start px-3 py-2 h-auto border-purple-500/20 hover:border-purple-500/50 bg-purple-950/20">
              <Zap size={14} className="text-purple-400 mr-2" /><span className="text-xs">Automation</span>
            </Button>
            <Button variant="secondary" className="justify-start px-3 py-2 h-auto border-emerald-500/20 hover:border-emerald-500/50 bg-emerald-950/20">
              <Terminal size={14} className="text-emerald-400 mr-2" /><span className="text-xs">Terminal</span>
            </Button>
          </div>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:col-span-5">
        <div className="bg-gradient-to-r from-amber-950/40 to-transparent border border-amber-500/30 rounded-lg p-3 flex items-center gap-3">
          <div className="p-2 bg-amber-500/20 rounded-full text-amber-400"><Lightbulb size={16} /></div>
          <div className="flex-1">
            <div className="text-xs font-bold text-amber-400 tracking-wider">SMART SUGGESTION</div>
            <div className="text-sm text-slate-300">System running smoothly.</div>
          </div>
          <Button size="sm" className="bg-cyan-600/20 text-cyan-400 border border-cyan-500/50 hover:bg-cyan-500/30">Optimize</Button>
          <Button variant="ghost" size="sm" className="text-slate-400 px-2"><X size={16} /></Button>
        </div>

        <Card className="flex-1 hud-bg hud-border flex items-center justify-center relative overflow-hidden">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-cyan-900/20 via-transparent to-transparent"></div>
          <div className="absolute top-6 flex flex-col items-center">
            <h2 className="text-slate-400 text-xs font-bold tracking-[0.3em]">AI CORE</h2>
            <div className="text-emerald-400 font-display text-3xl font-bold tracking-wider flex items-center gap-2 mt-1">
              ONLINE <div className="w-2 h-2 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(52,211,153,0.8)]" />
            </div>
          </div>
          <div className="relative flex h-48 w-48 items-center justify-center sm:h-64 sm:w-64">
            <div className="absolute inset-0 border-2 border-dashed border-cyan-500/30 rounded-full animate-[spin_60s_linear_infinite]"></div>
            <div className="absolute inset-4 border-[4px] border-transparent border-t-cyan-500 border-b-cyan-500 rounded-full animate-[spin_20s_linear_infinite_reverse]"></div>
            <div className="absolute inset-10 border-2 border-cyan-400/50 rounded-full flex items-center justify-center bg-cyan-950/20 backdrop-blur-sm">
              <Triangle size={48} className="text-cyan-400" />
            </div>
          </div>
        </Card>

        <Card className="hud-bg hud-border p-4 flex flex-col gap-3">
          <form onSubmit={handleCommand} className="flex flex-col gap-3 sm:flex-row">
            <div className="flex items-center justify-center w-12 h-12 rounded-full bg-cyan-950 border border-cyan-500/30 shrink-0">
              <Mic size={20} className="text-cyan-400" />
            </div>
            <div className="relative flex-1">
              <input type="text" value={command} onChange={(e) => setCommand(e.target.value)}
                placeholder="Type a command..." disabled={loading}
                className="w-full bg-slate-900/50 border border-slate-700/50 rounded-xl pl-4 pr-12 py-3.5 text-slate-100 focus:outline-none focus:ring-1 focus:ring-cyan-500/50 transition-all text-sm" />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] text-slate-500 font-mono">Ctrl+K</span>
            </div>
            <Button type="submit" loading={loading} className="h-12 w-full rounded-xl sm:w-12 flex items-center justify-center">
              <Send size={18} />
            </Button>
          </form>
        </Card>
      </div>

      <div className="flex flex-col gap-4 xl:col-span-4">
        {!isConnected && (
          <div className="bg-red-950/40 border border-red-500/30 rounded-lg p-3 flex items-start gap-3">
            <div className="absolute top-0 left-0 w-1 h-full bg-red-500"></div>
            <ShieldCheck size={20} className="text-red-500 mt-0.5" />
            <div className="flex-1">
              <div className="text-[10px] font-bold text-red-500 tracking-wider">CRITICAL</div>
              <div className="text-sm font-semibold text-slate-200">Backend Offline</div>
            </div>
          </div>
        )}

        <Card className="hud-bg hud-border p-5 flex flex-col gap-4">
          <h3 className="text-xs font-bold text-slate-400 tracking-wider">SYSTEM HEALTH</h3>
          <div className="space-y-4">
            <HealthRow label="Core Temperature" icon={<Activity size={14} />} value="34.2 °C" status="Normal" color="emerald" data={mockData} Sparkline={Sparkline} />
            <HealthRow label="Disk Activity" icon={<LayoutGrid size={14} />} value="22%" status="Normal" color="emerald" data={mockData} Sparkline={Sparkline} />
            <HealthRow label="Power Usage" icon={<Zap size={14} />} value="18%" status="Optimal" color="emerald" data={mockData} Sparkline={Sparkline} />
          </div>
        </Card>

        <Card className="flex-1 hud-bg hud-border p-4 flex flex-col min-h-0">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-xs font-bold text-slate-400 tracking-wider">ACTIVE MODULES</h3>
            <span className="text-xs text-cyan-400 font-mono">7 / 12 ONLINE</span>
          </div>
          <div className="flex-1 overflow-y-auto space-y-2 pr-2">
            <ModuleRow name="Neural Core" uptime="2h 45m" status="ONLINE" />
            <ModuleRow name="Bilingual Parser" uptime="1h 12m" status="ONLINE" />
            <ModuleRow name="Vision Overlay" uptime="2h 45m" status="ONLINE" />
            <ModuleRow name="Mobile Sync" uptime="1h 05m" status="ONLINE" />
            <ModuleRow name="Data Optimizer" uptime="45m" status="OFFLINE" />
          </div>
        </Card>
      </div>
    </div>
  );
}

function MetricWidget({ title, value, subValue, trend, color, data, Sparkline }: any) {
  const dotColors: Record<string, string> = { cyan: "bg-cyan-500", purple: "bg-purple-500", emerald: "bg-emerald-500", blue: "bg-blue-500" };
  const textColors: Record<string, string> = { cyan: "text-cyan-400", purple: "text-purple-400", emerald: "text-emerald-400", blue: "text-blue-400" };
  const chartColors: Record<string, string> = { cyan: "#22d3ee", purple: "#c084fc", emerald: "#34d399", blue: "#60a5fa" };
  return (
    <Card className="bg-slate-950/60 border border-slate-800 p-3 flex flex-col relative overflow-hidden group hover:border-slate-700 transition-colors">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-bold tracking-wider text-slate-400 flex items-center gap-1.5 uppercase">
          <div className={`w-1.5 h-1.5 rounded-full ${dotColors[color] ?? "bg-cyan-500"}`} /> {title}
        </span>
      </div>
      <div className="flex items-baseline gap-1 mb-1">
        <span className="text-2xl font-display font-bold text-slate-100">{value}</span>
        {subValue && <span className="text-xs text-slate-500 font-mono">{subValue}</span>}
      </div>
      <span className={`text-[9px] ${textColors[color] ?? "text-cyan-400"} font-medium mb-3`}>{trend}</span>
      <div className="h-8 w-full mt-auto opacity-70 group-hover:opacity-100 transition-opacity">
        <Sparkline data={data} color={chartColors[color]} />
      </div>
    </Card>
  );
}

function HealthRow({ label, icon, value, status, color, data, Sparkline }: any) {
  const statusColors: Record<string, string> = { emerald: "text-emerald-400", cyan: "text-cyan-400", purple: "text-purple-400" };
  return (
    <div className="flex items-center gap-3">
      <div className="text-slate-500 bg-slate-900 p-1.5 rounded-md border border-slate-800">{icon}</div>
      <div className="flex-1"><div className="text-xs font-mono font-semibold tracking-wide uppercase text-slate-300">{label}</div></div>
      <div className="text-sm font-mono text-slate-200">{value}</div>
      <div className="w-16 h-4 opacity-50"><Sparkline data={data} /></div>
      <div className={`text-[10px] ${statusColors[color] ?? "text-emerald-400"} w-12 text-right`}>{status}</div>
    </div>
  );
}

function ModuleRow({ name, uptime, status }: any) {
  const isOnline = status === "ONLINE";
  return (
    <div className="flex items-center justify-between py-1.5 border-b border-slate-800/50 last:border-0">
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-md ${isOnline ? "bg-cyan-950/50 text-cyan-500" : "bg-red-950/50 text-red-500"}`}>
          <ChevronRight size={12} />
        </div>
        <div>
          <div className="text-xs text-slate-300 font-medium">{name}</div>
          <div className="text-[9px] text-slate-500 font-mono uppercase tracking-wider">Uptime: {uptime}</div>
        </div>
      </div>
      <div className={`flex items-center gap-1.5 text-[9px] font-bold tracking-wider ${isOnline ? "text-emerald-400" : "text-red-500"}`}>
        {status}
        <div className={`w-1.5 h-1.5 rounded-full ${isOnline ? "bg-emerald-500" : "border border-red-500 bg-transparent"}`} />
      </div>
    </div>
  );
}
