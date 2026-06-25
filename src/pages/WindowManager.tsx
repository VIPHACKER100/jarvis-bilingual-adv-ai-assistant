import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion, AnimatePresence } from "motion/react";
import {
  Maximize2,
  Monitor,
  Minimize2,
  X,
  Search,
  MonitorUp,
  Eye,
  EyeOff,
  LayoutGrid,
} from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_WINDOWS = [
  {
    id: 1,
    title: "Code - JARVIS",
    process: "Code.exe",
    visible: true,
    active: true,
  },
  {
    id: 2,
    title: "Google Chrome",
    process: "chrome.exe",
    visible: true,
    active: false,
  },
  {
    id: 3,
    title: "Discord",
    process: "Discord.exe",
    visible: false,
    active: false,
  },
  {
    id: 4,
    title: "Spotify Premium",
    process: "Spotify.exe",
    visible: true,
    active: false,
  },
  {
    id: 5,
    title: "Command Prompt",
    process: "cmd.exe",
    visible: true,
    active: false,
  },
];

export function WindowManager() {
  const [windows, setWindows] = useState(MOCK_WINDOWS);
  const [search, setSearch] = useState("");
  const [layout, setLayout] = useState<"grid" | "list">("grid");

  const filteredWindows = windows.filter(
    (w) =>
      w.title.toLowerCase().includes(search.toLowerCase()) ||
      w.process.toLowerCase().includes(search.toLowerCase()),
  );

  const toggleVisibility = (id: number) => {
    setWindows(
      windows.map((w) => (w.id === id ? { ...w, visible: !w.visible } : w)),
    );
  };

  const closeWindow = (id: number) => {
    setWindows(windows.filter((w) => w.id !== id));
  };

  const setFocus = (id: number) => {
    setWindows(windows.map((w) => ({ ...w, active: w.id === id })));
  };

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-indigo-950/50 border border-indigo-500/30 rounded-lg text-indigo-400 shadow-[0_0_15px_rgba(99,102,241,0.3)]">
            <MonitorUp size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              WINDOW MANAGER
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Display & Context Control
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <div className="bg-slate-950/50 rounded-lg flex p-1 border border-cyan-900/50">
            <button
              onClick={() => setLayout("grid")}
              className={cn(
                "p-1.5 rounded",
                layout === "grid"
                  ? "bg-cyan-900/50 text-cyan-400"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <LayoutGrid size={14} />
            </button>
            <button
              onClick={() => setLayout("list")}
              className={cn(
                "p-1.5 rounded",
                layout === "list"
                  ? "bg-cyan-900/50 text-cyan-400"
                  : "text-slate-500 hover:text-slate-300",
              )}
            >
              <Monitor size={14} />
            </button>
          </div>
          <Button
            variant="primary"
            size="sm"
            className="font-mono text-xs box-shadow-cyan"
          >
            ARRANGE ALL
          </Button>
        </div>
      </div>

      <div className="flex items-center justify-between">
        <div className="relative w-64">
          <Search
            size={14}
            className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50"
          />
          <input
            type="text"
            placeholder="Search windows or processes..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-slate-900/80 border border-cyan-900/50 rounded-lg pl-9 pr-3 py-2 text-sm font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
          />
        </div>
        <div className="text-[10px] text-slate-500 font-mono tracking-widest uppercase">
          {windows.filter((w) => w.visible).length} Visible / {windows.length}{" "}
          Total
        </div>
      </div>

      <div
        className={cn(
          "flex-1 min-h-0 overflow-y-auto pr-2",
          layout === "grid"
            ? "grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-max"
            : "flex flex-col gap-3",
        )}
      >
        <AnimatePresence>
          {filteredWindows.map((win, i) => (
            <motion.div
              layout
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              transition={{ delay: i * 0.05 }}
              key={win.id}
            >
              <Card
                className={cn(
                  "hud-bg hud-border overflow-hidden transition-all duration-300 group cursor-pointer relative",
                  win.active
                    ? "border-cyan-500/60 box-shadow-cyan bg-cyan-950/20"
                    : "hover:border-cyan-700/50",
                  !win.visible && "opacity-60 grayscale",
                )}
                onClick={() => setFocus(win.id)}
              >
                {win.active && (
                  <div className="absolute top-0 left-0 w-1 h-full bg-cyan-400 shadow-[0_0_10px_#22d3ee]"></div>
                )}

                <div
                  className={cn(
                    "p-4 flex items-start gap-4",
                    layout === "grid" ? "flex-col" : "items-center",
                  )}
                >
                  <div
                    className={cn(
                      "p-3 rounded-lg border shrink-0 transition-colors",
                      win.active
                        ? "bg-cyan-500/20 border-cyan-500/50 text-cyan-400"
                        : "bg-slate-900/80 border-slate-700/80 text-slate-400 group-hover:text-cyan-300 group-hover:border-cyan-700/50",
                    )}
                  >
                    <Monitor size={24} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-slate-200 font-display truncate text-lg group-hover:text-cyan-100 transition-colors">
                      {win.title}
                    </h3>
                    <p className="text-xs text-slate-500 font-mono mt-1 flex items-center gap-2">
                      <span className="px-1.5 py-0.5 bg-slate-900 rounded border border-slate-800 truncate block max-w-[150px]">
                        {win.process}
                      </span>
                      {win.active && (
                        <span className="text-[10px] text-cyan-500 tracking-widest uppercase">
                          In Focus
                        </span>
                      )}
                    </p>
                  </div>

                  <div
                    className={cn(
                      "flex gap-1",
                      layout === "grid"
                        ? "w-full justify-end mt-2 pt-3 border-t border-slate-800/50"
                        : "shrink-0 ml-auto",
                    )}
                  >
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleVisibility(win.id);
                      }}
                      className={cn(
                        "h-8 w-8 p-0",
                        win.visible
                          ? "text-slate-400 hover:text-amber-400"
                          : "text-slate-600 hover:text-cyan-400",
                      )}
                    >
                      {win.visible ? <EyeOff size={16} /> : <Eye size={16} />}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        setFocus(win.id);
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-cyan-400"
                    >
                      <Maximize2 size={16} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={(e) => {
                        e.stopPropagation();
                        closeWindow(win.id);
                      }}
                      className="h-8 w-8 p-0 text-slate-400 hover:text-red-400 hover:bg-red-500/10"
                    >
                      <X size={16} />
                    </Button>
                  </div>
                </div>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>
      </div>
    </div>
  );
}
