import { FC, useEffect, useState } from 'react';
import { useNotifications, NotificationType } from '../context/NotificationContext';

export const NotificationCenter: FC = () => {
  const { notifications, removeNotification } = useNotifications();

  if (notifications.length === 0) return null;

  return (
    <div className="fixed top-4 right-4 z-[200] flex flex-col gap-3 w-full max-w-sm pointer-events-none">
      {notifications.map((n, idx) => (
        <NotificationItem
          key={n.id}
          notification={n}
          index={idx}
          onRemove={() => removeNotification(n.id)}
        />
      ))}
    </div>
  );
};

const NotificationItem: FC<{
  notification: any;
  index: number;
  onRemove: () => void;
}> = ({ notification, index, onRemove }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setIsVisible(true), 10);
    return () => clearTimeout(timer);
  }, []);

  const getTypeStyles = (type: NotificationType) => {
    switch (type) {
      case 'success': return { colorClass: 'cyan-500', icon: '⚡', borderColor: 'rgba(6,182,212,0.3)', textColor: '#22d3ee' };
      case 'error': return { colorClass: 'red-500', icon: '⚠️', borderColor: 'rgba(239,68,68,0.3)', textColor: '#f87171' };
      case 'warning': return { colorClass: 'amber-500', icon: '🔔', borderColor: 'rgba(245,158,11,0.3)', textColor: '#fbbf24' };
      case 'system': return { colorClass: 'purple-500', icon: '🤖', borderColor: 'rgba(var(--neon-rgb),0.3)', textColor: 'var(--neon-blue)' };
      default: return { colorClass: 'slate-400', icon: 'ℹ️', borderColor: 'rgba(var(--neon-rgb),0.2)', textColor: 'var(--neon-blue)' };
    }
  };

  const { colorClass, icon, borderColor, textColor } = getTypeStyles(notification.type);

  return (
    <div
      className={`relative p-4 rounded-lg transform transition-all duration-500 pointer-events-auto shadow-2xl backdrop-blur-md overflow-hidden group
        ${isVisible ? 'translate-x-0 opacity-100 scale-100' : 'translate-x-[120%] opacity-0 scale-95'}
        bg-[#080d14]/90
      `}
      style={{
        border: `1px solid ${borderColor}`,
        boxShadow: `0 10px 30px rgba(0,0,0,0.5), inset 0 0 10px rgba(var(--neon-rgb), 0.05)`,
        zIndex: 100 - index
      }}
    >
      {/* HUD corner accents */}
      <div 
        className="absolute top-0 left-0 w-2 h-2 border-t border-l opacity-50 transition-colors"
        style={{ borderColor: textColor }}
      ></div>
      <div 
        className="absolute bottom-0 right-0 w-2 h-2 border-b border-r opacity-50 transition-colors"
        style={{ borderColor: textColor }}
      ></div>

      {/* Progress bar background */}
      <div className="absolute bottom-0 left-0 h-0.5 bg-slate-800 w-full opacity-30"></div>
      
      {/* Animated underline */}
      <div 
        className="absolute bottom-0 left-0 h-0.5 transition-all duration-500"
        style={{
          backgroundColor: textColor.startsWith('var') ? 'var(--neon-blue)' : textColor,
          width: isVisible ? '100%' : '0%',
          transition: `width ${notification.duration || 5000}ms linear`
        }}
      ></div>

      <div className="flex items-start gap-4">
        <div 
          className="flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center text-sm shadow-inner transition-colors"
          style={{ 
            borderColor: borderColor,
            backgroundColor: `rgba(var(--neon-rgb), 0.05)`,
            color: textColor 
          }}
        >
          {icon}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex justify-between items-start">
            <h4 
              className="text-xs font-bold uppercase tracking-[0.2em] mb-1 truncate pr-4"
              style={{ color: textColor }}
            >
              {notification.title}
            </h4>
            <button
              onClick={onRemove}
              className="text-slate-600 hover:text-white transition-colors absolute top-3 right-3 p-1 leading-none text-xl"
              aria-label="Dismiss"
            >
              ×
            </button>
          </div>
          <p className="text-[11px] text-gray-400 font-medium leading-relaxed">
            {notification.message}
          </p>
          <div className="mt-2 flex items-center gap-2">
            <span className="text-[8px] text-slate-600 font-mono flex items-center gap-1 uppercase tracking-tighter">
              <span 
                className="w-1 h-1 rounded-full animate-pulse"
                style={{ backgroundColor: textColor }}
              ></span>
              {new Date(notification.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
};
