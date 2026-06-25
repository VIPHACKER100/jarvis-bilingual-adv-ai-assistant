import { StateCreator } from "zustand";
import { ConnectionStatus } from "@/types/api";

export interface ConnectionState {
  isConnected: boolean;
  connectionStatus: ConnectionStatus;
  reconnectAttempts: number;

  setConnectionStatus: (status: ConnectionStatus) => void;
  incrementReconnectAttempts: () => void;
  resetReconnectAttempts: () => void;
}

export const createConnectionSlice: StateCreator<ConnectionState> = (set) => ({
  isConnected: false,
  connectionStatus: "disconnected",
  reconnectAttempts: 0,

  setConnectionStatus: (status) =>
    set({
      connectionStatus: status,
      isConnected: status === "connected",
    }),
  incrementReconnectAttempts: () =>
    set((state) => ({
      reconnectAttempts: state.reconnectAttempts + 1,
    })),
  resetReconnectAttempts: () => set({ reconnectAttempts: 0 }),
});
