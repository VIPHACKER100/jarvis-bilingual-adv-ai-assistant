import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";
import {
  Settings,
  Play,
  Plus,
  Clock,
  Cpu,
  Power,
  PowerOff,
  Settings2,
  Trash2,
} from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_TASKS = [
  {
    id: 1,
    name: "Daily Backup Routine",
    schedule: "02:00 AM",
    status: "active",
    lastRun: "Today, 02:00 AM",
  },
  {
    id: 2,
    name: "Cache Clearance",
    schedule: "Every 6 hours",
    status: "active",
    lastRun: "Today, 08:00 AM",
  },
  {
    id: 3,
    name: "System Diagnostic",
    schedule: "Weekly, Sun",
    status: "inactive",
    lastRun: "Never",
  },
];

const MOCK_MACROS = [
  { id: 1, name: "Launch Dev Environment", actions: 4, hotkey: "Ctrl+Shift+D" },
  { id: 2, name: "Kill Unresponsive Tasks", actions: 2, hotkey: "Alt+K" },
  { id: 3, name: "Activate Focus Mode", actions: 5, hotkey: "Ctrl+Alt+F" },
];

export function AutomationDashboard() {
  const [tasks, setTasks] = useState(MOCK_TASKS);

  const toggleTask = (id: number) => {
    setTasks(
      tasks.map((t) =>
        t.id === id
          ? { ...t, status: t.status === "active" ? "inactive" : "active" }
          : t,
      ),
    );
  };

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-purple-950/50 border border-purple-500/30 rounded-lg text-purple-400 shadow-[0_0_15px_rgba(168,85,247,0.3)]">
            <Cpu size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              AUTOMATION ENGINE
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Cron Jobs & Macros
            </p>
          </div>
        </div>

        <Button variant="primary" size="sm" className="font-mono text-xs">
          <Plus size={14} className="mr-2" /> NEW AUTOMATION
        </Button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="hud-bg hud-border p-5 flex flex-col">
          <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/30 pb-2 mb-4">
            <Clock size={18} />
            <h3 className="text-sm font-bold tracking-wider font-display">
              SCHEDULED TASKS
            </h3>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2">
            {tasks.map((task) => (
              <div
                key={task.id}
                className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-cyan-500/30 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-slate-200 font-display text-lg">
                    {task.name}
                  </h4>
                  <p className="text-xs text-slate-400 font-mono mt-1">
                    Schedule: {task.schedule}
                  </p>
                  <p className="text-[10px] text-slate-500 font-mono mt-1">
                    Last Run: {task.lastRun}
                  </p>
                </div>

                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleTask(task.id)}
                    className={cn(
                      "w-12 h-6 rounded-full relative transition-colors border",
                      task.status === "active"
                        ? "bg-cyan-950 border-cyan-500/50"
                        : "bg-slate-900 border-slate-700",
                    )}
                  >
                    <motion.div
                      className={cn(
                        "w-4 h-4 rounded-full absolute top-1/2 -translate-y-1/2",
                        task.status === "active"
                          ? "bg-cyan-400 box-shadow-cyan left-[26px]"
                          : "bg-slate-500 left-[6px]",
                      )}
                      layout
                      transition={{
                        type: "spring",
                        stiffness: 500,
                        damping: 30,
                      }}
                    />
                  </button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-500 hover:text-cyan-400 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Settings2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>

        <Card className="hud-bg hud-border p-5 flex flex-col">
          <div className="flex items-center gap-2 text-purple-400 border-b border-purple-900/30 pb-2 mb-4">
            <Settings size={18} />
            <h3 className="text-sm font-bold tracking-wider font-display">
              QUICK MACROS
            </h3>
          </div>

          <div className="space-y-4 overflow-y-auto pr-2">
            {MOCK_MACROS.map((macro) => (
              <div
                key={macro.id}
                className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between group hover:border-purple-500/30 transition-colors"
              >
                <div>
                  <h4 className="font-bold text-slate-200 font-display text-lg">
                    {macro.name}
                  </h4>
                  <div className="flex gap-3 mt-2">
                    <span className="text-[10px] px-2 py-0.5 bg-slate-800 rounded text-slate-400 font-mono border border-slate-700">
                      {macro.actions} Actions
                    </span>
                    <span className="text-[10px] px-2 py-0.5 bg-purple-950/30 rounded text-purple-400 font-mono border border-purple-900/50">
                      {macro.hotkey}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-emerald-400 hover:bg-emerald-500/20 hover:text-emerald-300 border border-emerald-500/20"
                  >
                    <Play size={18} className="ml-1" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-10 w-10 p-0 text-red-400 hover:bg-red-500/20 hover:text-red-300 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <Trash2 size={16} />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
}
