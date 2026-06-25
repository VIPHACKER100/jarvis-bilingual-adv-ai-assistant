import { useState } from "react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { motion } from "framer-motion";
import { KeyRound, Bot, Cpu, Settings } from "lucide-react";

export function SettingsPage() {
  const [provider, setProvider] = useState("openai");
  const [loading, setLoading] = useState(false);

  const handleSave = () => {
    setLoading(true);
    setTimeout(() => setLoading(false), 500);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 text-slate-300 relative z-10">
      <div className="flex items-center gap-3 border-b border-cyan-900/50 pb-4">
        <div className="p-2 bg-cyan-950/50 border border-cyan-500/30 rounded-lg text-cyan-400">
          <Settings size={24} />
        </div>
        <div>
          <h2 className="text-2xl font-bold text-cyan-400 font-display tracking-wider text-shadow-cyan">
            SYSTEM SETTINGS
          </h2>
          <p className="text-xs text-slate-400 tracking-widest uppercase font-mono">
            Configuration & Preferences
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="hud-bg hud-border p-6 flex flex-col gap-4 relative overflow-hidden">
          <div className="absolute top-0 right-0 p-4 opacity-10 pointer-events-none">
            <Cpu size={100} />
          </div>

          <div className="flex items-center gap-2 text-cyan-400 border-b border-cyan-900/30 pb-2">
            <Bot size={18} />
            <h3 className="text-sm font-bold tracking-wider font-display">
              AI PROVIDER
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Select the primary logic engine for JARVIS operations.
          </p>

          <div className="grid grid-cols-2 gap-3 mt-2">
            {["openai", "anthropic", "gemini", "local"].map((p) => (
              <motion.div
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                key={p}
                onClick={() => setProvider(p)}
                className={`p-4 border rounded-lg cursor-pointer transition-all ${
                  provider === p
                    ? "bg-cyan-950/60 border-cyan-500/50 text-cyan-300 box-shadow-cyan"
                    : "bg-slate-900/50 border-slate-800 text-slate-400 hover:bg-slate-800 hover:border-slate-600"
                }`}
              >
                <div className="font-bold tracking-wider uppercase text-sm font-display">
                  {p}
                </div>
                <div className="text-[10px] mt-1 opacity-70">
                  {provider === p ? "Active Engine" : "Available"}
                </div>
              </motion.div>
            ))}
          </div>
        </Card>

        <Card className="hud-bg hud-border p-6 flex flex-col gap-4">
          <div className="flex items-center gap-2 text-purple-400 border-b border-purple-900/30 pb-2">
            <KeyRound size={18} />
            <h3 className="text-sm font-bold tracking-wider font-display">
              SECURITY CREDENTIALS
            </h3>
          </div>
          <p className="text-xs text-slate-400 font-mono">
            Manage API keys and authentication tokens.
          </p>

          <div className="space-y-4 mt-2">
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                OpenAI API Key
              </label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors font-mono"
                defaultValue="sk-..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                Anthropic API Key
              </label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors font-mono"
                defaultValue=""
                placeholder="sk-ant-..."
              />
            </div>
            <div className="space-y-1.5">
              <label className="block text-xs font-bold text-slate-400 tracking-wider uppercase">
                Gemini API Key
              </label>
              <input
                type="password"
                className="w-full bg-slate-950 border border-slate-700 rounded-md px-3 py-2.5 text-slate-200 text-sm focus:outline-none focus:border-purple-500/50 focus:ring-1 focus:ring-purple-500/50 transition-colors font-mono"
                defaultValue=""
                placeholder="AIza..."
              />
            </div>
          </div>
        </Card>
      </div>

      <div className="flex justify-end pt-4 border-t border-cyan-900/30">
        <Button
          onClick={handleSave}
          loading={loading}
          size="lg"
          className="px-8 font-display font-bold tracking-wider text-sm"
        >
          APPLY CONFIGURATION
        </Button>
      </div>
    </div>
  );
}
