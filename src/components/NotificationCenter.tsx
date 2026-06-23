import { FC, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, NotificationType, Notification } from '../context/NotificationContext';
import { ShieldCheck, AlertCircle, Info, Zap, X } from 'lucide-react';

const MAX_VISIBLE = 3;

const typeConfig: Record<NotificationType, { icon: React.ReactNode; color: string; label: string }> = {
  success: { icon: <ShieldCheck className="w-4 h-4" />, color: '#10B981', label: 'Success' },
  error: { icon: <AlertCircle className="w-4 h-4" />, color: '#F43F5E', label: 'Error' },
  warning: { icon: <AlertCircle className="w-4 h-4" />, color: '#F59E0B', label: 'Warning' },
  system: { icon: <Zap className="w-4 h-4" />, color: 'var(--accent)', label: 'System' },
  info: { icon: <Info className="w-4 h-4" />, color: '#06B6D4', label: 'Info' },
};

export const NotificationCenter: FC = () => {
  const { notifications, removeNotification } = useNotifications();

  const visible = useMemo(() => {
    const seen = new Map<string, Notification>();
    for (const n of notifications) {
      seen.set(`${n.type}:${n.title}`, n);
    }
    return Array.from(seen.values()).slice(-MAX_VISIBLE);
  }, [notifications]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-20 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      <AnimatePresence initial={false}>
        {visible.map((n) => (
          <NotificationItem
            key={n.id}
            notification={n}
            onRemove={() => removeNotification(n.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: FC<{
  notification: Notification;
  onRemove: () => void;
}> = ({ notification, onRemove }) => {
  const config = typeConfig[notification.type];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 40, scale: 0.95 }}
      animate={{ opacity: 1, x: 0, scale: 1 }}
      exit={{ opacity: 0, x: 20, scale: 0.95 }}
      transition={{ type: 'spring', stiffness: 300, damping: 25 }}
      className="pointer-events-auto"
    >
      <div className="relative glass-panel--high overflow-hidden border-l-[3px] p-4 pl-3" style={{ borderLeftColor: config.color }}>
        <div className="flex items-start gap-3">
          <div className="flex-shrink-0 mt-0.5" style={{ color: config.color }}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-0.5">
              <span className="text-[9px] font-mono font-bold uppercase tracking-wider animate-shimmer drop-shadow-md" style={{ color: config.color }}>
                {config.label}
              </span>
            </div>
            <p className="text-sm font-medium text-foreground">{notification.title}</p>
            {notification.message && (
              <p className="text-xs text-foreground-muted mt-0.5 line-clamp-2">{notification.message}</p>
            )}
          </div>
          <button
            onClick={onRemove}
            className="flex-shrink-0 p-1 rounded-md hover:bg-surface-high text-foreground-subtle hover:text-foreground transition-colors"
            aria-label="Dismiss"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {notification.duration !== 0 && (
          <motion.div
            initial={{ scaleX: 1 }}
            animate={{ scaleX: 0 }}
            transition={{ duration: (notification.duration || 5000) / 1000, ease: 'linear' }}
            className="absolute bottom-0 left-0 right-0 h-[2px] origin-left"
            style={{ backgroundColor: config.color, opacity: 0.3 }}
          />
        )}
      </div>
    </motion.div>
  );
};
