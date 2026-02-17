import { WebSocketMessage, CommandResponse, SystemStatus, ConnectionStatus } from '../types/bridge';

type MessageHandler = (message: WebSocketMessage) => void;
type StatusHandler = (status: ConnectionStatus) => void;

class WebSocketService {
  private ws: WebSocket | null = null;
  private url: string = 'ws://localhost:8000/ws';
  private reconnectInterval: number = 3000;
  private maxReconnectAttempts: number = 10;
  private reconnectAttempts: number = 0;
  private messageHandlers: MessageHandler[] = [];
  private statusHandlers: StatusHandler[] = [];
  private pingInterval: number | null = null;
  private isIntentionallyClosed: boolean = false;

  constructor(url?: string) {
    if (url) {
      this.url = url;
    }
  }

  // Connection management
  connect(): void {
    if (this.ws?.readyState === WebSocket.OPEN) {
      return;
    }

    this.isIntentionallyClosed = false;
    this.notifyStatusChange('connecting');

    try {
      this.ws = new WebSocket(this.url);

      this.ws.onopen = () => {
        console.log('[JARVIS] WebSocket connected');
        this.reconnectAttempts = 0;
        this.notifyStatusChange('connected');
        this.startPingInterval();
      };

      this.ws.onmessage = (event) => {
        try {
          const message: WebSocketMessage = JSON.parse(event.data);
          this.handleMessage(message);
        } catch (error) {
          console.error('[JARVIS] Error parsing message:', error);
        }
      };

      this.ws.onclose = () => {
        this.stopPingInterval();
        this.notifyStatusChange('disconnected');
        
        if (!this.isIntentionallyClosed) {
          this.attemptReconnect();
        }
      };

      this.ws.onerror = (error) => {
        console.error('[JARVIS] WebSocket error:', error);
        this.notifyStatusChange('disconnected');
      };

    } catch (error) {
      console.error('[JARVIS] Error creating WebSocket:', error);
      this.attemptReconnect();
    }
  }

  disconnect(): void {
    this.isIntentionallyClosed = true;
    this.stopPingInterval();
    
    if (this.ws) {
      this.ws.close();
      this.ws = null;
    }
  }

  private attemptReconnect(): void {
    if (this.reconnectAttempts >= this.maxReconnectAttempts) {
      console.error('[JARVIS] Max reconnection attempts reached');
      return;
    }

    this.reconnectAttempts++;
    console.log(`[JARVIS] Reconnecting... Attempt ${this.reconnectAttempts}/${this.maxReconnectAttempts}`);

    setTimeout(() => {
      this.connect();
    }, this.reconnectInterval);
  }

  // Message handling
  private handleMessage(message: WebSocketMessage): void {
    this.messageHandlers.forEach(handler => {
      try {
        handler(message);
      } catch (error) {
        console.error('[JARVIS] Error in message handler:', error);
      }
    });
  }

  onMessage(handler: MessageHandler): () => void {
    this.messageHandlers.push(handler);
    return () => {
      this.messageHandlers = this.messageHandlers.filter(h => h !== handler);
    };
  }

  // Status handling
  private notifyStatusChange(status: ConnectionStatus): void {
    this.statusHandlers.forEach(handler => {
      try {
        handler(status);
      } catch (error) {
        console.error('[JARVIS] Error in status handler:', error);
      }
    });
  }

  onStatusChange(handler: StatusHandler): () => void {
    this.statusHandlers.push(handler);
    return () => {
      this.statusHandlers = this.statusHandlers.filter(h => h !== handler);
    };
  }

  // Commands
  sendCommand(command: string, language: 'en' | 'hi' = 'en'): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      console.error('[JARVIS] WebSocket not connected');
      return;
    }

    const message = {
      type: 'command',
      command,
      language,
      timestamp: Date.now()
    };

    this.ws.send(JSON.stringify(message));
  }

  requestStatus(): void {
    if (this.ws?.readyState !== WebSocket.OPEN) {
      return;
    }

    this.ws.send(JSON.stringify({
      type: 'get_status',
      timestamp: Date.now()
    }));
  }

  sendConfirmation(confirmationId: string, approved: boolean): void {
    // Use REST API for confirmations
    fetch(`http://localhost:8000/api/confirm/${confirmationId}`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ approved }),
    }).catch(error => {
      console.error('[JARVIS] Error sending confirmation:', error);
    });
  }

  // Ping/Pong for keep-alive
  private startPingInterval(): void {
    this.pingInterval = window.setInterval(() => {
      if (this.ws?.readyState === WebSocket.OPEN) {
        this.ws.send(JSON.stringify({
          type: 'ping',
          timestamp: Date.now()
        }));
      }
    }, 30000); // Ping every 30 seconds
  }

  private stopPingInterval(): void {
    if (this.pingInterval) {
      clearInterval(this.pingInterval);
      this.pingInterval = null;
    }
  }

  // Getters
  get isConnected(): boolean {
    return this.ws?.readyState === WebSocket.OPEN;
  }

  get connectionStatus(): ConnectionStatus {
    if (this.ws?.readyState === WebSocket.OPEN) return 'connected';
    if (this.ws?.readyState === WebSocket.CONNECTING) return 'connecting';
    return 'disconnected';
  }
}

// Export singleton instance
export const websocketService = new WebSocketService();

// Export class for custom instances
export { WebSocketService };
