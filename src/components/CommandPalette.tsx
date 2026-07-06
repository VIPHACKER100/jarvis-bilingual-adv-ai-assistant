import { useEffect, useState } from 'react';
import { Search, Command, ArrowRight } from 'lucide-react';
import { useStore } from '@/store';

export function CommandPalette() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const setPage = useStore((s) => s.setPage);

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') { e.preventDefault(); setIsOpen((o) => !o); }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  const commands = [
    { id: 'hud', name: 'Neural HUD', page: 'hud' as const },
    { id: 'settings', name: 'Settings', page: 'settings' as const },
    { id: 'about', name: 'About', page: 'about' as const },
  ];

  const filtered = commands.filter((c) => c.name.toLowerCase().includes(query.toLowerCase()));

  const exec = (page: 'hud' | 'settings' | 'about') => {
    setPage(page);
    setIsOpen(false);
    setQuery('');
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-[#030712]/80 backdrop-blur-sm z-50" onClick={() => setIsOpen(false)} />
      <div className="fixed inset-0 z-50 flex items-start justify-center pt-[20vh] pointer-events-none">
        <div className="w-full max-w-xl bg-slate-950/90 border border-cyan-500/50 rounded-xl overflow-hidden pointer-events-auto transition-all duration-200">
          <div className="flex items-center px-4 py-3 border-b border-cyan-900/50">
            <Search size={18} className="text-cyan-400 mr-3" />
            <input autoFocus type="text" placeholder="Type a command..." value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent border-none outline-none text-slate-200 placeholder-slate-500 font-mono text-sm" />
            <div className="flex items-center gap-1 text-[10px] text-slate-500 font-mono bg-slate-900 px-2 py-1 rounded">
              <Command size={10} /> K
            </div>
          </div>
          <div className="max-h-[60vh] overflow-y-auto p-2">
            {filtered.length === 0
              ? <div className="px-4 py-8 text-center text-slate-500 text-sm font-mono">No matching commands.</div>
              : filtered.map((c) => (
                  <button key={c.id} onClick={() => exec(c.page)}
                    className="w-full flex items-center justify-between px-3 py-2.5 rounded-lg hover:bg-cyan-950/40 text-left transition-colors group">
                    <span className="text-sm font-medium text-slate-300 group-hover:text-cyan-300">{c.name}</span>
                    <ArrowRight size={14} className="text-slate-600 group-hover:text-cyan-400" />
                  </button>
                ))
            }
          </div>
        </div>
      </div>
    </>
  );
}
