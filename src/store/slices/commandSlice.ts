import { StateCreator } from "zustand";
import {
  AppMode,
  CommandResult,
  PendingConfirmationInfo,
} from "@/types/api";

export interface CommandState {
  history: CommandResult[];
  transcript: string;
  lastResponse: CommandResult | null;
  pendingConfirmation: PendingConfirmationInfo | null;
  currentSuggestion: string | null;
  mode: AppMode;

  setTranscript: (text: string) => void;
  setMode: (mode: AppMode) => void;
  addCommandResult: (result: CommandResult) => void;
  setPendingConfirmation: (req: PendingConfirmationInfo | null) => void;
  setCurrentSuggestion: (sugg: string | null) => void;
}

export const createCommandSlice: StateCreator<CommandState> = (set) => ({
  history: [],
  transcript: "",
  lastResponse: null,
  pendingConfirmation: null,
  currentSuggestion: null,
  mode: "IDLE",

  setTranscript: (text) => set({ transcript: text }),
  setMode: (mode) => set({ mode }),
  addCommandResult: (result) =>
    set((state) => ({
      history: [...state.history, result].slice(-50),
      lastResponse: result,
      mode: "SPEAKING",
    })),
  setPendingConfirmation: (req) => set({ pendingConfirmation: req }),
  setCurrentSuggestion: (sugg) => set({ currentSuggestion: sugg }),
});
