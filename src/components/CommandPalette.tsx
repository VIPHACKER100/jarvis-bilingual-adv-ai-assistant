import React, { useEffect, useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Search, Command, ArrowRight } from "lucide-react";
import { useNavigate } from "react-router-dom";

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setIsOpen((open) => !open);
      }
      if (e.key === "Escape") {
        setIsOpen(false);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  const commands = [
    { id: "home", name: "Open Neural HUD", path: "/" },
    { id: "settings", name: "System Settings", path: "/settings" },
    { id: "timeline", name: "Audit Timeline", path: "/timeline" },
    { id: "sync", name: "Device Sync Hub", path: "/sync" },
    { id: "automation", name: "Automation Engine", path: "/automation" },
    { id: "files", name: "File Manager", path: "/files" },
    { id: "windows", name: "Window Manager", path: "/windows" },
    { id: "security", name: "Threat & Firewall", path: "/security" },
    { id: "whatsapp", name: "WhatsApp Control", path: "/whatsapp" },
    { id: "desktop", name: "Remote Desktop", path: "/desktop" },
    { id: "input", name: "Input Simulator", path: "/input" },
    { id: "media", name: "Media Tools", path: "/media-tools" },
    { id: "training", name: "Neural Training", path: "/training" },
    { id: "about", name: "About System", path: "/about" },
  ];

  const filteredCommands = commands.filter((cmd) =>
    cmd.name.toLowerCase().includes(query.toLowerCase()),
  );

  const executeCommand = (path: string) => {
    navigate(path);
    setIsOpen(false);
    setQuery("");
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm z-50"
            onClick={() => setIsOpen(false)}
          />
          <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
            <motion.div
              initial={{ opacity: 0, y: -20, scale: 0.95 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: -20, scale: 0.95 }}
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="w-full max-w-xl bg-slate-950/90 border border-cyan-500/50 rounded-xl box-shadow-cyan overflow-hidden pointer-events-auto"
            >
              <div className="flex items-center px-4 py-3 border-b border-cyan-900/50">
                <Search size={18} className="text-cyan-400 mr-3" />
                <input
                  autoFocus
                  type="text"
                  placeholder="Type a command or search..."
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 font-mono text-sm"
                />
                <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
                  <Command size={10} /> K
                </div>
              </div>
              <div className="max-h-[60vh] overflow-y-auto p-2">
                {filteredCommands.length === 0 ? (
                  <div className="px-4 py-8 text-center text-slate-500 text-sm font-mono">
                    No matching commands found.
                  </div>
                ) : (
                  filteredCommands.map((cmd) => (
                    <button
                      key={cmd.id}
                      onClick={() => executeCommand(cmd.path)}
                      className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-cyan-950/40 text-left transition-colors group"
                    >
                      <span className="text-sm font-medium text-slate-300 group-hover:text-cyan-300">
                        {cmd.name}
                      </span>
                      <ArrowRight
                        size={14}
                        className="text-slate-600 group-hover:text-cyan-400"
                      />
                    </button>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
