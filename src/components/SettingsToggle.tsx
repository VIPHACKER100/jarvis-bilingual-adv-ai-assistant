// ==========================================================================
// JARVIS v4.0 — COMP-10: SettingsToggle
// Toggle switch with label and description
// ==========================================================================



interface SettingsToggleProps {
  label: string;
  description?: string;
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}

export function SettingsToggle({ label, description, checked, onChange, disabled = false }: SettingsToggleProps) {
  return (
    <label className={`flex items-center justify-between gap-4 py-3 ${disabled ? 'opacity-40 cursor-not-allowed' : 'cursor-pointer'}`}>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200">{label}</p>
        {description && <p className="text-xs text-slate-400 mt-0.5">{description}</p>}
      </div>
      <div className="relative flex-shrink-0">
        <input
          type="checkbox"
          checked={checked}
          onChange={(e) => onChange(e.target.checked)}
          disabled={disabled}
          className="sr-only peer"
          aria-label={label}
        />
        <div className="w-10 h-6 rounded-full bg-cyber-card border border-cyan-800/30 peer-checked:bg-cyan-600/40 peer-checked:border-cyan-400/50 transition-all duration-300 peer-focus-visible:ring-2 peer-focus-visible:ring-cyan-400/50" />
        <div className="absolute top-0.5 left-0.5 w-5 h-5 rounded-full bg-slate-400 peer-checked:bg-cyan-300 peer-checked:translate-x-4 transition-all duration-300 shadow-sm" />
      </div>
    </label>
  );
}
