// ==========================================================================
// JARVIS v4.0 — PAGE-1: Home / Landing
// System status bar, command input, conversation log, notifications
// ==========================================================================

import { useEffect, useCallback, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { useWebSocket } from '../hooks/useWebSocket';
import { commandsApi } from '../api/commands';
import { systemApi } from '../api/system';
import { SystemStatusBar } from '../components/SystemStatusBar';
import { CommandInput } from '../components/CommandInput';
import { ConversationLog } from '../components/ConversationLog';
import { NotificationStack } from '../components/NotificationToast';
import { ConfirmationDialog } from '../components/ConfirmationDialog';
import { QuickActionsBar } from '../components/QuickActionsBar';
import type { QuickActionKey } from '../components/QuickActionsBar';
import { Bot, Settings, BarChart3, Wifi, WifiOff } from 'lucide-react';

export function HomePage() {
  const navigate = useNavigate();

  // Store
  const {
    systemStatus,
    setSystemStatus,
    entries,
    isProcessing,
    addEntry,
    setProcessing,
    notifications,
    addNotification,
    dismissNotification,
    addConfirmation,
    removeConfirmation,
    isConnected,
  } = useStore();

  // Local state
  const [statusLoading, setStatusLoading] = useState(true);
  const [currentConfirmation, setCurrentConfirmation] = useState<{
    id: string;
    command: string;
    details: string;
    timeout: number;
  } | null>(null);
  const [confirmLoading, setConfirmLoading] = useState(false);
  const [suggestion, setSuggestion] = useState<string | null>(null);

  // WebSocket
  useWebSocket({
    onStatus: (status) => {
      setSystemStatus(status);
      setStatusLoading(false);
    },
    onNotification: (title, message, type, duration) => {
      addNotification({ id: crypto.randomUUID(), title, message, type, duration });
    },
    onSuggestion: (text) => {
      setSuggestion(text);
      // Auto-dismiss suggestion after 15s
      setTimeout(() => setSuggestion(null), 15_000);
    },
  });

  // Initial REST fetch for status (fallback)
  useEffect(() => {
    const fetchStatus = async () => {
      try {
        const status = await systemApi.getStatus();
        setSystemStatus(status);
      } catch {
        // WS will provide updates
      } finally {
        setStatusLoading(false);
      }
    };
    fetchStatus();
  }, [setSystemStatus]);

  // Auth key listener
  useEffect(() => {
    const handler = () => {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Auth Error',
        message: 'Invalid or missing API key. Please configure it in Settings.',
        type: 'error',
        duration: 8000,
      });
    };
    window.addEventListener('auth:invalid-key', handler);
    return () => window.removeEventListener('auth:invalid-key', handler);
  }, [addNotification]);

  // Handle command submission
  const handleCommand = useCallback(async (command: string, language: 'en' | 'hi' | 'hinglish') => {
    addEntry({
      id: crypto.randomUUID(),
      type: 'user',
      text: command,
      timestamp: new Date().toISOString(),
      action_type: null,
    });

    setProcessing(true);

    try {
      const result = await commandsApi.execute({
        command,
        language,
        session_id: crypto.randomUUID(),
      });

      if (result.requires_confirmation && result.confirmation_id) {
        // Show confirmation dialog
        const timeout = systemStatus?.personality?.id === 'stark' ? 30 : 30;
        setCurrentConfirmation({
          id: result.confirmation_id,
          command,
          details: result.response ?? 'This action requires confirmation',
          timeout,
        });
        addConfirmation({
          id: result.confirmation_id,
          command,
          details: result.response ?? '',
          timeout,
          expiresAt: Date.now() + timeout * 1000,
        });
        setProcessing(false);
        return;
      }

      addEntry({
        id: crypto.randomUUID(),
        type: 'jarvis',
        text: result.response ?? result.error ?? 'Command processed',
        timestamp: new Date().toISOString(),
        action_type: result.action_type,
      });
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Command failed';
      addEntry({
        id: crypto.randomUUID(),
        type: 'jarvis',
        text: `Error: ${msg}`,
        timestamp: new Date().toISOString(),
        action_type: 'ERROR',
      });
      addNotification({
        id: crypto.randomUUID(),
        title: 'Command Error',
        message: msg,
        type: 'error',
        duration: 5000,
      });
    } finally {
      setProcessing(false);
    }
  }, [addEntry, setProcessing, addNotification, systemStatus, addConfirmation]);

  // Confirmation handlers
  const handleApprove = useCallback(async () => {
    if (!currentConfirmation) return;
    setConfirmLoading(true);
    try {
      const result = await commandsApi.confirm(currentConfirmation.id, { approved: true });
      addEntry({
        id: crypto.randomUUID(),
        type: 'jarvis',
        text: result.response ?? 'Action confirmed and executed',
        timestamp: new Date().toISOString(),
        action_type: 'CONFIRMED',
      });
      removeConfirmation(currentConfirmation.id);
      setCurrentConfirmation(null);
    } catch (err: unknown) {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Confirmation Failed',
        message: err instanceof Error ? err.message : 'Failed to confirm',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setConfirmLoading(false);
    }
  }, [currentConfirmation, addEntry, removeConfirmation, addNotification]);

  const handleReject = useCallback(async () => {
    if (!currentConfirmation) return;
    setConfirmLoading(true);
    try {
      await commandsApi.confirm(currentConfirmation.id, { approved: false });
      removeConfirmation(currentConfirmation.id);
      setCurrentConfirmation(null);
    } catch {
      // silent
    } finally {
      setConfirmLoading(false);
    }
  }, [currentConfirmation, removeConfirmation]);

  // Quick actions
  const handleQuickAction = useCallback(async (actionKey: QuickActionKey) => {
    switch (actionKey) {
      case 'volume_up':
        await systemApi.volumeUp(10);
        break;
      case 'volume_down':
        await systemApi.volumeDown(10);
        break;
      case 'mute':
        await systemApi.toggleMute();
        break;
      case 'screenshot':
        addNotification({
          id: crypto.randomUUID(),
          title: 'Screenshot',
          message: 'Screenshot feature coming soon',
          type: 'info',
          duration: 3000,
        });
        break;
      case 'refresh_status': {
        const status = await systemApi.getStatus();
        setSystemStatus(status);
        break;
      }
      case 'open_analytics':
        navigate('/analytics');
        break;
    }
  }, [addNotification, setSystemStatus, navigate]);

  // Connection status banner
  const showDisconnected = !isConnected && !statusLoading;

  return (
    <div className="flex flex-col h-screen bg-cyber-dark">
      {/* Header */}
      <header className="flex items-center justify-between px-4 md:px-6 py-3 border-b border-cyan-900/30">
        <div className="flex items-center gap-3">
          <Bot className="w-6 h-6 text-cyan-400" />
          <h1 className="font-display text-xl font-bold neon-text hidden sm:block">J.A.R.V.I.S.</h1>
        </div>

        <div className="flex items-center gap-2">
          {/* Connection indicator */}
          {showDisconnected ? (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-rose-900/20 border border-rose-800/30">
              <WifiOff className="w-3 h-3 text-neon-error" />
              <span className="text-[10px] font-mono text-neon-error">Disconnected</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 px-2 py-1 rounded-md bg-green-900/20 border border-green-800/30">
              <Wifi className="w-3 h-3 text-neon-success" />
              <span className="text-[10px] font-mono text-neon-success">Connected</span>
            </div>
          )}

          <button
            onClick={() => navigate('/settings')}
            title="Settings"
            aria-label="Open Settings"
            className="p-2 glass-button !rounded-lg transition-all duration-200"
          >
            <Settings className="w-4 h-4" />
          </button>
          <button
            onClick={() => navigate('/analytics')}
            title="Analytics"
            aria-label="Open Analytics"
            className="p-2 glass-button !rounded-lg transition-all duration-200"
          >
            <BarChart3 className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* Main Content */}
      <div className="flex-1 overflow-hidden flex flex-col gap-3 p-4 md:p-6">
        {/* System Status Bar */}
        <SystemStatusBar status={systemStatus} isLoading={statusLoading} />

        {/* Active Window Card */}
        {systemStatus?.active_window && (
          <div className="glass-panel rounded-lg px-4 py-2 flex items-center gap-3">
            <Monitor className="w-4 h-4 text-cyan-500" />
            <div className="flex-1 min-w-0">
              <p className="text-xs font-mono text-slate-300 truncate">{systemStatus.active_window.title}</p>
              <p className="text-[10px] font-mono text-slate-500">{systemStatus.active_window.process}</p>
            </div>
          </div>
        )}

        {/* Conversation Log */}
        <div className="flex-1 glass-panel rounded-xl overflow-hidden flex flex-col min-h-0">
          <div className="p-3 border-b border-cyan-900/30">
            <h2 className="font-display text-sm font-bold text-cyan-300 uppercase tracking-wider">Conversation</h2>
          </div>
          <div className="flex-1 overflow-y-auto">
            <ConversationLog entries={entries} isProcessing={isProcessing} isEmpty={entries.length === 0} />
          </div>
        </div>

        {/* Quick Actions */}
        <QuickActionsBar onAction={handleQuickAction} disabled={isProcessing} />

        {/* Command Input */}
        <CommandInput onSubmit={handleCommand} disabled={isProcessing} />

        {/* Suggestion Banner */}
        {suggestion && (
          <div className="fixed bottom-24 left-1/2 -translate-x-1/2 z-40 flex items-center gap-3 glass-panel-strong rounded-lg px-4 py-3 border border-cyan-700/40 shadow-lg max-w-lg">
            <p className="text-sm text-slate-200 flex-1">{suggestion}</p>
            <button
              onClick={() => {
                handleCommand(suggestion, 'en');
                setSuggestion(null);
              }}
              title="Execute suggestion"
              aria-label="Execute suggestion"
              className="text-xs font-semibold glass-button glass-button-primary px-3 py-1.5"
            >
              Execute
            </button>
            <button
              onClick={() => setSuggestion(null)}
              title="Dismiss suggestion"
              aria-label="Dismiss suggestion"
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              Dismiss
            </button>
          </div>
        )}
      </div>

      {/* Notifications */}
      <NotificationStack
        notifications={notifications}
        onDismiss={dismissNotification}
      />

      {/* Confirmation Dialog */}
      {currentConfirmation && (
        <ConfirmationDialog
          isOpen={true}
          command={currentConfirmation.command}
          details={currentConfirmation.details}
          timeout={currentConfirmation.timeout}
          onApprove={handleApprove}
          onReject={handleReject}
          isApproving={confirmLoading}
        />
      )}
    </div>
  );
}

function Monitor(props: React.SVGProps<SVGSVGElement>) {
  return (
    <svg {...props} fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}
