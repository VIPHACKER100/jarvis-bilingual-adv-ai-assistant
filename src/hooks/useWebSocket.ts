/**
 * useWebSocket — React hook wrapping websocketService with reactive state.
 *
 * Provides:
 * - Reactive isConnected, connectionStatus
 * - sendCommand, requestStatus, sendConfirmation helpers
 * - Auto-connect on mount, disconnect on unmount
 */

import { useEffect, useState, useCallback } from 'react';
import type { ConnectionStatus } from '@/config';
import { websocketService } from '@/services/websocketService';

export function useWebSocket() {
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');

  useEffect(() => {
    // Subscribe to connection state changes
    const unsubscribe = websocketService.onStateChange((state) => {
      setIsConnected(state === 'connected');
      setConnectionStatus(state);
    });

    // Connect on mount
    websocketService.connect();

    return () => {
      unsubscribe();
      // Don't disconnect on unmount — let the singleton manage its lifecycle
      // Components that need cleanup should call websocketService.disconnect() explicitly
    };
  }, []);

  const sendCommand = useCallback((command: string, language?: string) => {
    websocketService.send({
      type: 'command',
      command,
      language: language ?? 'en',
      timestamp: Date.now(),
    });
  }, []);

  const requestStatus = useCallback(() => {
    websocketService.send({
      type: 'get_status',
      timestamp: Date.now(),
    });
  }, []);

  const sendConfirmation = useCallback((confirmationId: string, approved: boolean) => {
    websocketService.send({
      type: 'confirmation',
      data: { confirmation_id: confirmationId, approved },
    });
  }, []);

  return {
    isConnected,
    connectionStatus,
    sendCommand,
    requestStatus,
    sendConfirmation,
  };
}
