import { useEffect, useState, useCallback } from 'react';
import { websocketService } from '@/services/websocketService';
import { useStore } from '@/store';

export function useWebSocket() {
  const [connectionStatus, setConnectionStatus] = useState<'connected' | 'disconnected' | 'connecting'>('disconnected');
  const setConnected = useStore((s) => s.setConnected);

  useEffect(() => {
    const onOpen = () => { setConnectionStatus('connected'); setConnected(true); };
    const onClose = () => { setConnectionStatus('disconnected'); setConnected(false); };
    websocketService.addEventListener('open', onOpen);
    websocketService.addEventListener('close', onClose);
    websocketService.connect();
    return () => {
      websocketService.removeEventListener('open', onOpen);
      websocketService.removeEventListener('close', onClose);
    };
  }, [setConnected]);

  const sendCommand = useCallback((command: string, language?: string) => {
    websocketService.send({ type: 'command', command, language: language ?? 'en', timestamp: Date.now() });
  }, []);

  const sendConfirmation = useCallback((confirmationId: string, approved: boolean) => {
    websocketService.send({ type: 'confirmation', data: { confirmation_id: confirmationId, approved } });
  }, []);

  return { isConnected: connectionStatus === 'connected', connectionStatus, sendCommand, sendConfirmation };
}
