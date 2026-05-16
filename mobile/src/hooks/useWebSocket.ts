import { useEffect, useRef, useCallback, useState } from 'react';
import { useConnectionStore } from '../store/useConnectionStore';

interface WebSocketOptions {
  onWake?: () => void;
}

export const useWebSocket = (options?: WebSocketOptions) => {
  const { serverUrl, setConnected, accessToken, deviceId, isPaired } = useConnectionStore();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [isAgentThinking, setIsAgentThinking] = useState(false);
  const [agentThought, setAgentThought] = useState<string | null>(null);
  const [lastResponse, setLastResponse] = useState<string | null>(null);
  const [pendingConfirmation, setPendingConfirmation] = useState<any>(null);
  const [proactiveSuggestion, setProactiveSuggestion] = useState<string | null>(null);
  const ws = useRef<WebSocket | null>(null);
  const suggestionTimeout = useRef<any>(null);

  const connect = useCallback(() => {
    if (ws.current?.readyState === WebSocket.OPEN) return;
    if (!isPaired) return;

    // Convert http to ws and add auth params
    const baseUrl = serverUrl.replace('http', 'ws') + '/api/v1/ws';
    const wsUrl = `${baseUrl}?token=${accessToken}&device_id=${deviceId}`;
    console.log(`Connecting to WebSocket: ${baseUrl} (Auth Encrypted)`);

    ws.current = new WebSocket(wsUrl);

    ws.current.onopen = () => {
      console.log('Mobile WebSocket Connected');
      setConnected(true);
    };

    ws.current.onclose = () => {
      console.log('Mobile WebSocket Disconnected');
      setConnected(false);
      // Reconnect after 3 seconds
      setTimeout(connect, 3000);
    };

    ws.current.onerror = (e) => {
      console.error('Mobile WebSocket Error:', e);
    };

    ws.current.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        handleMessage(message);
      } catch (err) {
        console.error('Failed to parse WS message:', err);
      }
    };
  }, [serverUrl, isPaired, accessToken, deviceId]);

  const handleMessage = (message: any) => {
    switch (message.type) {
      case 'system_status':
        setSystemStatus(message.data);
        break;
      case 'wake_detected':
        console.log('JARVIS AWAKENED BY VOICE');
        if (options?.onWake) {
          options.onWake();
        }
        break;
      case 'agent_thinking':
        setIsAgentThinking(true);
        if (message.data?.thought) {
          setAgentThought(message.data.thought);
        }
        break;
      case 'agent_resolved':
        setIsAgentThinking(false);
        setAgentThought(null);
        break;
      case 'command_result':
        if (message.data?.requires_confirmation) {
          setPendingConfirmation(message.data);
        }
        if (message.data?.response) {
          setLastResponse(message.data.response);
        }
        break;
      case 'proactive_suggestion':
        if (message.data?.text) {
          setProactiveSuggestion(message.data.text);
          if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
          suggestionTimeout.current = setTimeout(() => setProactiveSuggestion(null), 10000);
        }
        break;
      default:
        break;
    }
  };

  const confirmAction = useCallback((approved: boolean) => {
    if (pendingConfirmation && ws.current) {
      ws.current.send(JSON.stringify({
        type: 'confirmation',
        data: {
          confirmation_id: pendingConfirmation.confirmation_id,
          approved
        }
      }));
      setPendingConfirmation(null);
    }
  }, [pendingConfirmation]);

  useEffect(() => {
    connect();
    return () => {
      ws.current?.close();
      if (suggestionTimeout.current) clearTimeout(suggestionTimeout.current);
    };
  }, [connect]);

  return {
    sendMessage: (msg: any) => ws.current?.send(JSON.stringify(msg)),
    systemStatus,
    isAgentThinking,
    agentThought,
    lastResponse,
    pendingConfirmation,
    confirmAction,
    proactiveSuggestion
  };
};
