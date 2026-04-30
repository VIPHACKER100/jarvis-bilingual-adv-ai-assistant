import { create } from 'zustand';
import { AppMode, Language, CommandResult } from '../types';
import { SystemStatus, CommandResponse, ConfirmationRequest, ConnectionStatus } from '../types/bridge';
import { INITIAL_VOLUME } from '../constants';

interface JarvisState {
  mode: AppMode;
  setMode: (mode: AppMode) => void;
  
  language: Language;
  setLanguage: (language: Language) => void;
  toggleLanguage: () => void;
  
  volume: number;
  setVolume: (volume: number) => void;
  
  transcript: string;
  setTranscript: (transcript: string) => void;
  
  history: CommandResult[];
  addToHistory: (entry: CommandResult) => void;
  
  settings: any;
  setSettings: (settings: any) => void;
  
  currentSuggestion: string | null;
  setCurrentSuggestion: (suggestion: string | null) => void;
  
  visionData: { isOpen: boolean; content: string; metadata?: any };
  setVisionData: (data: { isOpen: boolean; content: string; metadata?: any }) => void;
  
  isActive: boolean;
  setIsActive: (isActive: boolean) => void;

  // Bridge State
  isConnected: boolean;
  setConnected: (connected: boolean) => void;
  connectionStatus: ConnectionStatus;
  setConnectionStatus: (status: ConnectionStatus) => void;
  systemStatus: SystemStatus | null;
  setSystemStatus: (status: SystemStatus | null) => void;
  lastResponse: CommandResponse | null;
  setLastResponse: (response: CommandResponse | null) => void;
  pendingConfirmation: ConfirmationRequest | null;
  setPendingConfirmation: (request: ConfirmationRequest | null) => void;
  bridgeError: string | null;
  setBridgeError: (error: string | null) => void;

  // UI State
  showSettings: boolean;
  setShowSettings: (show: boolean) => void;
  showMemory: boolean;
  setShowMemory: (show: boolean) => void;
  showAutomation: boolean;
  setShowAutomation: (show: boolean) => void;
  showAdvanced: boolean;
  setShowAdvanced: (show: boolean) => void;
  showPermission: boolean;
  setShowPermission: (show: boolean) => void;
}

export const useJarvisStore = create<JarvisState>((set, get) => ({
  mode: AppMode.IDLE,
  setMode: (mode) => set({ mode }),
  
  language: Language.HINDI,
  setLanguage: (language) => set({ language }),
  toggleLanguage: () => set((state) => {
    if (state.language === Language.ENGLISH) return { language: Language.HINDI };
    if (state.language === Language.HINDI) return { language: Language.HINGLISH };
    return { language: Language.ENGLISH };
  }),
  
  volume: INITIAL_VOLUME,
  setVolume: (volume) => set({ volume }),
  
  transcript: '',
  setTranscript: (transcript) => set({ transcript }),
  
  history: [],
  addToHistory: (entry) => set((state) => ({ 
    history: [...state.history, entry] 
  })),
  
  settings: null,
  setSettings: (settings) => set({ settings }),
  
  currentSuggestion: null,
  setCurrentSuggestion: (currentSuggestion) => set({ currentSuggestion }),
  
  visionData: { isOpen: false, content: '' },
  setVisionData: (visionData) => set({ visionData }),
  
  isActive: false,
  setIsActive: (isActive) => set({ isActive }),

  // Bridge State
  isConnected: false,
  setConnected: (isConnected) => set({ isConnected }),
  connectionStatus: 'disconnected',
  setConnectionStatus: (connectionStatus) => set({ connectionStatus }),
  systemStatus: null,
  setSystemStatus: (systemStatus) => set({ systemStatus }),
  lastResponse: null,
  setLastResponse: (lastResponse) => set({ lastResponse }),
  pendingConfirmation: null,
  setPendingConfirmation: (pendingConfirmation) => set({ pendingConfirmation }),
  bridgeError: null,
  setBridgeError: (bridgeError) => set({ bridgeError }),

  // UI State
  showSettings: false,
  setShowSettings: (showSettings) => set({ showSettings }),
  showMemory: false,
  setShowMemory: (showMemory) => set({ showMemory }),
  showAutomation: false,
  setShowAutomation: (showAutomation) => set({ showAutomation }),
  showAdvanced: false,
  setShowAdvanced: (showAdvanced) => set({ showAdvanced }),
  showPermission: false,
  setShowPermission: (showPermission) => set({ showPermission }),
}));
