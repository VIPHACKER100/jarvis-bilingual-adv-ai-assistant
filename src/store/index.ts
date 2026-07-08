// ==========================================================================
// JARVIS v4.0 — Global State Management (Zustand)
// ==========================================================================

import { create } from 'zustand';
import type {
  SystemStatusResponse,
  ConversationEntry,
  Notification,
  PendingConfirmation,
  SettingsData,
} from '../types';

// ── Auth Slice ──
interface AuthSlice {
  apiKey: string | null;
  isAuthenticated: boolean;
  isCheckingAuth: boolean;
  setApiKey: (key: string | null) => void;
  setAuthenticated: (val: boolean) => void;
  setCheckingAuth: (val: boolean) => void;
}

// ── WebSocket Slice ──
interface WebSocketSlice {
  isConnected: boolean;
  clientId: string;
  reconnectAttempts: number;
  setIsConnected: (val: boolean) => void;
  setClientId: (id: string) => void;
  setReconnectAttempts: (n: number) => void;
}

// ── System Status Slice ──
interface SystemStatusSlice {
  systemStatus: SystemStatusResponse | null;
  setSystemStatus: (status: SystemStatusResponse | null) => void;
}

// ── Conversation Slice ──
interface ConversationSlice {
  entries: ConversationEntry[];
  isProcessing: boolean;
  addEntry: (entry: ConversationEntry) => void;
  setProcessing: (val: boolean) => void;
  clearEntries: () => void;
  updateLastEntry: (text: string) => void;
}

// ── Notifications Slice ──
interface NotificationsSlice {
  notifications: Notification[];
  addNotification: (n: Notification) => void;
  dismissNotification: (id: string) => void;
  clearNotifications: () => void;
}

// ── Settings Slice ──
interface SettingsSlice {
  data: SettingsData | null;
  isLoading: boolean;
  setSettings: (data: SettingsData | null) => void;
  setLoading: (val: boolean) => void;
}

// ── Pending Confirmations Slice ──
interface ConfirmationsSlice {
  pendingConfirmations: PendingConfirmation[];
  addConfirmation: (c: PendingConfirmation) => void;
  removeConfirmation: (id: string) => void;
  clearConfirmations: () => void;
}

// ── Combined Store ──
export type AppState = AuthSlice &
  WebSocketSlice &
  SystemStatusSlice &
  ConversationSlice &
  NotificationsSlice &
  SettingsSlice &
  ConfirmationsSlice;

export const useStore = create<AppState>((set) => ({
  // ── Auth ──
  apiKey: null,
  isAuthenticated: false,
  isCheckingAuth: true,
  setApiKey: (apiKey) => set({ apiKey }),
  setAuthenticated: (isAuthenticated) => set({ isAuthenticated }),
  setCheckingAuth: (isCheckingAuth) => set({ isCheckingAuth }),

  // ── WebSocket ──
  isConnected: false,
  clientId: crypto.randomUUID(),
  reconnectAttempts: 0,
  setIsConnected: (isConnected) => set({ isConnected, reconnectAttempts: 0 }),
  setClientId: (clientId) => set({ clientId }),
  setReconnectAttempts: (reconnectAttempts) => set({ reconnectAttempts }),

  // ── System Status ──
  systemStatus: null,
  setSystemStatus: (systemStatus) => set({ systemStatus }),

  // ── Conversation ──
  entries: [],
  isProcessing: false,
  addEntry: (entry) =>
    set((state) => ({ entries: [...state.entries, entry] })),
  setProcessing: (isProcessing) => set({ isProcessing }),
  clearEntries: () => set({ entries: [] }),
  updateLastEntry: (text) =>
    set((state) => {
      const entries = [...state.entries];
      if (entries.length > 0) {
        const last = entries[entries.length - 1];
        if (last) entries[entries.length - 1] = { ...last, text };
      }
      return { entries };
    }),

  // ── Notifications ──
  notifications: [],
  addNotification: (n) =>
    set((state) => ({
      notifications: [...state.notifications, n].slice(-5),
    })),
  dismissNotification: (id) =>
    set((state) => ({
      notifications: state.notifications.filter((n) => n.id !== id),
    })),
  clearNotifications: () => set({ notifications: [] }),

  // ── Settings ──
  data: null,
  isLoading: false,
  setSettings: (data) => set({ data }),
  setLoading: (isLoading) => set({ isLoading }),

  // ── Pending Confirmations ──
  pendingConfirmations: [],
  addConfirmation: (c) =>
    set((state) => ({
      pendingConfirmations: [...state.pendingConfirmations, c],
    })),
  removeConfirmation: (id) =>
    set((state) => ({
      pendingConfirmations: state.pendingConfirmations.filter(
        (c) => c.id !== id,
      ),
    })),
  clearConfirmations: () => set({ pendingConfirmations: [] }),
}));
