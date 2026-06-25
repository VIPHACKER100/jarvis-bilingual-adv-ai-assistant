import type { StateCreator } from 'zustand';
import type { SystemStatus, PerformancePoint } from '@/types/api';

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
        cpu: status.cpu?.percent ?? 0,
        memory: status.memory?.percent ?? 0,
        event_loop_lag: status.event_loop_lag ?? undefined,
      };

      return {
        systemStatus: status,
        cpuPercent: status.cpu?.percent ?? 0,
        memoryPercent: status.memory?.percent ?? 0,
        diskPercent: status.disk?.percent ?? 0,
        batteryPercent: status.battery?.percent ?? null,
        isCharging: status.battery?.is_charging ?? null,
        eventLoopLag: status.event_loop_lag ?? 0,
        performanceHistory: [...state.performanceHistory, newPoint].slice(-60),
      };
    }),
});
