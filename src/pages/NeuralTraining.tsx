import React, { useState } from "react";
import { Card } from "../components/ui/Card";
import { Button } from "../components/ui/Button";
import {
  BrainCircuit,
  Mic,
  FileText,
  CheckCircle2,
  Play,
  Settings2,
  Database,
} from "lucide-react";
import { cn } from "../lib/utils";

export function NeuralTraining() {
  const [activeTab, setActiveTab] = useState<"voice" | "knowledge">("voice");

  return (
    <div className="h-full flex flex-col space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center justify-between border-b border-cyan-900/50 pb-4 shrink-0">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-pink-950/50 border border-pink-500/30 rounded-lg text-pink-400 shadow-[0_0_15px_rgba(244,114,182,0.3)]">
            <BrainCircuit size={24} />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-100 font-display tracking-wider">
              NEURAL TRAINING
            </h2>
            <p className="text-xs text-slate-400 font-mono tracking-widest uppercase">
              Personalization & Tuning
            </p>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mb-4">
        <Button
          variant={activeTab === "voice" ? "primary" : "secondary"}
          onClick={() => setActiveTab("voice")}
          className={cn(
            "w-48 font-display tracking-wider",
            activeTab === "voice"
              ? "bg-pink-600/20 text-pink-400 border-pink-500/50 box-shadow-pink"
              : "",
          )}
        >
          <Mic size={16} className="mr-2" /> Voice Profiles
        </Button>
        <Button
          variant={activeTab === "knowledge" ? "primary" : "secondary"}
          onClick={() => setActiveTab("knowledge")}
          className={cn(
            "w-48 font-display tracking-wider",
            activeTab === "knowledge"
              ? "bg-cyan-600/20 text-cyan-400 border-cyan-500/50 box-shadow-cyan"
              : "",
          )}
        >
          <Database size={16} className="mr-2" /> Knowledge Base
        </Button>
      </div>

      {activeTab === "voice" ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="hud-bg hud-border p-6 flex flex-col">
            <h3 className="text-lg font-bold text-slate-200 font-display mb-2">
              Active Voice Model: JARVIS v4
            </h3>
            <p className="text-sm text-slate-400 font-mono mb-6">
              The current text-to-speech synthesis model. Optimized for calm,
              clear, and professional articulation.
            </p>

            <div className="space-y-4">
              <div className="p-4 bg-slate-900/50 border border-pink-500/30 rounded-lg flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-pink-400">JARVIS (Default)</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    British Male, Calm, Professional
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    className="h-8 w-8 p-0 text-slate-400 hover:text-white"
                  >
                    <Play size={16} />
                  </Button>
                  <CheckCircle2 size={20} className="text-emerald-500" />
                </div>
              </div>
              <div className="p-4 bg-slate-900/50 border border-slate-800 rounded-lg flex items-center justify-between opacity-70">
                <div>
                  <h4 className="font-bold text-slate-300">FRIDAY</h4>
                  <p className="text-xs text-slate-500 mt-1">
                    Irish Female, Energetic, Casual
                  </p>
                </div>
                <Button variant="outline" size="sm" className="text-xs">
                  Select
                </Button>
              </div>
            </div>
          </Card>

          <Card className="hud-bg hud-border p-6 flex flex-col border-dashed border-slate-700 items-center justify-center text-center">
            <Mic size={48} className="text-slate-600 mb-4" />
            <h3 className="text-lg font-bold text-slate-200 font-display mb-2">
              Voice Cloning
            </h3>
            <p className="text-sm text-slate-400 font-mono mb-6 max-w-xs">
              Upload 3-5 minutes of clear audio to create a custom neural voice
              profile.
            </p>
            <Button variant="secondary">
              <Settings2 size={16} className="mr-2" /> Train New Model
            </Button>
          </Card>
        </div>
      ) : (
        <Card className="hud-bg hud-border p-6 flex flex-col min-h-[400px]">
          <h3 className="text-lg font-bold text-slate-200 font-display mb-2">
            Vector Database Indexing
          </h3>
          <p className="text-sm text-slate-400 font-mono mb-6">
            Upload documents to expand JARVIS's personal knowledge base using
            RAG (Retrieval-Augmented Generation).
          </p>

          <div className="flex-1 border-2 border-dashed border-slate-700 rounded-lg flex flex-col items-center justify-center text-center bg-slate-900/30">
            <FileText size={48} className="text-slate-600 mb-4" />
            <h4 className="text-slate-300 font-bold mb-1">
              Drop Documents Here
            </h4>
            <p className="text-xs text-slate-500 font-mono max-w-sm">
              Supports PDF, DOCX, TXT, MD. Files are processed locally and
              embedded into the local vector store.
            </p>
          </div>
        </Card>
      )}
    </div>
  );
}
