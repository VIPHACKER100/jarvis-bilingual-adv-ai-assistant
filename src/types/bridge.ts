/**
 * WebSocket Message Types — Inbound (Server → Client) and Outbound (Client → Server)
 *
 * Covers both the Main WS (/ws) and Audio WS (/api/v1/audio/ws/audio).
 */

import type {
  SystemStatus,
  CommandResult,
  PendingConfirmationInfo,
  WakeDetectedEvent,
  ProactiveSuggestionEvent,
  AudioWSIncoming,
  AudioWSOutgoing,
} from './api';

// ============================================================================
// Main WebSocket — Inbound Messages (Server → Client)
// ============================================================================

export interface SystemStatusEvent {
  type: 'system_status';
  data: SystemStatus;
  timestamp?: string;
}

export interface CommandResultEvent {
  type: 'command_result';
  data: CommandResult;
  timestamp?: string;
}

export interface ConfirmationRequestEvent {
  type: 'confirmation_request';
  data: PendingConfirmationInfo;
  timestamp?: string;
}

export interface NotificationEvent {
  type: 'notification';
  data: {
    title: string;
    message: string;
    type: 'info' | 'success' | 'warning' | 'error';
    duration?: number;
  };
  timestamp?: string;
}

export interface WakeDetectedEventMessage {
  type: 'wake_detected';
  data: WakeDetectedEvent;
  timestamp?: string;
}

export interface ProactiveSuggestionEventMessage {
  type: 'proactive_suggestion';
  data: ProactiveSuggestionEvent;
  timestamp?: string;
}

export interface AgentThinkingEvent {
  type: 'agent_thinking';
  data: { thought: string };
  timestamp?: string;
}

export interface AgentResolvedEvent {
  type: 'agent_resolved';
  data: { response: string };
  timestamp?: string;
}

export interface NeuralLogEvent {
  type: 'neural_log';
  data: { level: string; message: string };
  timestamp?: string;
}

export interface PersonalitySyncEvent {
  type: 'personality_sync';
  data: { id: string; name: string; accent?: string };
  timestamp?: string;
}

export interface PongEvent {
  type: 'pong';
  timestamp?: string;
}

export interface ErrorEvent {
  type: 'error';
  data: string;
  timestamp?: string;
}

/** Internal connection status event (not from backend, from websocketService) */
export interface InternalConnectionStatusEvent {
  type: 'internal_connection_status';
  data: 'connected' | 'disconnected' | 'connecting';
}

/** Union of all possible WS inbound messages */
export type WSInboundMessage =
  | SystemStatusEvent
  | CommandResultEvent
  | ConfirmationRequestEvent
  | NotificationEvent
  | WakeDetectedEventMessage
  | ProactiveSuggestionEventMessage
  | AgentThinkingEvent
  | AgentResolvedEvent
  | NeuralLogEvent
  | PersonalitySyncEvent
  | PongEvent
  | ErrorEvent
  | InternalConnectionStatusEvent;

// ============================================================================
// Main WebSocket — Outbound Messages (Client → Server)
// ============================================================================

export interface CommandOutbound {
  type: 'command';
  command: string;
  language?: string;
  params?: Record<string, unknown>;
  session_id?: string;
  timestamp?: number;
}

export interface ConfirmationOutbound {
  type: 'confirmation';
  data: {
    confirmation_id: string;
    approved: boolean;
  };
}

export interface PingOutbound {
  type: 'ping';
  timestamp?: number;
}

export interface GetStatusOutbound {
  type: 'get_status';
  timestamp?: number;
}

/** Union of all possible WS outbound messages */
export type WSOutboundMessage =
  | CommandOutbound
  | ConfirmationOutbound
  | PingOutbound
  | GetStatusOutbound;

// ============================================================================
// Audio WebSocket — Typed re-exports from api.ts
// ============================================================================

/** Inbound audio WS message (server → client) */
export type AudioWSInbound = AudioWSIncoming;

/** Outbound audio WS message (client → server) */
export type AudioWSOutbound = AudioWSOutgoing;

// ============================================================================
// Generic Message Type for Broadcast Router
// ============================================================================

export interface WebSocketMessage {
  type: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  data?: any;
  timestamp?: string;
}

// ============================================================================
// Broadcast Router Types
// ============================================================================

export type BroadcastHandler = (message: WebSocketMessage) => void;
export type UnsubscribeFn = () => void;
