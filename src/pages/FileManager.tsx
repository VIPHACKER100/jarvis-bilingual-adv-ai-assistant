import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import { motion } from "motion/react";
import {
  Folder,
  File,
  HardDrive,
  Server,
  Search,
  ChevronRight,
  Download,
  Trash2,
  ExternalLink,
  Image as ImageIcon,
  FileText,
  Code,
  Database,
} from "lucide-react";
import { cn } from "../lib/utils";

const MOCK_FILES = [
  {
    id: 1,
    name: "Projects",
    type: "folder",
    size: "--",
    modified: "2024-05-12",
  },
  {
    id: 2,
    name: "System32",
    type: "folder",
    size: "--",
    modified: "2024-01-05",
  },
  {
    id: 3,
    name: "config.json",
    type: "code",
    size: "2.4 KB",
    modified: "Today 10:24",
  },
  {
    id: 4,
    name: "neural_weights.bin",
    type: "db",
    size: "1.2 GB",
    modified: "Yesterday 18:40",
  },
  {
    id: 5,
    name: "avatar.png",
    type: "image",
    size: "4.5 MB",
    modified: "2024-05-10",
  },
  {
    id: 6,
    name: "instructions.md",
    type: "text",
    size: "12 KB",
    modified: "Today 09:15",
  },
];

export function FileManager() {
  const [path, setPath] = useState(["C:", "Users", "Commander"]);
  const [selected, setSelected] = useState<number[]>([]);

  const toggleSelect = (id: number) => {
    if (selected.includes(id)) {
      setSelected(selected.filter((x) => x !== id));
    } else {
      setSelected([...selected, id]);
    }
  };

  const getIcon = (type: string) => {
    switch (type) {
      case "folder":
        return <Folder size={20} className="text-cyan-400 fill-cyan-900/50" />;
      case "code":
        return <Code size={20} className="text-purple-400" />;
      case "db":
        return <Database size={20} className="text-red-400" />;
      case "image":
        return <ImageIcon size={20} className="text-emerald-400" />;
      case "text":
        return <FileText size={20} className="text-slate-400" />;
      default:
        return <File size={20} className="text-slate-500" />;
    }
  };

  return (
    <div className="h-full flex flex-col space-y-4 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/50 border border-amber-500/30 rounded-lg text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <HardDrive size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              FILE MANAGER
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Host System Access
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Sidebar */}
        <Card className="w-64 shrink-0 hud-bg hud-border p-4 flex flex-col gap-6">
          <div>
            <h4 className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-3 px-2">
              Drives
            </h4>
            <div className="space-y-1">
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg bg-cyan-950/40 text-cyan-400 border border-cyan-500/30 box-shadow-cyan text-sm font-bold tracking-wide">
                <HardDrive size={16} /> Local Disk (C:)
              </button>
              <button className="w-full flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-slate-900 text-slate-400 text-sm font-bold tracking-wide transition-colors">
                <Server size={16} /> Network Drive (Z:)
              </button>
            </div>
          </div>

          <div className="border-t border-slate-800/50 pt-4">
            <h4 className="text-[10px] text-slate-500 font-mono tracking-widest uppercase mb-3 px-2">
              Storage Usage
            </h4>
            <div className="px-2 space-y-2">
              <div className="flex justify-between text-xs font-mono">
                <span className="text-slate-300">C: Drive</span>
                <span className="text-cyan-400">45%</span>
              </div>
              <div className="h-1.5 bg-slate-900 rounded overflow-hidden">
                <div
                  className="h-full bg-cyan-500"
                  style={{ width: "45%" }}
                ></div>
              </div>
              <p className="text-[10px] text-slate-500 font-mono text-right">
                450GB / 1TB
              </p>
            </div>
          </div>
        </Card>

        {/* Main Area */}
        <Card className="flex-1 hud-bg hud-border flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="p-3 border-b border-cyan-900/30 bg-slate-950/50 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 font-mono text-xs text-slate-400 bg-slate-900 px-3 py-1.5 rounded border border-slate-800 flex-1 max-w-lg overflow-hidden">
              {path.map((segment, i) => (
                <React.Fragment key={i}>
                  <button className="hover:text-cyan-400 transition-colors shrink-0">
                    {segment}
                  </button>
                  {i < path.length - 1 && (
                    <ChevronRight
                      size={14}
                      className="text-slate-600 shrink-0"
                    />
                  )}
                </React.Fragment>
              ))}
            </div>

            <div className="flex items-center gap-2">
              <div className="relative">
                <Search
                  size={14}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 text-cyan-500/50"
                />
                <input
                  type="text"
                  placeholder="Search files..."
                  className="bg-slate-900 border border-cyan-900/50 rounded pl-8 pr-3 py-1 text-xs font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500/50 w-48"
                />
              </div>
            </div>
          </div>

          {/* File List */}
          <div className="flex-1 overflow-auto p-4">
            <table className="w-full text-left border-collapse select-none">
              <thead>
                <tr className="border-b border-slate-800 text-[10px] font-mono tracking-widest text-slate-500 uppercase">
                  <th className="pb-3 pl-2 w-8"></th>
                  <th className="pb-3 font-normal">Name</th>
                  <th className="pb-3 font-normal text-right">Size</th>
                  <th className="pb-3 font-normal text-right pr-4">Modified</th>
                </tr>
              </thead>
              <tbody className="font-mono text-sm">
                {MOCK_FILES.map((file, i) => {
                  const isSelected = selected.includes(file.id);
                  return (
                    <motion.tr
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                      key={file.id}
                      onClick={() => toggleSelect(file.id)}
                      className={cn(
                        "border-b border-slate-800/30 transition-colors cursor-pointer group",
                        isSelected ? "bg-cyan-950/40" : "hover:bg-slate-900/50",
                      )}
                    >
                      <td className="py-3 pl-2">
                        <div
                          className={cn(
                            "w-4 h-4 rounded border flex items-center justify-center",
                            isSelected
                              ? "bg-cyan-500/20 border-cyan-500 text-cyan-400"
                              : "border-slate-700 group-hover:border-slate-500",
                          )}
                        >
                          {isSelected && (
                            <div className="w-2 h-2 bg-cyan-400 rounded-sm"></div>
                          )}
                        </div>
                      </td>
                      <td className="py-3">
                        <div className="flex items-center gap-3">
                          {getIcon(file.type)}
                          <span
                            className={cn(
                              "font-bold",
                              file.type === "folder"
                                ? "text-slate-200"
                                : "text-slate-400",
                            )}
                          >
                            {file.name}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 text-right text-slate-500 text-xs">
                        {file.size}
                      </td>
                      <td className="py-3 text-right text-slate-500 text-xs pr-4">
                        {file.modified}
                      </td>
                    </motion.tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Status Bar */}
          <div className="p-2 border-t border-cyan-900/30 bg-slate-950/80 shrink-0 flex items-center justify-between text-[10px] font-mono uppercase tracking-widest text-slate-500">
            <div>
              {MOCK_FILES.length} items • {selected.length} selected
            </div>
            {selected.length > 0 && (
              <div className="flex gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-red-400 hover:bg-red-950/50 hover:text-red-300"
                >
                  <Trash2 size={12} className="mr-1" /> Delete
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-cyan-400 hover:bg-cyan-950/50 hover:text-cyan-300"
                >
                  <Download size={12} className="mr-1" /> Download
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 px-2 text-purple-400 hover:bg-purple-950/50 hover:text-purple-300"
                >
                  <ExternalLink size={12} className="mr-1" /> Open
                </Button>
              </div>
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
