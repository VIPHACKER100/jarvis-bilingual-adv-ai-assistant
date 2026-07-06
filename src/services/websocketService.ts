import { WS_BASE_URL, API_KEY } from '@/config';

class WebSocketService extends EventTarget {
  private ws: WebSocket | null = null;
  private reconnectTimer: ReturnType<typeof setTimeout> | null = null;
  private _connected = false;

  get connected() { return this._connected; }

  connect() {
    if (this.ws?.readyState === WebSocket.OPEN || this.ws?.readyState === WebSocket.CONNECTING) return;
    const url = API_KEY ? WS_BASE_URL + '?api_key=' + encodeURIComponent(API_KEY) : WS_BASE_URL;
    try {
      this.ws = new WebSocket(url);
    } catch {
      this.scheduleReconnect();
      return;
    }
    this.ws.onopen = () => {
      this._connected = true;
      this.dispatchEvent(new CustomEvent('open'));
    };
    this.ws.onmessage = (e) => {
      try { this.dispatchEvent(new CustomEvent('message', { detail: JSON.parse(e.data as string) })); }
      catch { /* ignore parse errors */ }
    };
    this.ws.onclose = () => {
      this._connected = false;
      this.dispatchEvent(new CustomEvent('close'));
      this.scheduleReconnect();
    };
    this.ws.onerror = () => { /* onclose will fire */ };
  }

  disconnect() {
    if (this.reconnectTimer) { clearTimeout(this.reconnectTimer); this.reconnectTimer = null; }
    if (this.ws) { this.ws.onclose = null; this.ws.close(); this.ws = null; }
    this._connected = false;
  }

  send(data: unknown) {
    if (this.ws?.readyState === WebSocket.OPEN) this.ws.send(JSON.stringify(data));
  }

  private scheduleReconnect() {
    if (this.reconnectTimer) return;
    this.reconnectTimer = setTimeout(() => {
      this.reconnectTimer = null;
      this.connect();
    }, 2000);
  }
}

export const websocketService = new WebSocketService();
