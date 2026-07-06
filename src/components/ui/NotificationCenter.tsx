import { useState, useEffect, useCallback } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

export interface Notification { id: string; title: string; message: string; type: 'info' | 'success' | 'warning' | 'error'; duration: number }

let counter = 0;

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const addNotification = useCallback((n: Omit<Notification, 'id'>) => {
    const id = `n-${++counter}-${Date.now()}`;
    setNotifications((prev) => [...prev.slice(-4), { ...n, id }]);
  }, []);
  const removeNotification = useCallback((id: string) => setNotifications((prev) => prev.filter((n) => n.id !== id)), []);

  return (
    <div className="fixed top-4 left-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none sm:left-auto sm:right-4 sm:w-[400px]" aria-live="polite" aria-label="Notifications">
      {notifications.map((n) => (
        <ToastNotification key={n.id} notification={n} onDismiss={removeNotification} />
      ))}
    </div>
  );
}

const icons = { success: <CheckCircle className="h-5 w-5 text-emerald-400" />, error: <AlertCircle className="h-5 w-5 text-red-400" />, warning: <AlertTriangle className="h-5 w-5 text-amber-400" />, info: <Info className="h-5 w-5 text-cyan-400" /> };
const borders = { success: 'border-emerald-500/30', error: 'border-red-500/30', warning: 'border-amber-500/30', info: 'border-cyan-500/30' };

function ToastNotification({ notification: n, onDismiss }: { notification: Notification; onDismiss: (id: string) => void }) {
  useEffect(() => { const t = setTimeout(() => onDismiss(n.id), n.duration); return () => clearTimeout(t); }, [n.id, n.duration, onDismiss]);
  return (
    <div className={`pointer-events-auto flex w-full items-start gap-3 glass-panel p-4 min-w-0 border ${borders[n.type]} transition-all duration-300`} role="alert">
      <div className="shrink-0 mt-0.5">{icons[n.type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-slate-200">{n.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{n.message}</p>
        <div className="mt-2 h-0.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <div className="h-full rounded-full bg-cyan-400 animate-shrink" style={{ animationDuration: `${n.duration}ms` }} />
        </div>
      </div>
      <button title="Dismiss" aria-label="Dismiss" onClick={() => onDismiss(n.id)} className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors">
        <X className="h-4 w-4" />
      </button>
    </div>
  );
}
