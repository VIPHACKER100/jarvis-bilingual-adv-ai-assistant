import { useEffect, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocketService';
import { apiClient } from '../services/apiClient';
import {
  SystemStatus,
  CommandResponse,
  WebSocketMessage
} from '../types/bridge';
import { useNotifications } from '../context/NotificationContext';
import { useJarvisStore } from '../store/jarvisStore';

export function useJarvisBridge() {
  const { 
    isConnected, setConnected,
    connectionStatus, setConnectionStatus,
    setSystemStatus,
    lastResponse, setLastResponse,
    pendingConfirmation, setPendingConfirmation,
    setBridgeError
  } = useJarvisStore();

  const { addNotification } = useNotifications();
  const confirmationTimeoutRef = useRef<number | null>(null);

  // Handle WebSocket messages
  const handleWebSocketMessage = useCallback((message: WebSocketMessage) => {
    switch (message.type) {
      case 'system_status':
        if (message.data) {
          setSystemStatus(message.data as SystemStatus);
        }
        break;

      case 'command_response':
        if (message.data) {
          const response = message.data as CommandResponse;
          setLastResponse(response);

          // Check if confirmation is required
          if (response.requires_confirmation && response.confirmation_id) {
            setPendingConfirmation({
              confirmation_id: response.confirmation_id,
              command_key: response.command_key,
              command_text: response.data?.command_text || '',
              language: response.language,
              response: response.response,
              timeout: 30,
            });

            if (confirmationTimeoutRef.current) {
              clearTimeout(confirmationTimeoutRef.current);
            }
            confirmationTimeoutRef.current = window.setTimeout(() => {
              setPendingConfirmation(null);
            }, 30000);
          }
        }
        break;

      case 'error':
        setBridgeError(message.message || 'Unknown error');
        break;

      case 'notification':
        if (message.data) {
          const { title, message: notifMsg, type, duration } = message.data as any;
          addNotification({
            title: title || 'System Alert',
            message: notifMsg || '',
            type: type || 'info',
            duration: duration || 5000
          });
        }
        break;

      case 'macro_update':
        if (message.data) {
          addNotification({
            title: 'Macro Progress',
            message: `Executed: ${message.data.command || 'Step'}`,
            type: 'system',
            duration: 2000
          });
        }
        break;

      case 'pong':
        break;
    }
  }, [setSystemStatus, setLastResponse, setPendingConfirmation, setBridgeError, addNotification]);

  // Connect on mount
  useEffect(() => {
    websocketService.connect();

    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      setConnected(status === 'connected');
    });

    const unsubscribeMessages = websocketService.onMessage((message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    });

    apiClient.healthCheck().catch(err => console.warn('Health check failed:', err));

    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
      websocketService.disconnect();
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, [setConnectionStatus, setConnected, handleWebSocketMessage]);

  // Actions
  const sendCommand = useCallback((command: string, language: 'en' | 'hi' | 'hinglish' = 'en') => {
    if (!isConnected) {
      setBridgeError('Not connected to backend');
      return;
    }
    setBridgeError(null);
    websocketService.sendCommand(command, language);
  }, [isConnected, setBridgeError]);

  const confirmCommand = useCallback(async (approved: boolean) => {
    if (!pendingConfirmation) return;

    try {
      const result = await apiClient.confirmCommand(
        pendingConfirmation.confirmation_id,
        approved
      );

      if (result.success && result.result) {
        setLastResponse(result.result);
      }

      setPendingConfirmation(null);

      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
        confirmationTimeoutRef.current = null;
      }
    } catch (err) {
      setBridgeError(err instanceof Error ? err.message : 'Confirmation failed');
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation, setLastResponse, setPendingConfirmation, setBridgeError]);

  const reconnect = useCallback(() => {
    setBridgeError(null);
    websocketService.disconnect();
    setTimeout(() => websocketService.connect(), 100);
  }, [setBridgeError]);

  return {
    sendCommand,
    confirmCommand,
    reconnect,
    requestStatus: () => websocketService.requestStatus(),
  };
}
