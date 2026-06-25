/**
 * JARVIS Main WebSocket Service
 *
 * Features:
 * - Auto-connect on init with ?api_key= query param
 * - Exponential backoff reconnect: min(1000 * 2^attempt, 30000), max 10 attempts
 * - Ping every 30s, pong timeout 10s
 * - Typed send() method, onMessage callback registration
 * - Connection state tracking
 */

import { WS_BASE_URL, API_KEY, WS_MAX_RECONNECT_ATTEMPTS, WS_BASE_RECONNECT_DELAY, WS_MAX_RECONNECT_DELAY, WS_PING_INTERVAL, WS_PONG_TIMEOUT } from '@/config';
import type { WSOutboundMessage } from '@/types/bridge';
import { broadcastRouter } from './broadcastRouter';

type ConnectionState = 'connected' | 'disconnected' | 'connecting';

type ConnectionStateListener = (state: ConnectionState) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = WS_MAX_RECONNECT_ATTEMPTS;
  private reconnectTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private pingIntervalId: ReturnType<typeof setInterval> | null = null;
  private pongTimeoutId: ReturnType<typeof setTimeout> | null = null;
  private isIntentionalDisconnect = false;
  private _connectionState: ConnectionState = 'disconnected';
  private stateListeners: Set<ConnectionStateListener> = new Set();

  get connectionState(): ConnectionState {
    return this._connectionState;
  }

  get isConnected(): boolean {
    return this._connectionState === 'connected';
  }

  /** Subscribe to connection state changes. Returns unsubscribe function. */
  onStateChange(listener: ConnectionStateListener): () => void {
    this.stateListeners.add(listener);
    // Immediately notify with current state
    listener(this._connectionState);
    return () => {
      this.stateListeners.delete(listener);
    };
  }

  private setConnectionState(state: ConnectionState): void {
    this._connectionState = state;
    // Also broadcast via the router for store integration
    broadcastRouter.route({
      type: 'internal_connection_status',
      data: state,
    });
    this.stateListeners.forEach((listener) => listener(state));
  }

  private getUrl(): string {
    const baseUrl = WS_BASE_URL;
    if (API_KEY) {
      const separator = baseUrl.includes('?') ? '&' : '?';
      return `${baseUrl}${separator}api_key=${encodeURIComponent(API_KEY)}`;
    }
    return baseUrl;
  }

  /** Connect to the WebSocket server */
  connect(): void {
    if (this.ws && (this.ws.readyState === WebSocket.OPEN || this.ws.readyState === WebSocket.CONNECTING)) {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.setConnectionState('connecting');

    try {
      this.ws = new WebSocket(this.getUrl());
    } catch (error) {
      console.error('[WebSocket] Failed to create WebSocket:', error);
      this.setConnectionState('disconnected');
      this.scheduleReconnect();
      return;
    }

    this.ws.onopen = () => {
      console.log('[WebSocket] Connected');
      this.reconnectAttempts = 0;
      this.setConnectionState('connected');
      this.startPingInterval();
    };

    this.ws.onmessage = (event: MessageEvent) => {
      try {
        const message = JSON.parse(event.data as string);
        // Handle pong response
        if (message.type === 'pong') {
          this.clearPongTimeout();
          return;
        }
        broadcastRouter.route(message);
      } catch (e) {
        console.error('[WebSocket] Error parsing message:', e);
      }
    };

    this.ws.onclose = (event: CloseEvent) => {
      console.log(`[WebSocket] Disconnected (code: ${event.code})`);
      this.stopPingInterval();
      this.clearPongTimeout();
      this.ws = null;
      this.setConnectionState('disconnected');

      if (!this.isIntentionalDisconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = () => {
      console.warn('[WebSocket] Connection error (backend may be offline)');
      // onclose will handle reconnect
    };
  }

  /** Disconnect intentionally (no reconnect) */
  disconnect(): void {
    this.isIntentionalDisconnect = true;
    this.cleanup();
  }

  /** Send a typed message */
  send(message: WSOutboundMessage): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(message));
    } else {
      console.warn('[WebSocket] Cannot send — not connected. Message type:', message.type);
    }
  }

  /** Send a raw JSON-serializable object */
  sendRaw(data: Record<string, unknown>): void {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn('[WebSocket] Cannot send raw — not connected');
    }
  }

  // --------------------------------------------------------------------------
  // Private: Reconnection
  // --------------------------------------------------------------------------

  private scheduleReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn('[WebSocket] Max reconnect attempts reached. Giving up.');
      return;
    }

    const delay = Math.min(
      WS_BASE_RECONNECT_DELAY * Math.pow(2, this.reconnectAttempts),
      WS_MAX_RECONNECT_DELAY,
    );
    this.reconnectAttempts++;

    console.log(`[WebSocket] Reconnecting in ${delay}ms (attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts})`);

    this.setConnectionState('connecting');

    this.reconnectTimeoutId = setTimeout(() => {
      this.reconnectTimeoutId = null;
      this.connect();
    }, delay);
  }

  // --------------------------------------------------------------------------
  // Private: Ping / Pong
  // --------------------------------------------------------------------------

  private startPingInterval(): void {
    this.stopPingInterval();
    this.pingIntervalId = setInterval(() => {
      this.sendPing();
    }, WS_PING_INTERVAL);
  }

  private stopPingInterval(): void {
    if (this.pingIntervalId !== null) {
      clearInterval(this.pingIntervalId);
      this.pingIntervalId = null;
    }
  }

  private sendPing(): void {
    this.send({
      type: 'ping',
      timestamp: Date.now(),
    });

    // Set pong timeout
    this.clearPongTimeout();
    this.pongTimeoutId = setTimeout(() => {
      console.warn('[WebSocket] Pong timeout — no response in', WS_PONG_TIMEOUT, 'ms. Reconnecting...');
      this.ws?.close();
      // onclose will handle reconnect
    }, WS_PONG_TIMEOUT);
  }

  private clearPongTimeout(): void {
    if (this.pongTimeoutId !== null) {
      clearTimeout(this.pongTimeoutId);
      this.pongTimeoutId = null;
    }
  }

  // --------------------------------------------------------------------------
  // Private: Cleanup
  // --------------------------------------------------------------------------

  private cleanup(): void {
    if (this.reconnectTimeoutId !== null) {
      clearTimeout(this.reconnectTimeoutId);
      this.reconnectTimeoutId = null;
    }
    this.stopPingInterval();
    this.clearPongTimeout();

    if (this.ws) {
      this.ws.onopen = null;
      this.ws.onmessage = null;
      this.ws.onclose = null;
      this.ws.onerror = null;
      this.ws.close();
      this.ws = null;
    }

    this.setConnectionState('disconnected');
  }
}

export const websocketService = new WebSocketService();
