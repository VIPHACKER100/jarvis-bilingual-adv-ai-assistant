import { WebSocketMessage } from "@/types/bridge";

export type BroadcastHandler = (message: WebSocketMessage) => void;

class BroadcastRouter {
  private handlers: Map<string, BroadcastHandler[]> = new Map();

  on(type: string, handler: BroadcastHandler): void {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(type, [...existing, handler]);
  }

  off(type: string, handler: BroadcastHandler): void {
    const existing = this.handlers.get(type) || [];
    this.handlers.set(
      type,
      existing.filter((h) => h !== handler),
    );
  }

  route(message: WebSocketMessage): void {
    if (!message || !message.type) return;
    const handlers = this.handlers.get(message.type);
    if (handlers) {
      handlers.forEach((handler) => handler(message));
    }
  }
}

export const broadcastRouter = new BroadcastRouter();
