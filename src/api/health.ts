// ==========================================================================
// JARVIS v4.0 — Health API service
// ==========================================================================

import apiClient from './client';
import type { HealthReport, ReadinessReport, LivenessReport } from '../types';

export const healthApi = {
  /** Full health report (auth-exempt) */
  async getHealth(): Promise<HealthReport> {
    const { data } = await apiClient.get<HealthReport>('/health');
    return data;
  },

  /** Readiness probe — DB connected? (auth-exempt) */
  async getReady(): Promise<ReadinessReport> {
    const { data } = await apiClient.get<ReadinessReport>('/ready');
    return data;
  },

  /** Liveness probe (auth-exempt) */
  async getLive(): Promise<LivenessReport> {
    const { data } = await apiClient.get<LivenessReport>('/live');
    return data;
  },
};
