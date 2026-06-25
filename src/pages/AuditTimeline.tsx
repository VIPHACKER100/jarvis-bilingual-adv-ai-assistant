import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";
import {
  Clock,
  Filter,
  Terminal,
  Search,
  CalendarDays,
  BarChart2,
} from "lucide-react";
import { cn } from "../lib/utils";
import {
  LineChart,
  Line,
  ResponsiveContainer,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
} from "recharts";

const MOCK_EVENTS = [
  {
    id: 1,
    time: "10:45 AM",
    type: "command",
    content: "Scan network for vulnerable open ports",
    processing_time: 1420,
  },
  {
    id: 2,
    time: "10:46 AM",
    type: "system",
    content: "Network scan initiated on subnet 192.168.1.0/24",
    processing_time: 0,
  },
  {
    id: 3,
    time: "10:48 AM",
    type: "response",
    content: "Scan complete. Found 3 devices with port 22 open.",
    processing_time: 350,
  },
  {
    id: 4,
    time: "11:12 AM",
    type: "command",
    content: "Summarize meeting notes from clipboard",
    processing_time: 4200,
  },
  {
    id: 5,
    time: "11:12 AM",
    type: "response",
    content: "Summary generated and saved to /docs/summary.md",
    processing_time: 800,
  },
  {
    id: 6,
    time: "11:30 AM",
    type: "error",
    content: "Failed to connect to secondary database node",
    processing_time: 0,
  },
];

const MOCK_CHART_DATA = Array.from({ length: 24 }).map((_, i) => ({
  time: `${i}:00`,
  requests: Math.floor(Math.random() * 50) + 10,
  latency: Math.floor(Math.random() * 200) + 50,
}));

export function AuditTimeline() {
  const [filter, setFilter] = useState("all");

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-950/50 border border-blue-500/30 rounded-lg text-blue-400">
            <Clock size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              AUDIT TIMELINE
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Chronological Event Logs
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button variant="outline" size="sm" className="font-mono text-xs">
            <CalendarDays size={14} className="mr-2" /> TODAY
          </Button>
          <Button variant="primary" size="sm" className="font-mono text-xs">
            <Filter size={14} className="mr-2" /> EXPORT LOGS
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* Timeline Panel */}
        <Card className="lg:col-span-2 hud-bg hud-border flex flex-col overflow-hidden">
          <div className="p-3 border-b border-cyan-900/30 bg-slate-950/50 flex items-center justify-between shrink-0">
            <div className="flex gap-2">
              {["all", "command", "response", "system"].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilter(f)}
                  className={cn(
                    "px-3 py-1 rounded text-[10px] font-mono tracking-wider uppercase transition-colors border",
                    filter === f
                      ? "bg-cyan-500/20 text-cyan-300 border-cyan-500/50"
                      : "bg-slate-900/50 text-slate-500 border-transparent hover:text-slate-300 hover:bg-slate-800",
                  )}
                >
                  {f}
                </button>
              ))}
            </div>

            <div className="relative">
              <Search
                size={12}
                className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Search logs..."
                className="bg-slate-900 border border-cyan-900/50 rounded pl-7 pr-2 py-1 text-xs font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500/50 w-40"
              />
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-6 relative">
            {/* Vertical Line */}
            <div className="absolute left-[39px] top-6 bottom-6 w-px bg-cyan-900/30"></div>

            <div className="space-y-6 relative">
              {MOCK_EVENTS.filter(
                (e) => filter === "all" || e.type === filter,
              ).map((event, i) => (
                <motion.div
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.1 }}
                  key={event.id}
                  className="flex gap-6 relative"
                >
                  <div className="w-20 text-right shrink-0 pt-1">
                    <span className="text-[10px] font-mono text-slate-500">
                      {event.time}
                    </span>
                  </div>

                  <div className="relative z-10 shrink-0">
                    <div
                      className={cn(
                        "w-6 h-6 rounded-full flex items-center justify-center border bg-slate-950",
                        event.type === "command"
                          ? "text-cyan-400 border-cyan-500/50 box-shadow-cyan"
                          : event.type === "response"
                            ? "text-purple-400 border-purple-500/50"
                            : event.type === "error"
                              ? "text-red-400 border-red-500/50"
                              : "text-slate-400 border-slate-500/50",
                      )}
                    >
                      <div
                        className={cn(
                          "w-2 h-2 rounded-full",
                          event.type === "command"
                            ? "bg-cyan-400"
                            : event.type === "response"
                              ? "bg-purple-400"
                              : event.type === "error"
                                ? "bg-red-400"
                                : "bg-slate-400",
                        )}
                      ></div>
                    </div>
                  </div>

                  <Card className="flex-1 p-3 bg-slate-900/40 border-slate-800/50 hover:bg-slate-900/80 transition-colors">
                    <div className="flex items-start justify-between gap-4">
                      <p
                        className={cn(
                          "text-sm font-mono leading-relaxed",
                          event.type === "error"
                            ? "text-red-300"
                            : "text-slate-300",
                        )}
                      >
                        {event.type === "command" && (
                          <span className="text-cyan-500 mr-2">{">"}</span>
                        )}
                        {event.content}
                      </p>
                      {event.processing_time > 0 && (
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {event.processing_time}ms
                        </span>
                      )}
                    </div>
                  </Card>
                </motion.div>
              ))}
            </div>
          </div>
        </Card>

        {/* Stats Panel */}
        <div className="space-y-6 flex flex-col">
          <Card className="hud-bg hud-border p-5">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/30 pb-2 mb-4">
              <BarChart2 size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase font-display">
                System Activity
              </h3>
            </div>

            <div className="h-32 mt-4">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={MOCK_CHART_DATA}>
                  <defs>
                    <linearGradient id="colorReq" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3} />
                      <stop offset="95%" stopColor="#22d3ee" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#020617",
                      borderColor: "#164e63",
                      fontSize: "12px",
                      fontFamily: "monospace",
                    }}
                    itemStyle={{ color: "#22d3ee" }}
                  />
                  <Area
                    type="monotone"
                    dataKey="requests"
                    stroke="#22d3ee"
                    fillOpacity={1}
                    fill="url(#colorReq)"
                    strokeWidth={2}
                  />
                </AreaChart>
              </ResponsiveContainer>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">
                  Total Logs
                </p>
                <p className="text-xl font-bold font-display text-cyan-400">
                  1,204
                </p>
              </div>
              <div className="bg-slate-900/50 p-3 rounded border border-slate-800">
                <p className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-1">
                  Avg Latency
                </p>
                <p className="text-xl font-bold font-display text-purple-400">
                  142ms
                </p>
              </div>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-5 flex-1">
            <div className="flex items-center gap-2 text-slate-400 border-b border-slate-800 pb-2 mb-4">
              <Terminal size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase font-display">
                Top Commands
              </h3>
            </div>

            <div className="space-y-3 mt-4 font-mono text-xs">
              {[
                { cmd: "scan network", count: 42, pct: 85 },
                { cmd: "summarize text", count: 28, pct: 60 },
                { cmd: "open terminal", count: 15, pct: 35 },
                { cmd: "check status", count: 12, pct: 25 },
              ].map((item, i) => (
                <div key={i} className="space-y-1">
                  <div className="flex justify-between text-slate-300">
                    <span>{item.cmd}</span>
                    <span className="text-cyan-500">{item.count}</span>
                  </div>
                  <div className="h-1 bg-slate-900 rounded overflow-hidden">
                    <div
                      className="h-full bg-cyan-500/50"
                      style={{ width: `${item.pct}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
