import { Home, Settings, Info, ChevronLeft } from 'lucide-react';
import { useStore } from '@/store';

interface SidebarNavProps { collapsed: boolean; onToggle: () => void }

const items = [
  { page: 'hud' as const, label: 'Neural HUD', icon: <Home className="h-5 w-5" /> },
  { page: 'settings' as const, label: 'Settings', icon: <Settings className="h-5 w-5" /> },
  { page: 'about' as const, label: 'About', icon: <Info className="h-5 w-5" /> },
];

export function SidebarNav({ collapsed, onToggle }: SidebarNavProps) {
  const currentPage = useStore((s) => s.currentPage);
  const setPage = useStore((s) => s.setPage);

  return (
    <aside className={`flex flex-col border-r border-cyan-500/20 bg-cyber-surface/30 backdrop-blur-xl transition-all duration-300 ${collapsed ? 'w-16' : 'w-56'}`}>
      <div className="flex h-14 items-center justify-center border-b border-cyan-500/20 shrink-0">
        <span className={`neon-text-cyan font-bold font-display ${collapsed ? 'text-xl' : 'text-lg tracking-widest'}`}>
          {collapsed ? 'J' : 'JARVIS'}
        </span>
      </div>
      <nav className="flex-1 overflow-y-auto py-2 space-y-1 px-2">
        {items.map((item) => (
          <button
            key={item.page}
            title={item.label}
            aria-label={item.label}
            onClick={() => setPage(item.page)}
            className={`flex w-full items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 ${collapsed ? 'justify-center' : ''} ${
              currentPage === item.page
                ? 'bg-cyan-500/15 text-cyan-300 border border-cyan-500/30'
                : 'text-slate-400 hover:text-cyan-300 hover:bg-cyan-500/5'
            }`}
          >
            <span className="shrink-0">{item.icon}</span>
            {!collapsed && <span className="text-sm font-display font-semibold tracking-wide truncate">{item.label}</span>}
          </button>
        ))}
      </nav>
      <div className="border-t border-cyan-500/20 p-2 shrink-0">
        <button title={collapsed ? 'Expand' : 'Collapse'} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          onClick={onToggle}
          className="flex w-full items-center justify-center p-2 rounded-lg text-slate-500 hover:text-cyan-300 hover:bg-cyan-500/5 transition-all duration-200">
          <ChevronLeft className={`h-4 w-4 transition-transform duration-300 ${collapsed ? 'rotate-180' : ''}`} />
        </button>
      </div>
    </aside>
  );
}
