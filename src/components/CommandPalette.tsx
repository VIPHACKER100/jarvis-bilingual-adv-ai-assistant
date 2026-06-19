import { FC, useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Terminal, Zap, History, Settings, User } from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useJarvisBridge } from '../hooks/useJarvisBridge';
import { Badge } from './ui/Badge';

export const CommandPalette: FC = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [bootPhase, setBootPhase] = useState<'booting' | 'ready'>('ready');
  const { setShowSettings } = useJarvisStore();
  const { sendCommand } = useJarvisBridge();

  // Shortcut listener
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setIsOpen(prev => !prev);
      }
      if (e.key === 'Escape') setIsOpen(false);
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setBootPhase('booting');
      const timer = setTimeout(() => setBootPhase('ready'), 600);
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [isOpen]);

  const commands = [
    { id: 'toggle-mic', title: 'Toggle Microphone', icon: <Terminal className="w-4 h-4" />, category: 'System' },
    { id: 'open-settings', title: 'Open Settings', icon: <Settings className="w-4 h-4" />, category: 'System' },
    { id: 'view-memory', title: 'Open Memory Viewer', icon: <History className="w-4 h-4" />, category: 'Intelligence' },
    { id: 'security-scan', title: 'Run Security Scan', icon: <Zap className="w-4 h-4" />, category: 'Security' },
    { id: 'switch-persona', title: 'Switch Personality', icon: <User className="w-4 h-4" />, category: 'Identity' },
  ];

  const filteredResults = useMemo(() => {
    if (!query) return commands.slice(0, 5);
    const lowQuery = query.toLowerCase();
    return commands.filter(c => 
      c.title.toLowerCase().includes(lowQuery) || 
      c.category.toLowerCase().includes(lowQuery)
    );
  }, [query]);

  const handleAction = (id: string) => {
    if (id === 'open-settings') setShowSettings(true);
    else sendCommand(id);
    setIsOpen(false);
    setQuery('');
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[300] flex items-start justify-center pt-[15vh] px-4">
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setIsOpen(false)}
            className="absolute inset-0 bg-background-deep/60 backdrop-blur-sm"
          />

          {/* Palette Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: -20 }}
            className="relative w-full max-w-2xl glass-panel--high border border-border-bright shadow-2xl overflow-hidden"
          >
            {/* Search Input Area */}
            <div className="flex items-center gap-4 px-6 py-4 border-b border-border-subtle bg-surface-mid">
              <Terminal className="w-5 h-5 text-accent" />
              {bootPhase === 'booting' ? (
                <div className="flex-1 font-mono text-sm text-accent">
                  <span className="animate-pulse">&gt;</span> INITIALIZING NEURAL SEARCH...
                </div>
              ) : (
                <div className="flex-1 relative">
                  <input 
                    autoFocus
                    className="w-full bg-transparent border-none outline-none text-foreground text-lg placeholder:text-foreground-subtle font-mono"
                    placeholder="> Enter command..."
                    value={query}
                    onChange={e => setQuery(e.target.value)}
                  />
                  <span className="absolute right-0 top-1/2 -translate-y-1/2 w-2.5 h-5 bg-accent animate-pulse" />
                </div>
              )}
              <div className="flex items-center gap-1 px-2 py-1 rounded-md bg-surface-high border border-border-subtle text-[10px] font-mono text-foreground-subtle uppercase">
                Esc
              </div>
            </div>

            {/* Results List */}
            <div className="max-h-[60vh] overflow-y-auto p-2 custom-settings-scroll">
              {filteredResults.length > 0 ? (
                <div className="space-y-1">
                  {filteredResults.map((res) => (
                    <button
                      key={res.id}
                      onClick={() => handleAction(res.id)}
                      className="w-full flex items-center justify-between p-3 rounded-lg hover:bg-accent/10 group transition-all"
                    >
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 rounded-lg bg-surface-high flex items-center justify-center text-foreground-muted group-hover:text-accent group-hover:bg-accent/20 transition-all">
                          {res.icon}
                        </div>
                        <div className="text-left">
                          <p className="text-sm font-bold text-foreground">{res.title}</p>
                          <p className="text-[10px] text-foreground-subtle uppercase tracking-wider">{res.category}</p>
                        </div>
                      </div>
                      <Badge variant="accent" className="opacity-0 group-hover:opacity-100 transition-opacity">
                        Execute
                      </Badge>
                    </button>
                  ))}
                </div>
              ) : (
                <div className="py-12 text-center">
                  <p className="text-sm text-foreground-muted">No commands found matching "{query}"</p>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="px-6 py-3 border-t border-border-subtle bg-surface-low flex items-center justify-between">
              <div className="flex items-center gap-4 text-[10px] font-mono text-foreground-subtle uppercase tracking-widest">
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-surface-high border border-border-subtle">↑↓</span>
                  Navigate
                </div>
                <div className="flex items-center gap-1.5">
                  <span className="p-1 rounded bg-surface-high border border-border-subtle">Enter</span>
                  Select
                </div>
              </div>
              <Badge variant="accent" className="bg-accent/5">Neural_Search_v1.0</Badge>
            </div>
            
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
