import React from "react";
import { NavLink } from "react-router-dom";
import {
  Home,
  Activity,
  RefreshCcw,
  Settings,
  FileText,
  LayoutGrid,
  ShieldAlert,
  MessageCircle,
  Monitor,
  MousePointerClick,
  FileAudio,
  BrainCircuit,
  Info,
} from "lucide-react";
import { cn } from "../../lib/utils";
import { motion } from "motion/react";

export function SidebarNav() {
  const navItems = [
    { to: "/", icon: Home, label: "HUD", sub: "Neural Dashboard" },
    { to: "/timeline", icon: Activity, label: "Timeline", sub: "Audit & Logs" },
    { to: "/sync", icon: RefreshCcw, label: "Sync Hub", sub: "Devices & Data" },
    {
      to: "/automation",
      icon: Settings,
      label: "Automation",
      sub: "Tasks & Macros",
    },
    { to: "/files", icon: FileText, label: "Files", sub: "File Manager" },
    {
      to: "/windows",
      icon: LayoutGrid,
      label: "Windows",
      sub: "Window Control",
    },
    {
      to: "/security",
      icon: ShieldAlert,
      label: "Security",
      sub: "Threat & Firewall",
    },
    {
      to: "/whatsapp",
      icon: MessageCircle,
      label: "WhatsApp",
      sub: "Messages & Send",
    },
    { to: "/desktop", icon: Monitor, label: "Desktop", sub: "Remote Control" },
    {
      to: "/input",
      icon: MousePointerClick,
      label: "Input Control",
      sub: "Keyboard & Mouse",
    },
    {
      to: "/media-tools",
      icon: FileAudio,
      label: "Media Tools",
      sub: "Audio, Video, OCR",
    },
    {
      to: "/training",
      icon: BrainCircuit,
      label: "Training",
      sub: "Neural Training",
    },
    {
      to: "/about",
      icon: Info,
      label: "About",
      sub: "System Info",
    },
    {
      to: "/settings",
      icon: Settings,
      label: "Settings",
      sub: "System Settings",
    },
  ];

  return (
    <nav className="w-64 border-r border-cyan-900/30 bg-slate-950/80 backdrop-blur-xl flex flex-col shrink-0 overflow-y-auto z-10">
      <div className="p-4 space-y-1">
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            className={({ isActive }) =>
              cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all border border-transparent group",
                isActive
                  ? "bg-cyan-950/40 text-cyan-400 border-cyan-500/30 box-shadow-cyan"
                  : "text-slate-400 hover:text-cyan-300 hover:bg-cyan-950/20",
              )
            }
          >
            {({ isActive }) => (
              <>
                <div
                  className={cn(
                    "p-1.5 rounded-md transition-colors",
                    isActive
                      ? "bg-cyan-500/20 text-cyan-400"
                      : "bg-slate-900 text-slate-500 group-hover:bg-cyan-950 group-hover:text-cyan-400",
                  )}
                >
                  <item.icon size={18} className="shrink-0" />
                </div>
                <div className="flex flex-col">
                  <span
                    className={cn(
                      "text-sm font-semibold tracking-wide uppercase font-display",
                      isActive ? "text-cyan-300" : "text-slate-300",
                    )}
                  >
                    {item.label}
                  </span>
                  <span className="text-[10px] text-slate-500 leading-tight">
                    {item.sub}
                  </span>
                </div>
                {isActive && (
                  <motion.div
                    layoutId="activeNavIndicator"
                    className="absolute left-0 w-1 h-8 bg-cyan-400 rounded-r-full shadow-[0_0_10px_#22d3ee]"
                  />
                )}
              </>
            )}
          </NavLink>
        ))}
      </div>

      <div className="mt-auto p-4 border-t border-cyan-900/30 bg-slate-900/30">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded bg-cyan-950 border border-cyan-500/30 flex items-center justify-center shrink-0">
            <ShieldAlert size={16} className="text-cyan-400" />
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-bold text-slate-200 truncate">
              JARVIS AI
            </span>
            <span className="text-[10px] text-emerald-400 flex items-center gap-1">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500"></div>{" "}
              Online • GPT-5
            </span>
          </div>
        </div>
      </div>
    </nav>
  );
}
