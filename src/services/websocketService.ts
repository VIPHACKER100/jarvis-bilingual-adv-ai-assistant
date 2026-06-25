import { broadcastRouter } from "./broadcastRouter";

const WS_BASE_URL =
  import.meta.env.VITE_APP_URL?.replace(/^http/, "ws") || "ws://localhost:8000";

class WebSocketService {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 10;
  private reconnectTimeout: number | null = null;
  private isIntentionalDisconnect = false;

  private getUrl() {
    const apiKey = import.meta.env.VITE_JARVIS_API_KEY || "";
    return `${WS_BASE_URL}/ws?api_key=${apiKey}`;
  }

  connect() {
    if (
      this.ws &&
      (this.ws.readyState === WebSocket.OPEN ||
        this.ws.readyState === WebSocket.CONNECTING)
    ) {
      return;
    }

    this.isIntentionalDisconnect = false;
    this.ws = new WebSocket(this.getUrl());

    this.ws.onopen = () => {
      console.log("[WebSocket] Connected");
      this.reconnectAttempts = 0;
      broadcastRouter.route({
        type: "internal_connection_status",
        data: "connected",
      });
    };

    this.ws.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        broadcastRouter.route(message);
      } catch (e) {
        console.error("[WebSocket] Error parsing message", e);
      }
    };

    this.ws.onclose = () => {
      console.log("[WebSocket] Disconnected");
      broadcastRouter.route({
        type: "internal_connection_status",
        data: "disconnected",
      });
      this.ws = null;
      if (!this.isIntentionalDisconnect) {
        this.scheduleReconnect();
      }
    };

    this.ws.onerror = (error) => {
      console.warn("[WebSocket] Connection error (backend may be offline)");
      // Let onclose handle reconnect
    };
  }

  disconnect() {
    this.isIntentionalDisconnect = true;
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private scheduleReconnect() {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.warn("[WebSocket] Max reconnect attempts reached");
      return;
    }

    const backoffTime = Math.min(
      1000 * Math.pow(2, this.reconnectAttempts),
      30000,
    );
    this.reconnectAttempts++;

    console.log(
      `[WebSocket] Reconnecting in ${backoffTime}ms (Attempt ${this.reconnectAttempts})`,
    );
    broadcastRouter.route({
      type: "internal_connection_status",
      data: "connecting",
    });

    this.reconnectTimeout = window.setTimeout(() => {
      this.connect();
    }, backoffTime);
  }

  send(data: any) {
    if (this.ws && this.ws.readyState === WebSocket.OPEN) {
      this.ws.send(JSON.stringify(data));
    } else {
      console.warn("[WebSocket] Cannot send, not connected");
    }
  }
}

export const websocketService = new WebSocketService();
