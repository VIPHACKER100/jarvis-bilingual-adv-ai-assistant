// ==========================================================================
// JARVIS v4.0 — COMP-4: NotificationToast
// Auto-dismiss toast notifications with stacking
// ==========================================================================

import type { Notification } from '../types';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';

interface NotificationToastProps {
  notification: Notification;
  onDismiss: (id: string) => void;
}

const iconMap = {
  info: Info,
  success: CheckCircle,
  warning: AlertTriangle,
  error: AlertCircle,
};

const borderColorMap = {
  info: 'border-neon-info/40',
  success: 'border-neon-success/40',
  warning: 'border-neon-warning/40',
  error: 'border-neon-error/40',
};

const iconColorMap = {
  info: 'text-neon-info',
  success: 'text-neon-success',
  warning: 'text-neon-warning',
  error: 'text-neon-error',
};

export function NotificationToast({ notification, onDismiss }: NotificationToastProps) {
  const Icon = iconMap[notification.type] ?? Info;

  return (
    <div
      className={`flex items-start gap-3 px-4 py-3 glass-panel-strong rounded-lg border ${borderColorMap[notification.type] ?? 'border-cyan-800/30'} shadow-lg min-w-[280px] max-w-[380px] animate-float`}
      role="alert"
    >
      <Icon className={`w-5 h-5 mt-0.5 flex-shrink-0 ${iconColorMap[notification.type]}`} />
      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-slate-200 truncate">{notification.title}</p>
        <p className="text-xs text-slate-400 mt-0.5 line-clamp-2">{notification.message}</p>
      </div>
      <button
        onClick={() => onDismiss(notification.id)}
        title="Dismiss notification"
        aria-label="Dismiss notification"
        className="flex-shrink-0 p-1 rounded-md hover:bg-slate-800/50 text-slate-500 hover:text-slate-300 transition-colors"
      >
        <X className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// Stack container
interface NotificationStackProps {
  notifications: Notification[];
  onDismiss: (id: string) => void;
}

export function NotificationStack({ notifications, onDismiss }: NotificationStackProps) {
  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-50 flex flex-col gap-2">
      {notifications.map((n) => (
        <NotificationToast key={n.id} notification={n} onDismiss={onDismiss} />
      ))}
    </div>
  );
}
