import { create } from "zustand";
import { persist } from "zustand/middleware";
import { createSystemSlice, SystemState } from "./slices/systemSlice";
import { createCommandSlice, CommandState } from "./slices/commandSlice";
import {
  createConnectionSlice,
  ConnectionState,
} from "./slices/connectionSlice";

export type StoreState = SystemState & CommandState & ConnectionState;

export const useStore = create<StoreState>()(
  persist(
    (...a) => ({
      ...createSystemSlice(...a),
      ...createCommandSlice(...a),
      ...createConnectionSlice(...a),
    }),
    {
      name: "jarvis-storage",
      partialize: (state) => ({
        history: state.history,
        mode: state.mode,
      }),
    },
  ),
);
