import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import {
  MousePointerClick,
  Keyboard,
  Move,
  CornerDownRight,
  Command,
} from "lucide-react";

export function InputSimulator() {
  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-rose-950/50 border border-rose-500/30 rounded-lg text-rose-400 shadow-[0_0_15px_rgba(244,63,94,0.3)]">
            <MousePointerClick size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              INPUT SIMULATOR
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Remote Keyboard & Mouse
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 flex-1 min-h-0">
        <Card className="hud-bg hud-border p-6 flex flex-col items-center justify-center relative overflow-hidden">
          <div className="absolute top-4 left-4 flex items-center gap-2 text-rose-400">
            <MousePointerClick size={18} />
            <span className="font-bold font-display tracking-wider uppercase text-sm">
              Trackpad Mode
            </span>
          </div>

          <div className="w-full max-w-md aspect-video bg-slate-900/50 border-2 border-dashed border-slate-700 rounded-xl flex items-center justify-center group hover:border-rose-500/50 hover:bg-rose-950/10 transition-colors cursor-crosshair">
            <div className="text-center opacity-50 group-hover:opacity-100 transition-opacity">
              <Move size={32} className="mx-auto mb-2 text-rose-400" />
              <p className="font-mono text-sm text-slate-300">
                Tap or drag to control mouse
              </p>
            </div>
          </div>

          <div className="flex gap-4 mt-8 w-full max-w-md">
            <Button
              variant="secondary"
              className="flex-1 h-12 text-sm font-bold tracking-wider"
            >
              Left Click
            </Button>
            <Button
              variant="secondary"
              className="flex-1 h-12 text-sm font-bold tracking-wider"
            >
              Right Click
            </Button>
          </div>
        </Card>

        <Card className="hud-bg hud-border p-6 flex flex-col relative overflow-hidden">
          <div className="flex items-center gap-2 text-cyan-400 mb-6">
            <Keyboard size={18} />
            <span className="font-bold font-display tracking-wider uppercase text-sm">
              Macro Keys
            </span>
          </div>

          <div className="grid grid-cols-3 gap-3 mb-6">
            <Button variant="secondary" className="h-14 font-mono">
              Ctrl + C
            </Button>
            <Button variant="secondary" className="h-14 font-mono">
              Ctrl + V
            </Button>
            <Button
              variant="secondary"
              className="h-14 font-mono text-rose-400"
            >
              Alt + F4
            </Button>
            <Button variant="secondary" className="h-14 font-mono">
              Win + D
            </Button>
            <Button variant="secondary" className="h-14 font-mono">
              <CornerDownRight size={16} className="mr-2" /> Enter
            </Button>
            <Button variant="secondary" className="h-14 font-mono">
              Esc
            </Button>
          </div>

          <div className="mt-auto">
            <div className="relative">
              <Command
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-cyan-500/50"
              />
              <input
                type="text"
                placeholder="Type text to send directly..."
                className="w-full bg-slate-900/80 border border-cyan-900/50 rounded-lg pl-9 pr-20 py-3 text-sm font-mono text-cyan-100 placeholder-cyan-900/50 focus:outline-none focus:border-cyan-500/50 transition-colors"
              />
              <Button
                size="sm"
                className="absolute right-1.5 top-1.5 bottom-1.5 h-auto bg-cyan-600 hover:bg-cyan-500"
              >
                Send
              </Button>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
}
