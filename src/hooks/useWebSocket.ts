// ==========================================================================
// JARVIS v4.0 — useWebSocket hook with auto-reconnect & typed messages
// ==========================================================================

import { useEffect, useRef, useCallback } from 'react';
import { useStore } from '../store';
import type { WSMessage, WSOutgoingMessage, SystemStatusResponse } from '../types';

const WS_BASE_URL =
  (import.meta.env.VITE_WS_URL as string) ??
  (import.meta.env.VITE_BACKEND_URL as string)?.replace(/^http/, 'ws') ??
  'ws://localhost:8000';

const WS_PATH = '/ws';
const MAX_RETRIES = 10;
const RECONNECT_DELAY = 3000;
const HEARTBEAT_INTERVAL = 30_000;

export interface UseWebSocketOptions {
  onMessage?: (msg: WSMessage) => void;
  onStatus?: (status: SystemStatusResponse) => void;
  onNotification?: (title: string, message: string, type: 'info' | 'success' | 'warning' | 'error', duration: number) => void;
  onSuggestion?: (text: string) => void;
}

export function useWebSocket(options: UseWebSocketOptions = {}) {
  const wsRef = useRef<WebSocket | null>(null);
  const heartbeatRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const retriesRef = useRef(0);
  const reconnectTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const { apiKey, setIsConnected, setReconnectAttempts, clientId, setSystemStatus, addNotification } = useStore();

  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    if (retriesRef.current >= MAX_RETRIES) return;

    const key = apiKey ?? '';
    const url = `${WS_BASE_URL}${WS_PATH}?api_key=${encodeURIComponent(key)}&client_id=${encodeURIComponent(clientId)}`;

    try {
      const ws = new WebSocket(url);
      wsRef.current = ws;

      ws.onopen = () => {
        setIsConnected(true);
        retriesRef.current = 0;
        setReconnectAttempts(0);

        // Start heartbeat
        heartbeatRef.current = setInterval(() => {
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: 'ping' } satisfies WSOutgoingMessage));
          }
        }, HEARTBEAT_INTERVAL);
      };

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data) as WSMessage;
          options.onMessage?.(msg);

          switch (msg.type) {
            case 'system_status':
              if (msg.data) {
                setSystemStatus(msg.data as unknown as SystemStatusResponse);
                options.onStatus?.(msg.data as unknown as SystemStatusResponse);
              }
              break;
            case 'notification':
              options.onNotification?.(msg.data.title, msg.data.message, msg.data.type, msg.data.duration);
              addNotification({
                id: crypto.randomUUID(),
                title: msg.data.title,
                message: msg.data.message,
                type: msg.data.type,
                duration: msg.data.duration,
              });
              break;
            case 'proactive_suggestion':
              options.onSuggestion?.(msg.data.text);
              break;
            case 'pong':
              // Heartbeat response — no-op
              break;
          }
        } catch {
          // Ignore malformed messages
        }
      };

      ws.onclose = () => {
        setIsConnected(false);
        if (heartbeatRef.current) {
          clearInterval(heartbeatRef.current);
          heartbeatRef.current = null;
        }
        // Auto-reconnect
        if (retriesRef.current < MAX_RETRIES) {
          retriesRef.current++;
          setReconnectAttempts(retriesRef.current);
          reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
        }
      };

      ws.onerror = () => {
        // onclose will fire after onerror, triggering reconnect
        ws.close();
      };
    } catch {
      // Connection failed — retry
      if (retriesRef.current < MAX_RETRIES) {
        retriesRef.current++;
        setReconnectAttempts(retriesRef.current);
        reconnectTimerRef.current = setTimeout(connect, RECONNECT_DELAY);
      }
    }
  }, [apiKey, clientId, setIsConnected, setReconnectAttempts, setSystemStatus, addNotification, options]);

  const disconnect = useCallback(() => {
    if (reconnectTimerRef.current) {
      clearTimeout(reconnectTimerRef.current);
      reconnectTimerRef.current = null;
    }
    if (heartbeatRef.current) {
      clearInterval(heartbeatRef.current);
      heartbeatRef.current = null;
    }
    retriesRef.current = MAX_RETRIES; // Prevent reconnect
    wsRef.current?.close();
    wsRef.current = null;
    setIsConnected(false);
  }, [setIsConnected]);

  const send = useCallback((msg: WSOutgoingMessage) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify(msg));
    }
  }, []);

  const reconnect = useCallback(() => {
    retriesRef.current = 0;
    wsRef.current?.close();
    connect();
  }, [connect]);

  useEffect(() => {
    connect();
    return () => {
      disconnect();
    };
  }, [connect, disconnect]);

  return {
    send,
    isConnected: useStore.getState().isConnected,
    reconnect,
    disconnect,
  };
}
