import React, { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";
import { Header } from "./Header";
import { SidebarNav } from "./SidebarNav";
import { websocketService } from "../../services/websocketService";
import { broadcastRouter } from "../../services/broadcastRouter";
import { useStore } from "../../store";
import { AnimatePresence, motion } from "motion/react";
import { CommandPalette } from "../CommandPalette";

export function AppShell() {
  const setConnectionStatus = useStore((state) => state.setConnectionStatus);
  const setSystemStatus = useStore((state) => state.setSystemStatus);
  const location = useLocation();

  useEffect(() => {
    // Connect WebSocket
    websocketService.connect();

    // Setup broadcast listeners
    const handleConnection = (msg: any) => {
      setConnectionStatus(msg.data);
    };

    const handleSystemStatus = (msg: any) => {
      if (msg.data) setSystemStatus(msg.data);
    };

    broadcastRouter.on("internal_connection_status", handleConnection);
    broadcastRouter.on("system_status", handleSystemStatus);

    return () => {
      broadcastRouter.off("internal_connection_status", handleConnection);
      broadcastRouter.off("system_status", handleSystemStatus);
      websocketService.disconnect();
    };
  }, [setConnectionStatus, setSystemStatus]);

  return (
    <div className="flex flex-col h-screen text-slate-300 overflow-hidden font-sans bg-[#030712] relative">
      <CommandPalette />

      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-cyan-950/20 via-[#030712] to-[#030712]" />
      <div
        className="fixed inset-0 z-0 pointer-events-none opacity-20"
        style={{
          backgroundImage:
            "linear-gradient(to right, #0891b2 1px, transparent 1px), linear-gradient(to bottom, #0891b2 1px, transparent 1px)",
          backgroundSize: "40px 40px",
          maskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
          WebkitMaskImage:
            "radial-gradient(ellipse at center, black 30%, transparent 80%)",
        }}
      />

      <Header />

      <div className="flex flex-1 overflow-hidden z-10 relative">
        <SidebarNav />
        <main className="flex-1 overflow-y-auto p-4 lg:p-6 relative z-10">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 10, filter: "blur(4px)" }}
              animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
              exit={{ opacity: 0, y: -10, filter: "blur(4px)" }}
              transition={{ duration: 0.3, ease: "easeOut" }}
              className="h-full"
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </main>
      </div>
    </div>
  );
}
