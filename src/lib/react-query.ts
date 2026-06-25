/**
 * JARVIS Neural Interface - React Query Configuration
 * 
 * Configures React Query for server state management with optimal
 * settings for real-time dashboard data updates.
 */

import { QueryClient } from '@tanstack/react-query';

// ═══════════════════════════════════════════════════════════════════════════
// Query Client Configuration
// ═══════════════════════════════════════════════════════════════════════════

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Real-time data updates for dashboard metrics
      staleTime: 1000, // 1 second for real-time feeling
      refetchInterval: 5000, // Background refresh every 5 seconds
      refetchOnWindowFocus: true,
      refetchOnReconnect: true,
      retry: (failureCount, error) => {
        // Only retry network errors, not 4xx client errors
        if (error instanceof Error && error.message.includes('4')) {
          return false;
        }
        return failureCount < 3;
      },
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 30000),
    },
    mutations: {
      retry: 1,
      onError: (error) => {
        console.error('Mutation error:', error);
      },
    },
  },
});

// ═══════════════════════════════════════════════════════════════════════════
// Query Key Factory
// ═══════════════════════════════════════════════════════════════════════════

export const queryKeys = {
  // Real-time system metrics
  systemMetrics: () => ['systemMetrics'] as const,
  systemMetricsHistory: (timeWindow: number) => ['systemMetrics', 'history', timeWindow] as const,
  
  // AI Core status
  aiCoreStatus: () => ['aiCore', 'status'] as const,
  aiCoreMetrics: () => ['aiCore', 'metrics'] as const,
  
  // System alerts
  systemAlerts: () => ['systemAlerts'] as const,
  systemAlertsActive: () => ['systemAlerts', 'active'] as const,
  systemAlertsHistory: (limit: number) => ['systemAlerts', 'history', limit] as const,
  
  // Session logs
  sessionLogs: () => ['sessionLogs'] as const,
  sessionLogsPaginated: (page: number, limit: number) => ['sessionLogs', 'paginated', page, limit] as const,
  
  // Module manifest
  systemModules: () => ['systemModules'] as const,
  systemModule: (moduleId: string) => ['systemModules', moduleId] as const,
  
  // Charts and telemetry
  telemetryData: (metric: string, timeWindow: number) => ['telemetry', metric, timeWindow] as const,
  
  // System information
  systemInfo: () => ['systemInfo'] as const,
  connectionStatus: () => ['connectionStatus'] as const,
} as const;

// ═══════════════════════════════════════════════════════════════════════════
// Query Invalidation Helpers
// ═══════════════════════════════════════════════════════════════════════════

export const invalidateQueries = {
  systemMetrics: () => queryClient.invalidateQueries({ queryKey: queryKeys.systemMetrics() }),
  aiCore: () => queryClient.invalidateQueries({ queryKey: queryKeys.aiCoreStatus() }),
  alerts: () => queryClient.invalidateQueries({ queryKey: queryKeys.systemAlerts() }),
  logs: () => queryClient.invalidateQueries({ queryKey: queryKeys.sessionLogs() }),
  modules: () => queryClient.invalidateQueries({ queryKey: queryKeys.systemModules() }),
  all: () => queryClient.invalidateQueries(),
};

// ═══════════════════════════════════════════════════════════════════════════
// Connection Status Management
// ═══════════════════════════════════════════════════════════════════════════

export const handleConnectionChange = (isOnline: boolean) => {
  if (isOnline) {
    // Resume all queries when connection is restored
    queryClient.resumePausedMutations();
    queryClient.invalidateQueries();
  } else {
    // Pause queries when offline to prevent errors
    queryClient.getQueryCache().findAll().forEach(query => {
      query.cancel();
    });
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Real-time Update Helpers
// ═══════════════════════════════════════════════════════════════════════════

/**
 * Update cached query data with new real-time data
 */
export const updateCacheData = <T>(queryKey: readonly unknown[], updater: (oldData: T | undefined) => T) => {
  queryClient.setQueryData(queryKey, updater);
};

/**
 * Optimistically update cache before mutation
 */
export const optimisticUpdate = <T>(queryKey: readonly unknown[], newData: T) => {
  const previousData = queryClient.getQueryData<T>(queryKey);
  queryClient.setQueryData(queryKey, newData);
  return previousData;
};

/**
 * Revert optimistic update on error
 */
export const revertOptimisticUpdate = <T>(queryKey: readonly unknown[], previousData: T | undefined) => {
  if (previousData !== undefined) {
    queryClient.setQueryData(queryKey, previousData);
  }
};

// ═══════════════════════════════════════════════════════════════════════════
// Export configured client
// ═══════════════════════════════════════════════════════════════════════════

export { QueryClient } from '@tanstack/react-query';
export default queryClient;