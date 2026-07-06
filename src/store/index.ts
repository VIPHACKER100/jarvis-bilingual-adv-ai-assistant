import { create } from 'zustand';

export type Page = 'hud' | 'settings' | 'about';

export interface AppState {
  history: { command: string; response: string }[];
  mode: 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';
  isConnected: boolean;
  currentPage: Page;
  addHistory: (entry: { command: string; response: string }) => void;
  setMode: (mode: AppState['mode']) => void;
  setConnected: (connected: boolean) => void;
  setPage: (page: Page) => void;
}

const saved = localStorage.getItem('jarvis');
const initial: { history: AppState['history']; mode: AppState['mode'] } = saved ? JSON.parse(saved) : { history: [], mode: 'IDLE' };

export const useStore = create<AppState>((set) => ({
  history: initial.history,
  mode: initial.mode,
  isConnected: false,
  currentPage: 'hud',
  addHistory: (entry) => set((s) => {
    const history = [...s.history, entry].slice(-50);
    localStorage.setItem('jarvis', JSON.stringify({ history, mode: s.mode }));
    return { history, mode: 'SPEAKING' };
  }),
  setMode: (mode) => set((s) => {
    localStorage.setItem('jarvis', JSON.stringify({ history: s.history, mode }));
    return { mode };
  }),
  setConnected: (isConnected) => set({ isConnected }),
  setPage: (currentPage) => set({ currentPage }),
}));
