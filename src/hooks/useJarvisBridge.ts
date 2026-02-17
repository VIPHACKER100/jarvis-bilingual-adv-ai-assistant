import { useState, useEffect, useCallback, useRef } from 'react';
import { websocketService } from '../services/websocketService';
import { apiClient } from '../services/apiClient';
import { 
  SystemStatus, 
  CommandResponse, 
  ConfirmationRequest, 
  ConnectionStatus,
  WebSocketMessage 
} from '../types/bridge';

interface UseJarvisBridgeReturn {
  // Connection
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  
  // System status
  systemStatus: SystemStatus | null;
  
  // Commands
  sendCommand: (command: string, language?: 'en' | 'hi') => void;
  lastResponse: CommandResponse | null;
  
  // Confirmations
  pendingConfirmation: ConfirmationRequest | null;
  confirmCommand: (approved: boolean) => void;
  
  // Error
  error: string | null;
  
  // Actions
  reconnect: () => void;
  requestStatus: () => void;
}

export function useJarvisBridge(): UseJarvisBridgeReturn {
  // State
  const [isConnected, setIsConnected] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState<ConnectionStatus>('disconnected');
  const [systemStatus, setSystemStatus] = useState<SystemStatus | null>(null);
  const [lastResponse, setLastResponse] = useState<CommandResponse | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<ConfirmationRequest | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Refs
  const confirmationTimeoutRef = useRef<number | null>(null);

  // Connect on mount
  useEffect(() => {
    websocketService.connect();

    // Subscribe to status changes
    const unsubscribeStatus = websocketService.onStatusChange((status) => {
      setConnectionStatus(status);
      setIsConnected(status === 'connected');
    });

    // Subscribe to messages
    const unsubscribeMessages = websocketService.onMessage((message: WebSocketMessage) => {
      handleWebSocketMessage(message);
    });

    // Health check
    checkBackendHealth();

    // Cleanup
    return () => {
      unsubscribeStatus();
      unsubscribeMessages();
      websocketService.disconnect();
      if (confirmationTimeoutRef.current) {
        clearTimeout(confirmationTimeoutRef.current);
      }
    };
  }, []);

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
              timeout: 30, // Default timeout
            });

            // Auto-clear after timeout
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
        setError(message.message || 'Unknown error');
        break;

      case 'pong':
        // Keep-alive received
        break;
    }
  }, []);

  // Check backend health
  const checkBackendHealth = useCallback(async () => {
    try {
      await apiClient.healthCheck();
    } catch (err) {
      console.warn('Backend health check failed:', err);
    }
  }, []);

  // Send command
  const sendCommand = useCallback((command: string, language: 'en' | 'hi' = 'en') => {
    if (!isConnected) {
      setError('Not connected to backend');
      return;
    }

    setError(null);
    websocketService.sendCommand(command, language);
  }, [isConnected]);

  // Confirm command
  const confirmCommand = useCallback(async (approved: boolean) => {
    if (!pendingConfirmation) {
      return;
    }

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
      setError(err instanceof Error ? err.message : 'Confirmation failed');
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  // Reconnect
  const reconnect = useCallback(() => {
    setError(null);
    websocketService.disconnect();
    setTimeout(() => {
      websocketService.connect();
    }, 100);
  }, []);

  // Request status manually
  const requestStatus = useCallback(() => {
    websocketService.requestStatus();
  }, []);

  return {
    isConnected,
    connectionStatus,
    systemStatus,
    sendCommand,
    lastResponse,
    pendingConfirmation,
    confirmCommand,
    error,
    reconnect,
    requestStatus,
  };
}
