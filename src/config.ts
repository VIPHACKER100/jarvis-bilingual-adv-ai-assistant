/**
 * JARVIS Frontend Configuration — v4.0 Neural Core
 * Centralized settings for backend connectivity and environment detection
 */

// Port for the backend API
// Priority: 1. Environment Variable, 2. Current Port, 3. Default (8000)
export const BACKEND_PORT = import.meta.env.VITE_BACKEND_PORT || "8000";

// Base URLs for API and WebSocket
// Dynamically resolve hostname to avoid CORS issues in various network environments
const HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
export const API_BASE_URL = `http://${HOST}:${BACKEND_PORT}/api/v1`;
export const WS_BASE_URL = `ws://${HOST}:${BACKEND_PORT}/ws`;

// Agent & Audio endpoints (v4.0)
export const AGENT_STREAM_URL = `${API_BASE_URL}/agent/stream`;
export const AGENT_CHAT_URL = `${API_BASE_URL}/agent/chat`;
export const AGENT_RAG_URL = `${API_BASE_URL}/agent/rag`;
export const AGENT_HEALTH_URL = `${API_BASE_URL}/agent/health`;
export const AUDIO_WS_URL = `${WS_BASE_URL}/audio`;

// Version Info
export const APP_VERSION = "v4.0.0";
export const DEVELOPER = "VIPHACKER100";

// Feature Flags (v4.0)
export const FEATURES = {
  MOBILE_SYNC: true,
  VOICE_CONTROL: true,
  ADVANCED_SECURITY: true,
  AGENT_STREAMING: true,
  RAG_ENABLED: true,
  AUDIO_WS: true,
};
