import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface ConnectionState {
  isConnected: boolean;
  isPaired: boolean;
  serverUrl: string;
  accessToken: string | null;
  deviceId: string | null;
  setConnected: (status: boolean) => void;
  setServerUrl: (url: string) => void;
  setPairingData: (token: string, deviceId: string) => void;
  resetPairing: () => void;
}

export const useConnectionStore = create<ConnectionState>()(
  persist(
    (set) => ({
      isConnected: false,
      isPaired: false,
      serverUrl: 'http://localhost:3000',
      accessToken: null,
      deviceId: null,
      setConnected: (status: boolean) => set({ isConnected: status }),
      setServerUrl: (url: string) => set({ serverUrl: url }),
      setPairingData: (token: string, deviceId: string) => set({ 
        accessToken: token, 
        deviceId, 
        isPaired: true 
      }),
      resetPairing: () => set({ 
        accessToken: null, 
        deviceId: null, 
        isPaired: false,
        isConnected: false
      }),
    }),
    {
      name: 'jarvis-connection-storage',
      storage: createJSONStorage(() => AsyncStorage),
    }
  )
);
