/**
 * NotificationCenter — Toast notification system
 *
 * Renders a stack of animated toast notifications in the top-right corner.
 * Each notification auto-dismisses after a configurable duration.
 */

import { useState, useEffect, useCallback, createContext, useContext } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

// ============================================================================
// Types
// ============================================================================

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  duration: number;
}

interface NotificationContextType {
  addNotification: (notification: Omit<Notification, 'id'>) => void;
  removeNotification: (id: string) => void;
}

// ============================================================================
// Context
// ============================================================================

const NotificationContext = createContext<NotificationContextType | null>(null);

export function useNotifications(): NotificationContextType {
  const ctx = useContext(NotificationContext);
  if (!ctx) {
    throw new Error('useNotifications must be used within NotificationProvider');
  }
  return ctx;
}

// ============================================================================
// Provider (internal, used by NotificationCenter)
// ============================================================================

let notificationCounter = 0;

// ============================================================================
// Component
// ============================================================================

export function NotificationCenter() {
  const [notifications, setNotifications] = useState<Notification[]>([]);

  const addNotification = useCallback((notif: Omit<Notification, 'id'>) => {
    const id = `notif-${++notificationCounter}-${Date.now()}`;
    const notification: Notification = { ...notif, id };
    setNotifications((prev) => [...prev.slice(-4), notification]); // Max 5 visible
  }, []);

  const removeNotification = useCallback((id: string) => {
    setNotifications((prev) => prev.filter((n) => n.id !== id));
  }, []);

  return (
    <NotificationContext.Provider value={{ addNotification, removeNotification }}>
      <div
        className="fixed top-4 right-4 z-[9999] flex flex-col gap-2 pointer-events-none"
        aria-live="polite"
        aria-label="Notifications"
      >
        <AnimatePresence initial={false}>
          {notifications.map((notif) => (
            <ToastNotification
              key={notif.id}
              notification={notif}
              onDismiss={removeNotification}
            />
          ))}
        </AnimatePresence>
      </div>
    </NotificationContext.Provider>
  );
}

// ============================================================================
// Toast Item
// ============================================================================

interface ToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

function ToastNotification({ notification, onDismiss }: ToastProps) {
  const { id, title, message, type, duration } = notification;

  useEffect(() => {
    const timer = setTimeout(() => {
      onDismiss(id);
    }, duration);
    return () => clearTimeout(timer);
  }, [id, duration, onDismiss]);

  const iconMap = {
    success: <CheckCircle className="h-5 w-5 text-emerald-400" />,
    error: <AlertCircle className="h-5 w-5 text-red-400" />,
    warning: <AlertTriangle className="h-5 w-5 text-amber-400" />,
    info: <Info className="h-5 w-5 text-cyan-400" />,
  };

  const borderMap = {
    success: 'border-emerald-500/30',
    error: 'border-red-500/30',
    warning: 'border-amber-500/30',
    info: 'border-cyan-500/30',
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 100, scale: 0.9 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 100, scale: 0.9 }}
      transition={{ type: 'spring', stiffness: 200, damping: 20 }}
      className={`pointer-events-auto flex items-start gap-3 glass-panel p-4 min-w-[300px] max-w-[400px] border ${borderMap[type]}`}
      role="alert"
    >
      <div className="shrink-0 mt-0.5">{iconMap[type]}</div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-display font-semibold text-slate-200">{title}</p>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{message}</p>
        {/* Progress bar */}
        <div className="mt-2 h-0.5 w-full bg-slate-700/50 rounded-full overflow-hidden">
          <motion.div
            initial={{ width: '100%' }}
            animate={{ width: '0%' }}
            transition={{ duration: duration / 1000, ease: 'linear' }}
            className={`h-full rounded-full ${
              type === 'success'
                ? 'bg-emerald-400'
                : type === 'error'
                  ? 'bg-red-400'
                  : type === 'warning'
                    ? 'bg-amber-400'
                    : 'bg-cyan-400'
            }`}
          />
        </div>
      </div>
      <button
        title="Dismiss notification"
        aria-label="Dismiss notification"
        onClick={() => onDismiss(id)}
        className="shrink-0 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="h-4 w-4" />
      </button>
    </motion.div>
  );
}
