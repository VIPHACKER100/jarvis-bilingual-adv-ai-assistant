import { SystemStatus, CommandResult, PendingConfirmationInfo } from "./api";

export interface WebSocketMessage {
  type: string;
  data?: any;
}

export interface SystemStatusEvent {
  type: "system_status";
  data: SystemStatus;
}

export interface CommandResultEvent {
  type: "command_result";
  data: CommandResult;
}

export interface WakeDetectedEvent {
  type: "wake_detected";
  data: { model: string; score: number };
}

export interface ProactiveSuggestionEvent {
  type: "proactive_suggestion";
  data: {
    suggestion: string;
    topic: string;
    mood: string;
    timestamp: string;
  };
}

export interface ConfirmationRequestEvent {
  type: "confirmation_request";
  data: PendingConfirmationInfo;
}

export type WSIncomingEvent =
  | SystemStatusEvent
  | CommandResultEvent
  | WakeDetectedEvent
  | ProactiveSuggestionEvent
  | ConfirmationRequestEvent;
