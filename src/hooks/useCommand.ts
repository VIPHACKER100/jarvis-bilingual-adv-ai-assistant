import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '@/services/websocketService';
import { broadcastRouter } from '@/services/broadcastRouter';
import type { CommandResult, PendingConfirmationInfo } from '@/types/api';
import type {
  CommandOutbound,
  ConfirmationOutbound,
  WebSocketMessage,
} from '@/types/bridge';

export interface UseCommandReturn {
  pendingConfirmation: PendingConfirmationInfo | null;
  lastResult: CommandResult | null;
  isLoading: boolean;
  error: string | null;
  executeCommand: (command: string, language?: string) => void;
  confirmAction: (confirmationId: string, approved: boolean) => void;
  clearPendingConfirmation: () => void;
  clearError: () => void;
}

export function useCommand(): UseCommandReturn {
  const [pendingConfirmation, setPendingConfirmation] =
    useState<PendingConfirmationInfo | null>(null);
  const [lastResult, setLastResult] = useState<CommandResult | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const handleCommandResult = (message: WebSocketMessage) => {
      const data = message.data as CommandResult;
      if (!data || data.success === undefined) return;
      setLastResult(data);
      setIsLoading(false);
      if (
        data.requires_confirmation &&
        data.confirmation_id
      ) {
        setPendingConfirmation({
          confirmation_id: data.confirmation_id,
          command_key: data.command_key ?? '',
          command_text: data.command ?? '',
          language: data.language ?? 'en',
          response: data.response ?? '',
          timeout: 0,
          created_at: '',
        });
      }
    };

    const handleConfirmationRequest = (message: WebSocketMessage) => {
      const data = message.data as PendingConfirmationInfo;
      if (!data || !data.confirmation_id) return;
      setPendingConfirmation(data);
      setIsLoading(false);
    };

    const handleError = (message: WebSocketMessage) => {
      const data = message.data as string;
      if (typeof data !== 'string') return;
      setError(data);
      setIsLoading(false);
    };

    broadcastRouter.on('command_result', handleCommandResult);
    broadcastRouter.on('confirmation_request', handleConfirmationRequest);
    broadcastRouter.on('error', handleError);

    return () => {
      broadcastRouter.off('command_result', handleCommandResult);
      broadcastRouter.off('confirmation_request', handleConfirmationRequest);
      broadcastRouter.off('error', handleError);
    };
  }, []);

  const executeCommand = useCallback(
    (command: string, language?: string) => {
      setIsLoading(true);
      setError(null);
      setLastResult(null);
      setPendingConfirmation(null);

      const msg: CommandOutbound = {
        type: 'command',
        command,
        language: language ?? 'en',
        timestamp: Date.now(),
      };
      websocketService.send(msg);
    },
    [],
  );

  const confirmAction = useCallback(
    (confirmationId: string, approved: boolean) => {
      const msg: ConfirmationOutbound = {
        type: 'confirmation',
        data: {
          confirmation_id: confirmationId,
          approved,
        },
      };
      websocketService.send(msg);
      setPendingConfirmation(null);
    },
    [],
  );

  const clearPendingConfirmation = useCallback(() => {
    setPendingConfirmation(null);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  return {
    pendingConfirmation,
    lastResult,
    isLoading,
    error,
    executeCommand,
    confirmAction,
    clearPendingConfirmation,
    clearError,
  };
}

export default useCommand;
