import React from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  FileAudio,
  ScanText,
  Image as ImageIcon,
  Wand2,
  UploadCloud,
  FileText,
} from "lucide-react";

export function MediaTools() {
  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-amber-950/50 border border-amber-500/30 rounded-lg text-amber-400 shadow-[0_0_15px_rgba(245,158,11,0.3)]">
            <FileAudio size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              MEDIA TOOLS
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Processing & Extraction
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 flex-1 min-h-0">
        {/* OCR Tool */}
        <Card className="hud-bg hud-border p-6 flex flex-col group hover:border-cyan-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-cyan-950/50 rounded border border-cyan-500/30 text-cyan-400">
              <ScanText size={20} />
            </div>
            <h3 className="font-bold text-lg font-display tracking-wider text-slate-200">
              Vision OCR
            </h3>
          </div>
          <p className="text-sm text-slate-400 font-mono mb-6">
            Extract raw text from images, screenshots, or PDF documents using
            neural vision models.
          </p>

          <div className="mt-auto border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-cyan-500/50 hover:bg-cyan-950/10 transition-colors">
            <UploadCloud size={24} className="text-cyan-500/50 mb-2" />
            <span className="text-sm font-bold text-slate-300">
              Drop Image Here
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              or click to browse
            </span>
          </div>
        </Card>

        {/* Audio Transcribe */}
        <Card className="hud-bg hud-border p-6 flex flex-col group hover:border-purple-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-purple-950/50 rounded border border-purple-500/30 text-purple-400">
              <FileAudio size={20} />
            </div>
            <h3 className="font-bold text-lg font-display tracking-wider text-slate-200">
              Audio Transcribe
            </h3>
          </div>
          <p className="text-sm text-slate-400 font-mono mb-6">
            Convert voice notes, meeting recordings, or video audio into
            formatted text summaries.
          </p>

          <div className="mt-auto border-2 border-dashed border-slate-700 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-purple-500/50 hover:bg-purple-950/10 transition-colors">
            <UploadCloud size={24} className="text-purple-500/50 mb-2" />
            <span className="text-sm font-bold text-slate-300">
              Drop Audio File
            </span>
            <span className="text-[10px] text-slate-500 mt-1">
              MP3, WAV, M4A
            </span>
          </div>
        </Card>

        {/* Image Gen */}
        <Card className="hud-bg hud-border p-6 flex flex-col group hover:border-emerald-500/50 transition-colors">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-emerald-950/50 rounded border border-emerald-500/30 text-emerald-400">
              <Wand2 size={20} />
            </div>
            <h3 className="font-bold text-lg font-display tracking-wider text-slate-200">
              Asset Generator
            </h3>
          </div>
          <p className="text-sm text-slate-400 font-mono mb-6">
            Generate icons, textures, or placeholder images using text prompts
            via stable diffusion.
          </p>

          <div className="mt-auto space-y-3">
            <input
              type="text"
              placeholder="Describe image..."
              className="w-full bg-slate-900 border border-slate-700 rounded p-2 text-sm font-mono focus:outline-none focus:border-emerald-500/50"
            />
            <Button className="w-full bg-emerald-600 hover:bg-emerald-500">
              Generate Image
            </Button>
          </div>
        </Card>
      </div>
    </div>
  );
}
