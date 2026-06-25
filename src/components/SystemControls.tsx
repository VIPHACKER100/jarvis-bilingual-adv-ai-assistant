import { FC, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Power, RotateCcw, Moon, AlertTriangle, Monitor,
  Shield, Zap, LogOut,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { apiClient } from '../services/apiClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

type SystemAction = 'shutdown' | 'restart' | 'sleep' | 'lock' | 'hibernate' | 'logout';

const ACTION_CONFIG: Record<SystemAction, { label: string; icon: FC<{ className?: string }>; color: string; description: string }> = {
  shutdown: { label: 'Shutdown', icon: Power, color: 'text-red-400', description: 'Power off the system completely. All unsaved work will be lost.' },
  restart: { label: 'Restart', icon: RotateCcw, color: 'text-amber-400', description: 'Reboot the operating system. All applications will close.' },
  sleep: { label: 'Sleep', icon: Moon, color: 'text-blue-400', description: 'Put the system into low-power sleep mode. Session is preserved.' },
  lock: { label: 'Lock', icon: Shield, color: 'text-purple-400', description: 'Lock the workstation. Password required to unlock.' },
  hibernate: { label: 'Hibernate', icon: Zap, color: 'text-cyan-400', description: 'Save session to disk and power off. Slower wake than sleep.' },
  logout: { label: 'Log Out', icon: LogOut, color: 'text-orange-400', description: 'End current user session. All applications will close.' },
};

export const SystemControls: FC = () => {
  const { showSystemControls, setShowSystemControls } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [pendingAction, setPendingAction] = useState<SystemAction | null>(null);
  const [isExecuting, setIsExecuting] = useState(false);
  const [countdown, setCountdown] = useState(0);

  const initiateAction = (action: SystemAction) => {
    setPendingAction(action);
    setCountdown(5);
    const interval = setInterval(() => {
      setCountdown(prev => {
        if (prev <= 1) {
          clearInterval(interval);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
  };

  const executeAction = async () => {
    if (!pendingAction) return;
    setIsExecuting(true);
    try {
      let res;
      switch (pendingAction) {
        case 'shutdown': res = await apiClient.shutdownComputer(true); break;
        case 'restart': res = await apiClient.restartComputer(true); break;
        case 'sleep': res = await apiClient.sleepComputer(true); break;
        case 'lock': res = await apiClient.lockWorkstation(); break;
        case 'hibernate': res = await apiClient.hibernateComputer(true); break;
        case 'logout': res = await apiClient.logoutUser(true); break;
      }
      addNotification({
        type: 'warning',
        title: `${pendingAction.toUpperCase()} Initiated`,
        message: res?.response || `System ${pendingAction} command sent.`,
        duration: 5000,
      });
      setPendingAction(null);
    } catch {
      addNotification({ type: 'error', title: 'Action Failed', message: `Could not execute ${pendingAction}`, duration: 4000 });
    }
    setIsExecuting(false);
  };

  const cancelAction = () => {
    setPendingAction(null);
    setCountdown(0);
  };

  if (!showSystemControls) return null;

  return (
    <Modal isOpen={showSystemControls} onClose={() => setShowSystemControls(false)} title="SYSTEM_CONTROLS // v4.0" size="md">
      <div className="space-y-6">
        <div className="flex items-center gap-3 px-1">
          <Monitor className="w-5 h-5 text-accent" />
          <span className="text-xs font-mono text-foreground-muted">
            Execute system-level power operations. All actions trigger a confirmation countdown.
          </span>
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {(Object.entries(ACTION_CONFIG) as [SystemAction, typeof ACTION_CONFIG[string]][]).map(([key, config]) => {
            const Icon = config.icon;
            return (
              <button key={key} onClick={() => initiateAction(key)}
                className="flex flex-col items-center gap-2 p-4 bg-background-deep/60 border border-border-default rounded-xl transition-all hover:border-accent/30 hover:bg-accent/[0.03] hover:-translate-y-1 group">
                <div className={`p-3 rounded-xl bg-accent/5 border border-accent/10 group-hover:border-accent/30 transition-all ${config.color}`}>
                  <Icon className="w-6 h-6" />
                </div>
                <span className="text-[11px] font-bold uppercase tracking-widest text-foreground">{config.label}</span>
              </button>
            );
          })}
        </div>

        <AnimatePresence>
          {pendingAction && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -10 }}
              className="relative p-5 bg-background-deep border-2 border-danger/30 rounded-xl"
            >
              <div className="absolute inset-0 rounded-xl bg-gradient-to-br from-danger/5 to-transparent pointer-events-none" />
              <div className="relative z-10 flex items-start gap-4">
                <div className="p-3 rounded-xl bg-danger/10 border border-danger/30 shrink-0">
                  <AlertTriangle className="w-6 h-6 text-danger" />
                </div>
                <div className="flex-1">
                  <h3 className="text-sm font-bold text-foreground mb-1">
                    {ACTION_CONFIG[pendingAction].label.toUpperCase()}
                  </h3>
                  <p className="text-xs text-foreground-muted leading-relaxed">
                    {ACTION_CONFIG[pendingAction].description}
                  </p>
                  <div className="mt-4 flex items-center gap-4">
                    <Button onClick={executeAction} disabled={isExecuting || countdown > 0}
                      isLoading={isExecuting} variant="danger" className="text-[10px]">
                      {countdown > 0 ? `Confirm (${countdown}s)` : `Confirm ${ACTION_CONFIG[pendingAction].label.toUpperCase()}`}
                    </Button>
                    <Button onClick={cancelAction} variant="ghost" className="text-[10px]" disabled={isExecuting}>
                      Cancel
                    </Button>
                  </div>
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="flex items-center justify-between pt-3 border-t border-border-subtle">
          <span className="text-[8px] font-mono text-foreground-muted/50">Requires admin privileges for power operations</span>
          <span className="text-[8px] font-mono text-foreground-muted/50">DANGER ZONE</span>
        </div>
      </div>
    </Modal>
  );
};
