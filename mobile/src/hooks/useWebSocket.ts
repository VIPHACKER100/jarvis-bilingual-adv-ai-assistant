import { useEffect, useRef, useCallback, useState } from 'react';
import { useConnectionStore } from '../store/useConnectionStore';

interface WebSocketOptions {
  onWake?: () => void;
}

export const useWebSocket = (options?: WebSocketOptions) => {
  const { serverUrl, setConnected, accessToken, deviceId, isPaired } = useConnectionStore();
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const ws = useRef<WebSocket | null>(null);

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
      default:
        break;
    }
  };

  useEffect(() => {
    connect();
    return () => ws.current?.close();
  }, [connect]);

  return {
    sendMessage: (msg: any) => ws.current?.send(JSON.stringify(msg)),
    systemStatus
  };
};
