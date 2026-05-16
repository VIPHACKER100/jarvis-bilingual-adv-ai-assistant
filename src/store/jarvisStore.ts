import { create } from 'zustand';
import { persist, devtools } from 'zustand/middleware';
import { AppMode, Language, CommandResult } from '../types';
import { SystemStatus, CommandResponse, ConfirmationRequest, ConnectionStatus } from '../types/bridge';
import { JarvisSettings } from '../types/api';
import { INITIAL_VOLUME } from '../constants';

/** Vision overlay state */
interface VisionData {
  isOpen: boolean;
  content: string;
  metadata?: Record<string, unknown>;
}

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
  
  settings: JarvisSettings | null;
  setSettings: (settings: JarvisSettings | null) => void;
  
  currentSuggestion: string | null;
  setCurrentSuggestion: (suggestion: string | null) => void;
  
  visionData: VisionData;
  setVisionData: (data: VisionData) => void;
  
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
  setShowAdvanced: (show) => void;
  showPermission: boolean;
  setShowPermission: (show) => void;
  
  activeTacticalView: 'HUD' | 'TIMELINE' | 'SYNC' | 'TRAINING';
  setActiveTacticalView: (view: 'HUD' | 'TIMELINE' | 'SYNC' | 'TRAINING') => void;
  
  isAgentThinking: boolean;
  setAgentThinking: (thinking: boolean) => void;
  
  agentThought: string | null;
  setAgentThought: (thought: string | null) => void;

  neuralLogs: import('../types/api').NeuralLogEntry[];
  setNeuralLogs: (logs: import('../types/api').NeuralLogEntry[]) => void;
  addNeuralLog: (log: import('../types/api').NeuralLogEntry) => void;
}

export const useJarvisStore = create<JarvisState>()(
  devtools(
    persist(
      (set, get) => ({
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
  
  activeTacticalView: 'HUD',
  setActiveTacticalView: (view) => set({ activeTacticalView: view }),
  
  isAgentThinking: false,
  setAgentThinking: (isAgentThinking) => set({ isAgentThinking }),
  
  agentThought: null,
  setAgentThought: (agentThought) => set({ agentThought }),

  neuralLogs: [],
  setNeuralLogs: (neuralLogs) => set({ neuralLogs }),
  addNeuralLog: (log) => set((state) => ({
    neuralLogs: [log, ...state.neuralLogs].slice(0, 100) // Keep last 100 logs
  })),
      }),
      {
        name: 'jarvis-storage',
        partialize: (state) => ({
          language: state.language,
          volume: state.volume,
          isActive: state.isActive,
        }),
      }
    ),
    { name: 'JarvisStore' }
  )
);
// Attach to window for external service access (v3.6.1)
if (typeof window !== 'undefined') {
  (window as any).jarvisStore = useJarvisStore;
}
