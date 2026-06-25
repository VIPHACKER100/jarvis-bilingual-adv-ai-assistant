import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  Monitor,
  Camera,
  Clipboard,
  MousePointer2,
  Settings,
  Volume2,
} from "lucide-react";

export function RemoteDesktop() {
  return (
    <div className="h-full flex flex-col space-y-4 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-blue-950/50 border border-blue-500/30 rounded-lg text-blue-400 shadow-[0_0_15px_rgba(59,130,246,0.3)]">
            <Monitor size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              REMOTE DESKTOP
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Screen Capture & Media
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Main View */}
        <Card className="lg:col-span-3 hud-bg hud-border flex flex-col overflow-hidden relative group">
          <div className="absolute inset-0 flex items-center justify-center bg-slate-950">
            {/* Mock Screen Content */}
            <div className="w-full h-full p-8 flex flex-col gap-4 opacity-50">
              <div className="h-12 w-full bg-slate-900 rounded-md border border-slate-800"></div>
              <div className="flex gap-4 flex-1">
                <div className="w-64 bg-slate-900 rounded-md border border-slate-800 h-full"></div>
                <div className="flex-1 bg-slate-900 rounded-md border border-slate-800 h-full"></div>
              </div>
            </div>

            <div className="absolute inset-0 bg-cyan-900/10 mix-blend-overlay"></div>
            <div className="absolute inset-0 flex items-center justify-center backdrop-blur-sm bg-[#030712]/40 opacity-0 group-hover:opacity-100 transition-opacity">
              <Button
                size="lg"
                className="bg-cyan-600 hover:bg-cyan-500 text-white font-bold tracking-wider px-8 h-14 text-lg box-shadow-cyan"
              >
                <Monitor size={24} className="mr-3" /> CONNECT STREAM
              </Button>
            </div>
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-slate-950 to-transparent flex justify-center gap-4 opacity-0 group-hover:opacity-100 transition-opacity">
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-900/80 hover:bg-cyan-900/80"
            >
              <Camera size={16} className="mr-2" /> Capture
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-900/80 hover:bg-cyan-900/80"
            >
              <Camera size={16} className="mr-2" /> Fullscreen
            </Button>
            <Button
              variant="secondary"
              size="sm"
              className="bg-slate-900/80 hover:bg-cyan-900/80"
            >
              <Settings size={16} className="mr-2" /> Quality
            </Button>
          </div>
        </Card>

        {/* Side Panel */}
        <div className="space-y-4 flex flex-col">
          <Card className="hud-bg hud-border p-4 flex-1">
            <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/30 pb-2 mb-4">
              <Clipboard size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase font-display">
                Clipboard Sync
              </h3>
            </div>
            <div className="p-3 bg-slate-900/50 border border-slate-800 rounded font-mono text-sm text-slate-400 h-32 overflow-y-auto">
              [Empty]
            </div>
            <div className="flex gap-2 mt-3">
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs h-8"
              >
                Copy to Local
              </Button>
              <Button
                variant="secondary"
                size="sm"
                className="flex-1 text-xs h-8"
              >
                Send to Remote
              </Button>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-4">
            <div className="flex items-center gap-2 text-purple-400 border-b border-purple-900/30 pb-2 mb-4">
              <MousePointer2 size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase font-display">
                Remote Input
              </h3>
            </div>
            <div className="flex items-center justify-between text-sm font-mono">
              <span className="text-slate-400">Mouse Control</span>
              <span className="text-red-400">Disabled</span>
            </div>
            <div className="flex items-center justify-between text-sm font-mono mt-2">
              <span className="text-slate-400">Keyboard Hooks</span>
              <span className="text-red-400">Disabled</span>
            </div>
            <Button
              variant="primary"
              size="sm"
              className="w-full mt-4 text-xs h-8"
            >
              Enable Control
            </Button>
          </Card>

          <Card className="hud-bg hud-border p-4">
            <div className="flex items-center gap-2 text-emerald-400 border-b border-emerald-900/30 pb-2 mb-4">
              <Volume2 size={16} />
              <h3 className="text-xs font-bold tracking-widest uppercase font-display">
                Media Control
              </h3>
            </div>
            <div className="text-center py-4 text-slate-500 font-mono text-sm">
              No media playing
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}
