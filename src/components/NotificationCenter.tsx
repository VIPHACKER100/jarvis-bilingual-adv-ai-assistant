import { FC, useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNotifications, NotificationType, Notification } from '../context/NotificationContext';
import { ShieldCheck, AlertCircle, Info, Zap, X, Bell } from 'lucide-react';

const MAX_VISIBLE = 3;

export const NotificationCenter: FC = () => {
  const { notifications, removeNotification } = useNotifications();

  // Deduplicate and filter recent
  const visible = useMemo(() => {
    const seen = new Map<string, Notification>();
    for (const n of notifications) {
      const key = `${n.type}:${n.title}`;
      seen.set(key, n);
    }
    return Array.from(seen.values()).slice(-MAX_VISIBLE);
  }, [notifications]);

  if (visible.length === 0) return null;

  return (
    <div className="fixed top-24 right-6 z-[200] flex flex-col gap-4 w-full max-w-sm pointer-events-none">
      <AnimatePresence initial={false}>
        {visible.map((n, idx) => (
          <NotificationItem
            key={n.id}
            notification={n}
            index={visible.length - 1 - idx}
            onRemove={() => removeNotification(n.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
};

const NotificationItem: FC<{
  notification: Notification;
  index: number;
  onRemove: () => void;
}> = ({ notification, index, onRemove }) => {
  const getTypeConfig = (type: NotificationType) => {
    switch (type) {
      case 'success': return { icon: <ShieldCheck className="w-4 h-4" />, color: '#10B981', label: 'Security_Success' };
      case 'error': return { icon: <AlertCircle className="w-4 h-4" />, color: '#EF4444', label: 'System_Error' };
      case 'warning': return { icon: <AlertCircle className="w-4 h-4" />, color: '#F59E0B', label: 'Protocol_Alert' };
      case 'system': return { icon: <Zap className="w-4 h-4" />, color: '#5E6AD2', label: 'Neural_Event' };
      default: return { icon: <Info className="w-4 h-4" />, color: '#0EA5E9', label: 'Info_Packet' };
    }
  };

  const { icon, color, label } = getTypeConfig(notification.type);

  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: 50, scale: 0.9 }}
      animate={{ 
        opacity: 1 - (index * 0.15), 
        x: 0, 
        scale: 1 - (index * 0.04),
        y: index * 12,
        zIndex: 100 - index
      }}
      exit={{ opacity: 0, scale: 0.9, x: 20 }}
      className="relative pointer-events-auto"
    >
      <div 
        className="glass-panel--high p-4 flex gap-4 border-l-4 overflow-hidden"
        style={{ borderLeftColor: color }}
      >
        {/* Icon & Progress Ring Overlay */}
        <div className="relative flex-shrink-0 w-10 h-10 rounded-xl bg-surface-mid flex items-center justify-center">
          <div className="text-foreground" style={{ color }}>
            {icon}
          </div>
          {/* Progress SVG Ring */}
          <svg className="absolute inset-0 w-full h-full -rotate-90">
            <motion.circle
              cx="20" cy="20" r="18"
              fill="transparent"
              stroke={color}
              strokeWidth="1.5"
              strokeDasharray="113"
              initial={{ strokeDashoffset: 0 }}
              animate={{ strokeDashoffset: 113 }}
              transition={{ duration: (notification.duration || 5000) / 1000, ease: "linear" }}
              className="opacity-30"
            />
          </svg>
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0 pr-6">
          <div className="flex flex-col">
            <span className="text-[8px] font-mono uppercase tracking-[0.2em] mb-1 opacity-50" style={{ color }}>
              {label}
            </span>
            <h4 className="text-xs font-bold text-foreground truncate mb-1">
              {notification.title}
            </h4>
            <p className="text-[10px] text-foreground-muted leading-relaxed line-clamp-2 font-medium">
              {notification.message}
            </p>
          </div>
        </div>

        {/* Close Button */}
        <button
          onClick={onRemove}
          className="absolute top-2 right-2 p-1.5 rounded-lg hover:bg-surface-high text-foreground-subtle transition-colors"
        >
          <X className="w-3 h-3" />
        </button>

        {/* HUD Ambient Scanline */}
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/[0.02] to-transparent pointer-events-none animate-shimmer" />
      </div>
    </motion.div>
  );
};
