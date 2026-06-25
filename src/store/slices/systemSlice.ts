import { StateCreator } from "zustand";
import { SystemStatus, PerformancePoint } from "../../types/api";

export interface SystemState {
  systemStatus: SystemStatus | null;
  performanceHistory: PerformancePoint[];
  cpuPercent: number;
  memoryPercent: number;
  diskPercent: number;
  batteryPercent: number | null;
  isCharging: boolean | null;
  eventLoopLag: number;
  setSystemStatus: (status: SystemStatus) => void;
}

export const createSystemSlice: StateCreator<SystemState> = (set) => ({
  systemStatus: null,
  performanceHistory: [],
  cpuPercent: 0,
  memoryPercent: 0,
  diskPercent: 0,
  batteryPercent: null,
  isCharging: null,
  eventLoopLag: 0,
  setSystemStatus: (status) =>
    set((state) => {
      const newPoint: PerformancePoint = {
        timestamp: new Date().toISOString(),
        cpu: status.cpu_percent,
        memory: status.memory_percent,
      };

      return {
        systemStatus: status,
        cpuPercent: status.cpu_percent,
        memoryPercent: status.memory_percent,
        diskPercent: status.disk_percent,
        batteryPercent: status.battery_percent,
        isCharging: status.is_charging,
        eventLoopLag: status.event_loop_lag,
        performanceHistory: [...state.performanceHistory, newPoint].slice(-60),
      };
    }),
});
