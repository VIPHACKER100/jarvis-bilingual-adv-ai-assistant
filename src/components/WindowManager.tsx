import { FC, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Monitor, Maximize2, Minimize2, RotateCcw,
  Search, RefreshCw, ExternalLink, Trash2, Layout,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import {
  useWindows, useApps, useCloseApp, useWindowAction,
} from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';

export const WindowManager: FC = () => {
  const { showWindowManager, setShowWindowManager } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<'windows' | 'apps'>('windows');
  const [appSearch, setAppSearch] = useState('');

  const windowsQuery = useWindows();
  const appsQuery = useApps();
  const closeAppMutation = useCloseApp();
  const windowActionMutation = useWindowAction();

  const windows = windowsQuery.data?.windows ?? [];
  const apps = appsQuery.data?.apps ?? [];
  const filteredApps = appSearch
    ? apps.filter(a => a.name.toLowerCase().includes(appSearch.toLowerCase()))
    : apps;

  const handleWindowAction = async (title: string, action: 'minimize' | 'maximize' | 'restore' | 'activate') => {
    try {
      const res = await windowActionMutation.mutateAsync({ action, title });
      addNotification({ type: 'info', title: `Window ${action}d`, message: res.response || title, duration: 2000 });
    } catch {
      addNotification({ type: 'error', title: 'Action Failed', message: `Could not ${action} window`, duration: 3000 });
    }
  };

  const handleCloseApp = async (appName: string) => {
    if (!confirm(`Close ${appName}? This may cause data loss.`)) return;
    try {
      const res = await closeAppMutation.mutateAsync({ appName, confirmed: true });
      addNotification({ type: 'warning', title: 'App Closed', message: res.response || appName, duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'Close Failed', message: `Could not close ${appName}`, duration: 3000 });
    }
  };

  if (!showWindowManager) return null;

  return (
    <Modal isOpen={showWindowManager} onClose={() => setShowWindowManager(false)} title="WINDOW_&_APP_MANAGER // v4.0" size="lg">
      <div className="flex flex-col h-full min-h-[400px]">
        {/* Tabs */}
        <div className="flex gap-1 mb-4 p-1 bg-background-deep/60 border border-border-default rounded-lg">
          <button onClick={() => setActiveTab('windows')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'windows' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-foreground-muted hover:text-foreground'}`}>
            <Layout className="w-3.5 h-3.5 inline mr-2" />Open Windows ({windows.length})
          </button>
          <button onClick={() => setActiveTab('apps')}
            className={`flex-1 py-2 text-[10px] font-bold uppercase tracking-widest rounded-md transition-all ${activeTab === 'apps' ? 'bg-accent/15 text-accent border border-accent/30' : 'text-foreground-muted hover:text-foreground'}`}>
            <Monitor className="w-3.5 h-3.5 inline mr-2" />Running Apps ({apps.length})
          </button>
        </div>

        {/* Search for apps tab */}
        {activeTab === 'apps' && (
          <div className="relative mb-4">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input type="text" value={appSearch} onChange={e => setAppSearch(e.target.value)}
              placeholder="Search apps..."
              className="w-full bg-background-deep border border-border-default rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-foreground-muted/50 focus:border-accent/50 outline-none transition-colors" />
          </div>
        )}

        {/* Content */}
        <div className="flex-1 overflow-y-auto space-y-1">
          {activeTab === 'windows' ? (
            windowsQuery.isLoading ? (
              <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-accent/50" /></div>
            ) : windows.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-foreground-muted/50"><Layout className="w-8 h-8 mb-2" /><span className="text-xs font-mono">No open windows detected</span></div>
            ) : (
              windows.map((w, i) => (
                <motion.div key={w.title + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 bg-background-deep/40 border border-border-default rounded-lg hover:border-accent/30 transition-all group">
                  <div className="w-2 h-2 rounded-full bg-accent/50 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground truncate">{w.title}</div>
                    <div className="text-[10px] font-mono text-foreground-muted">{w.process} (PID: {w.pid})</div>
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={() => handleWindowAction(w.title, 'activate')} className="p-1.5 hover:bg-accent/10 rounded transition-colors" title="Activate" aria-label="Activate window">
                      <ExternalLink className="w-3.5 h-3.5 text-accent" />
                    </button>
                    <button onClick={() => handleWindowAction(w.title, 'minimize')} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Minimize" aria-label="Minimize window">
                      <Minimize2 className="w-3.5 h-3.5 text-foreground-muted" />
                    </button>
                    <button onClick={() => handleWindowAction(w.title, 'maximize')} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Maximize" aria-label="Maximize window">
                      <Maximize2 className="w-3.5 h-3.5 text-foreground-muted" />
                    </button>
                    <button onClick={() => handleWindowAction(w.title, 'restore')} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Restore" aria-label="Restore window">
                      <RotateCcw className="w-3.5 h-3.5 text-foreground-muted" />
                    </button>
                  </div>
                </motion.div>
              ))
            )
          ) : (
            appsQuery.isLoading ? (
              <div className="flex items-center justify-center h-32"><RefreshCw className="w-5 h-5 animate-spin text-accent/50" /></div>
            ) : filteredApps.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-32 text-foreground-muted/50"><Monitor className="w-8 h-8 mb-2" /><span className="text-xs font-mono">No apps found</span></div>
            ) : (
              filteredApps.map((a, i) => (
                <motion.div key={a.name + i} initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: i * 0.03 }}
                  className="flex items-center gap-3 px-4 py-3 bg-background-deep/40 border border-border-default rounded-lg hover:border-accent/30 transition-all group">
                  <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center shrink-0">
                    <Monitor className="w-4 h-4 text-accent" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-mono text-foreground truncate">{a.name}</div>
                    <div className="text-[10px] font-mono text-foreground-muted">PID: {a.pid} | CPU: {a.cpu_percent?.toFixed(1)}% | MEM: {a.memory_mb?.toFixed(0)}MB</div>
                  </div>
                  <Badge variant="info" className="text-[8px]">ACTIVE</Badge>
                  <button onClick={() => handleCloseApp(a.name)}
                    className="p-1.5 hover:bg-danger/10 rounded transition-colors opacity-0 group-hover:opacity-100"
                    title="Close app" aria-label="Close app">
                    <Trash2 className="w-3.5 h-3.5 text-danger" />
                  </button>
                </motion.div>
              ))
            )
          )}
        </div>

        {/* Footer with refresh */}
        <div className="flex items-center justify-between mt-4 pt-3 border-t border-border-subtle">
          <span className="text-[10px] font-mono text-foreground-muted">
            Auto-refreshes every 10s
          </span>
          <Button size="sm" variant="ghost" onClick={() => { windowsQuery.refetch(); appsQuery.refetch(); }}>
            <RefreshCw className="w-3.5 h-3.5 mr-1" /> Refresh
          </Button>
        </div>
      </div>
    </Modal>
  );
};
