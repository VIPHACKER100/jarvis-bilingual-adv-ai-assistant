// ==========================================================================
// JARVIS v4.0 — Tabs primitive
// ==========================================================================



interface Tab {
  id: string;
  label: string;
}

interface TabsProps {
  tabs: Tab[];
  activeTab: string;
  onChange: (id: string) => void;
  className?: string;
}

export function Tabs({ tabs, activeTab, onChange, className = '' }: TabsProps) {
  return (
    <div className={`flex gap-1 border-b border-cyan-900/30 ${className}`}>
      {tabs.map((tab) => (
        <button
          key={tab.id}
          onClick={() => onChange(tab.id)}
          title={tab.label}
          aria-label={tab.label}
          className={`px-4 py-2.5 text-sm font-display font-semibold uppercase tracking-wider transition-all duration-300 border-b-2 -mb-px ${
            activeTab === tab.id
              ? 'border-cyan-400 text-cyan-300'
              : 'border-transparent text-slate-500 hover:text-slate-300 hover:border-slate-600'
          }`}
        >
          {tab.label}
        </button>
      ))}
    </div>
  );
}
