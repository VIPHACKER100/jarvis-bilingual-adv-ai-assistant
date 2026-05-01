/**
 * JARVIS Frontend Configuration
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

// Version Info
export const APP_VERSION = "v3.7.0";
export const DEVELOPER = "VIPHACKER100";

// Feature Flags
export const FEATURES = {
  MOBILE_SYNC: true,
  VOICE_CONTROL: true,
  ADVANCED_SECURITY: true
};
