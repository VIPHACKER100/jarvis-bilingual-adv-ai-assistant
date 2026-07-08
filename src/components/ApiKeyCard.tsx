// ==========================================================================
// JARVIS v4.0 — COMP-9: ApiKeyCard
// Password input with show/hide, status dot, test & save buttons
// ==========================================================================

import { useState } from 'react';
import { Eye, EyeOff, CheckCircle, XCircle, Loader2, Beaker, Save } from 'lucide-react';

interface ApiKeyCardProps {
  name: string;
  label: string;
  value: string;
  isSet: boolean;
  isTesting?: boolean;
  isSaving?: boolean;
  testResult?: { success: boolean; message: string } | null;
  onChange: (value: string) => void;
  onTest: () => void;
  onSave: () => void;
}

export function ApiKeyCard({
  name,
  label,
  value,
  isSet,
  isTesting = false,
  isSaving = false,
  testResult,
  onChange,
  onTest,
  onSave,
}: ApiKeyCardProps) {
  const [showPassword, setShowPassword] = useState(false);

  return (
    <div className="glass-panel rounded-xl p-4">
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <h3 className="font-display font-bold text-sm text-slate-200">{label}</h3>
          {isSet ? (
            <span className="status-dot status-dot-connected" title="Key is set" />
          ) : (
            <span className="status-dot status-dot-disconnected" title="Key is not set" />
          )}
        </div>
        <span className="text-[10px] font-mono text-slate-500 uppercase">{name}</span>
      </div>

      <div className="relative">
        <input
          type={showPassword ? 'text' : 'password'}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={isSet ? '••••••••••••••••' : `Enter ${label}`}
          className="w-full px-4 py-2.5 pr-20 bg-cyber-surface/60 backdrop-blur-md border border-cyan-800/30 rounded-lg font-mono text-sm text-slate-200 placeholder-slate-600 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
          aria-label={`${label} API key input`}
        />
        <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
          <button
            onClick={() => setShowPassword(!showPassword)}
            title={showPassword ? 'Hide key' : 'Show key'}
            aria-label={showPassword ? 'Hide API key' : 'Show API key'}
            className="p-1.5 text-slate-500 hover:text-slate-300 transition-colors"
          >
            {showPassword ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {testResult && (
        <div className={`flex items-center gap-2 mt-2 text-xs font-mono ${
          testResult.success ? 'text-neon-success' : 'text-neon-error'
        }`}>
          {testResult.success ? (
            <CheckCircle className="w-3.5 h-3.5 flex-shrink-0" />
          ) : (
            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
          )}
          <span>{testResult.message}</span>
        </div>
      )}

      <div className="flex gap-2 mt-3">
        <button
          onClick={onTest}
          disabled={!value || isTesting}
          title={`Test ${label} API key`}
          aria-label={`Test ${label} API key`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-display uppercase tracking-wider glass-button rounded-lg disabled:opacity-40"
        >
          {isTesting ? <Loader2 className="w-3 h-3 animate-spin" /> : <Beaker className="w-3 h-3" />}
          Test
        </button>
        <button
          onClick={onSave}
          disabled={!value || isSaving}
          title={`Save ${label} API key`}
          aria-label={`Save ${label} API key`}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold font-display uppercase tracking-wider glass-button glass-button-primary rounded-lg disabled:opacity-40"
        >
          {isSaving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
          Save
        </button>
      </div>
    </div>
  );
}
