import { useState, useEffect, useCallback } from 'react';
import { websocketService } from '@/services/websocketService';

export function useCommand() {
  const [pendingConfirmation, setPendingConfirmation] = useState<{ id: string; command: string } | null>(null);
  const [lastResult, setLastResult] = useState<string | null>(null);

  useEffect(() => {
    const handler = (e: Event) => {
      const msg = (e as CustomEvent).detail;
      if (msg.type === 'confirmation_request') setPendingConfirmation({ id: msg.data?.confirmation_id, command: msg.data?.command_info });
      if (msg.type === 'command_result') setLastResult(msg.data?.response);
    };
    websocketService.addEventListener('message', handler);
    return () => websocketService.removeEventListener('message', handler);
  }, []);

  const executeCommand = useCallback((cmd: string, lang = 'en') => {
    websocketService.send({ type: 'command', command: cmd, language: lang, timestamp: Date.now() });
  }, []);

  const confirmAction = useCallback((id: string, approved: boolean) => {
    websocketService.send({ type: 'confirmation', data: { confirmation_id: id, approved } });
    setPendingConfirmation(null);
  }, []);

  return { pendingConfirmation, lastResult, executeCommand, confirmAction, clearPendingConfirmation: () => setPendingConfirmation(null) };
}
