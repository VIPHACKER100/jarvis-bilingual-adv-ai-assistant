/**
 * useSystemQuery — TanStack Query hooks for ALL data-fetching endpoints.
 *
 * Provides:
 * - Query key factory for consistent cache management
 * - Typed hooks for each endpoint with proper stale times and refetch intervals
 * - Loading / error / success state handling
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/services/apiClient';
import { STALE_TIMES } from '@/config';
import type { Language } from '@/types/api';

// ============================================================================
// Query Key Factory
// ============================================================================

export const queryKeys = {
  systemMetrics: () => ['system', 'metrics'] as const,
  systemMetricsHistory: (limit: number) => ['system', 'metrics', 'history', limit] as const,
  battery: () => ['system', 'battery'] as const,
  time: (language: string) => ['system', 'time', language] as const,
  date: (language: string) => ['system', 'date', language] as const,
  uptime: (language: string) => ['system', 'uptime', language] as const,
  networkInfo: () => ['system', 'network'] as const,
  weather: (city: string) => ['system', 'weather', city] as const,
  personalities: () => ['system', 'personalities'] as const,
  commandInsights: (days: number) => ['system', 'commandInsights', days] as const,
  conversations: (limit: number) => ['memory', 'conversations', limit] as const,
  memoryStats: (days: number) => ['memory', 'stats', days] as const,
  memoryFacts: (category?: string) => ['memory', 'facts', category] as const,
  memoryNodes: () => ['memory', 'nodes'] as const,
  memoryNodeContent: (name: string) => ['memory', 'node', name] as const,
  automationStatus: () => ['automation', 'status'] as const,
  tasks: () => ['automation', 'tasks'] as const,
  macros: () => ['automation', 'macros'] as const,
  settings: () => ['settings'] as const,
  apiKeyStatus: () => ['settings', 'keys'] as const,
  whatsappStatus: () => ['whatsapp', 'status'] as const,
  whatsappContacts: () => ['whatsapp', 'contacts'] as const,
  windows: () => ['windows'] as const,
  apps: () => ['apps'] as const,
  files: (folder: string, pattern?: string) => ['files', folder, pattern] as const,
  fileInfo: (path: string) => ['files', 'info', path] as const,
  processes: () => ['security', 'processes'] as const,
  networkConnections: () => ['security', 'connections'] as const,
  pairedDevices: () => ['sync', 'devices'] as const,
  syncStatus: () => ['sync', 'status'] as const,
  suggestion: (language: string) => ['context', 'suggestion', language] as const,
  quickActions: () => ['context', 'quick-actions'] as const,
  health: () => ['health'] as const,
  agentHealth: () => ['agent', 'health'] as const,
  screenshot: () => ['desktop', 'screenshot'] as const,
  clipboard: () => ['desktop', 'clipboard'] as const,
  cursor: () => ['input', 'cursor'] as const,
};

// ============================================================================
// Health Hooks
// ============================================================================

export function useHealthCheck() {
  return useQuery({
    queryKey: queryKeys.health(),
    queryFn: () => apiClient.healthCheck(),
    staleTime: STALE_TIMES.health,
    refetchInterval: 30000,
  });
}

// ============================================================================
// System Hooks
// ============================================================================

export function useSystemStatus() {
  return useQuery({
    queryKey: queryKeys.systemMetrics(),
    queryFn: () => apiClient.getSystemStatus(),
    staleTime: STALE_TIMES.systemStatus,
    refetchInterval: 5000,
  });
}

export function useBattery() {
  return useQuery({
    queryKey: queryKeys.battery(),
    queryFn: () => apiClient.getBattery(),
    staleTime: STALE_TIMES.systemStatus,
    refetchInterval: 10000,
  });
}

export function useTime(language: string = 'en') {
  return useQuery({
    queryKey: queryKeys.time(language),
    queryFn: () => apiClient.getTime(language as Language),
    staleTime: 60000,
  });
}

export function useDate(language: string = 'en') {
  return useQuery({
    queryKey: queryKeys.date(language),
    queryFn: () => apiClient.getDate(language as Language),
    staleTime: 60000,
  });
}

export function useUptime(language: string = 'en') {
  return useQuery({
    queryKey: queryKeys.uptime(language),
    queryFn: () => apiClient.getUptime(language as Language),
    staleTime: 10000,
    refetchInterval: 15000,
  });
}

export function useNetworkInfo() {
  return useQuery({
    queryKey: queryKeys.networkInfo(),
    queryFn: () => apiClient.getNetworkInfo(),
    staleTime: 30000,
  });
}

export function useWeather(city: string) {
  return useQuery({
    queryKey: queryKeys.weather(city),
    queryFn: () => apiClient.getWeather(city),
    staleTime: 300000, // 5 min
    enabled: !!city,
  });
}

export function usePerformanceHistory(limit: number = 60) {
  return useQuery({
    queryKey: queryKeys.systemMetricsHistory(limit),
    queryFn: () => apiClient.getPerformanceHistory(limit),
    staleTime: 30000,
    refetchInterval: 60000,
  });
}

export function usePersonalities() {
  return useQuery({
    queryKey: queryKeys.personalities(),
    queryFn: () => apiClient.getPersonalities(),
    staleTime: 60000,
  });
}

export function useCommandInsights(days: number = 30) {
  return useQuery({
    queryKey: queryKeys.commandInsights(days),
    queryFn: () => apiClient.getCommandInsights(days),
    staleTime: 300000, // 5 min
  });
}

// ============================================================================
// Security Hooks
// ============================================================================

export function useRunningProcesses() {
  return useQuery({
    queryKey: queryKeys.processes(),
    queryFn: () => apiClient.getRunningProcesses(),
    staleTime: STALE_TIMES.processes,
    refetchInterval: 5000,
  });
}

export function useNetworkScan() {
  return useQuery({
    queryKey: queryKeys.networkConnections(),
    queryFn: () => apiClient.getNetworkScan(),
    staleTime: STALE_TIMES.processes,
    refetchInterval: 5000,
  });
}

// ============================================================================
// Windows & Apps Hooks
// ============================================================================

export function useWindows() {
  return useQuery({
    queryKey: queryKeys.windows(),
    queryFn: () => apiClient.getWindows(),
    staleTime: STALE_TIMES.windows,
    refetchInterval: 10000,
  });
}

export function useApps() {
  return useQuery({
    queryKey: queryKeys.apps(),
    queryFn: () => apiClient.getApps(),
    staleTime: STALE_TIMES.apps,
    refetchInterval: 10000,
  });
}

// ============================================================================
// Files Hooks
// ============================================================================

export function useFileList(folder: string, pattern?: string) {
  return useQuery({
    queryKey: queryKeys.files(folder, pattern),
    queryFn: () => apiClient.listFiles(folder, pattern),
    staleTime: 10000,
    enabled: !!folder,
  });
}

export function useFileInfo(path: string) {
  return useQuery({
    queryKey: queryKeys.fileInfo(path),
    queryFn: () => apiClient.getFileInfo(path),
    staleTime: 5000,
    enabled: !!path,
  });
}

// ============================================================================
// Desktop Hooks
// ============================================================================

export function useScreenshot(save?: boolean) {
  return useQuery({
    queryKey: queryKeys.screenshot(),
    queryFn: () => apiClient.takeScreenshot(save),
    staleTime: 0,
    enabled: false, // Only fetch on demand
  });
}

export function useClipboard() {
  return useQuery({
    queryKey: queryKeys.clipboard(),
    queryFn: () => apiClient.readClipboard(),
    staleTime: 0,
  });
}

// ============================================================================
// Input Hooks
// ============================================================================

export function useCursorPosition() {
  return useQuery({
    queryKey: queryKeys.cursor(),
    queryFn: () => apiClient.getCursorPosition(),
    staleTime: 2000,
    refetchInterval: 2000,
  });
}

// ============================================================================
// Memory Hooks
// ============================================================================

export function useConversations(limit: number = 50) {
  return useQuery({
    queryKey: queryKeys.conversations(limit),
    queryFn: () => apiClient.getConversations(limit),
    staleTime: STALE_TIMES.conversations,
    refetchInterval: 30000,
  });
}

export function useMemoryStats(days: number = 7) {
  return useQuery({
    queryKey: queryKeys.memoryStats(days),
    queryFn: () => apiClient.getMemoryStats(days),
    staleTime: 60000,
  });
}

export function useMemoryFacts(category?: string) {
  return useQuery({
    queryKey: queryKeys.memoryFacts(category),
    queryFn: () => apiClient.getMemoryFacts(category),
    staleTime: 30000,
  });
}

export function useMemoryNodes() {
  return useQuery({
    queryKey: queryKeys.memoryNodes(),
    queryFn: () => apiClient.getMemoryNodes(),
    staleTime: 30000,
  });
}

export function useMemoryNodeContent(name: string) {
  return useQuery({
    queryKey: queryKeys.memoryNodeContent(name),
    queryFn: () => apiClient.getMemoryNodeContent(name),
    staleTime: 10000,
    enabled: !!name,
  });
}

// ============================================================================
// Automation Hooks
// ============================================================================

export function useAutomationStatus() {
  return useQuery({
    queryKey: queryKeys.automationStatus(),
    queryFn: () => apiClient.getAutomationStatus(),
    staleTime: 10000,
    refetchInterval: 10000,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: queryKeys.tasks(),
    queryFn: () => apiClient.getTasks(),
    staleTime: 15000,
  });
}

export function useMacros() {
  return useQuery({
    queryKey: queryKeys.macros(),
    queryFn: () => apiClient.getMacros(),
    staleTime: 15000,
  });
}

// ============================================================================
// Settings Hooks
// ============================================================================

export function useSettings() {
  return useQuery({
    queryKey: queryKeys.settings(),
    queryFn: () => apiClient.getSettings(),
    staleTime: STALE_TIMES.settings,
  });
}

export function useApiKeyStatus() {
  return useQuery({
    queryKey: queryKeys.apiKeyStatus(),
    queryFn: () => apiClient.getApiKeyStatus(),
    staleTime: 60000,
  });
}

// ============================================================================
// WhatsApp Hooks
// ============================================================================

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: queryKeys.whatsappStatus(),
    queryFn: () => apiClient.getWhatsAppStatus(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function useWhatsAppContacts() {
  return useQuery({
    queryKey: queryKeys.whatsappContacts(),
    queryFn: () => apiClient.getWhatsAppContacts(),
    staleTime: 60000,
  });
}

// ============================================================================
// Sync Hooks
// ============================================================================

export function useSyncStatus() {
  return useQuery({
    queryKey: queryKeys.syncStatus(),
    queryFn: () => apiClient.getSyncStatus(),
    staleTime: 15000,
    refetchInterval: 30000,
  });
}

export function usePairedDevices() {
  return useQuery({
    queryKey: queryKeys.pairedDevices(),
    queryFn: () => apiClient.getPairedDevices(),
    staleTime: 15000,
  });
}

// ============================================================================
// Context Hooks
// ============================================================================

export function useSuggestion(language: string = 'en') {
  return useQuery({
    queryKey: queryKeys.suggestion(language),
    queryFn: () => apiClient.getSuggestion(language),
    staleTime: STALE_TIMES.suggestion,
    refetchInterval: 30000,
  });
}

export function useQuickActions() {
  return useQuery({
    queryKey: queryKeys.quickActions(),
    queryFn: () => apiClient.getQuickActions(),
    staleTime: 60000,
  });
}

// ============================================================================
// Agent Hooks
// ============================================================================

export function useAgentHealth() {
  return useQuery({
    queryKey: queryKeys.agentHealth(),
    queryFn: () => apiClient.agentHealth(),
    staleTime: 10000,
    refetchInterval: 30000,
  });
}

// ============================================================================
// Mutations
// ============================================================================

export function useExecuteCommand() {
  return useMutation({
    mutationFn: ({ command, language }: { command: string; language?: string }) =>
      apiClient.executeCommand(command, language),
  });
}

export function useConfirmCommand() {
  return useMutation({
    mutationFn: ({ confirmationId, approved }: { confirmationId: string; approved: boolean }) =>
      apiClient.confirmCommand(confirmationId, approved),
  });
}

export function useOpenApp() {
  return useMutation({
    mutationFn: (appName: string) => apiClient.openApp(appName),
  });
}

export function useCloseApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, confirmed }: { appName: string; confirmed?: boolean }) =>
      apiClient.closeApp(appName, confirmed),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.apps() });
    },
  });
}

export function useCreateTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (task: Partial<import('@/types/api').AutomationTask>) => apiClient.createTask(task),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.toggleTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.deleteTask(taskId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.tasks() });
    },
  });
}

export function useCreateMacro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (macro: Partial<import('@/types/api').AutomationMacro>) => apiClient.createMacro(macro),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.macros() });
    },
  });
}

export function useRunMacro() {
  return useMutation({
    mutationFn: (macroId: string) => apiClient.runMacro(macroId),
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<import('@/types/api').JarvisSettings>) =>
      apiClient.updateSettings(settings),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: queryKeys.settings() });
    },
  });
}

export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: ({ contact, message, language }: { contact: string; message: string; language?: string }) =>
      apiClient.sendWhatsAppMessage(contact, message, language),
  });
}

export function useBroadcastNotification() {
  return useMutation({
    mutationFn: ({ title, message, type, duration }: { title: string; message: string; type?: string; duration?: number }) =>
      apiClient.broadcastNotification(title, message, type, duration),
  });
}
