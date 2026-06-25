/**
 * JARVIS System Query Hooks — TanStack Query wrappers for all backend API calls
 * Provides loading/error/data states for every backend integration point.
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '../services/apiClient';
import { queryKeys } from '../lib/react-query';
import type {
  SystemStatusFullResponse,
  BatteryResponse,
  PerformanceHistoryResponse,
  WindowListResponse,
  AppListResponse,
  FileListResponse,
  FileSearchResponse,
  PersonalityInfo,
  PersonalitiesListResponse,
  WeatherResponse,
  WebSearchResponse,
  CommandInsightsResponse,
  ProcessListResponse,
  NetworkScanResponse,
  JarvisSettings,
  SettingsResponse,
  ConversationListResponse,
  MemoryStatsResponse,
  FactListResponse,
  MemoryNodeListResponse,
  AutomationStatusResponse,
  TaskListResponse,
  MacroListResponse,
  WhatsAppStatusResponse,
  WhatsAppContactsResponse,
  QuickActionListResponse,
  SuggestionResponse,
  PairedDevicesResponse,
  PairDevicePayload,
  PairDeviceResponse,
  ProactiveSuggestionResponse,
  ApiKeyStatusResponse,
  TestKeyResponse,
  HealthCheckResponse,
} from '../types/api';

// ─── Helper ───────────────────────────────────────────────────────────────────

function useApiKey() {
  return import.meta.env.VITE_JARVIS_API_KEY || '';
}

// ─── System Status ────────────────────────────────────────────────────────────

export function useSystemStatus(language: string = 'en') {
  return useQuery({
    queryKey: [...queryKeys.systemMetrics(), language],
    queryFn: () => apiClient.getSystemStatus(),
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useSystemStatusFull(language: string = 'en') {
  return useQuery({
    queryKey: ['systemStatusFull', language],
    queryFn: () => apiClient.getSystemStatus() as unknown as SystemStatusFullResponse,
    refetchInterval: 5000,
    staleTime: 2000,
  });
}

export function useBattery(language: string = 'en') {
  return useQuery({
    queryKey: ['battery', language],
    queryFn: () => apiClient.getBattery(language),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function usePerformanceHistory(limit: number = 60) {
  return useQuery({
    queryKey: [...queryKeys.systemMetricsHistory(limit)],
    queryFn: () => apiClient.getPerformanceHistory(limit),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function usePersonalities() {
  return useQuery({
    queryKey: ['personalities'],
    queryFn: () => apiClient.getPersonalities(),
    staleTime: 60000,
  });
}

export function useCommandInsights(days: number = 30) {
  return useQuery({
    queryKey: ['commandInsights', days],
    queryFn: () => apiClient.getCommandInsights(days),
    staleTime: 30000,
  });
}

// ─── Mutations ────────────────────────────────────────────────────────────────

export function useSetPersonality() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (personalityId: string) => apiClient.setPersonality(personalityId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['personalities'] });
      queryClient.invalidateQueries({ queryKey: queryKeys.systemMetrics() });
    },
  });
}

export function useShutdownComputer() {
  return useMutation({
    mutationFn: ({ confirmed, language }: { confirmed: boolean; language?: string }) =>
      apiClient.shutdownComputer(confirmed, language),
  });
}

export function useRestartComputer() {
  return useMutation({
    mutationFn: ({ confirmed, language }: { confirmed: boolean; language?: string }) =>
      apiClient.restartComputer(confirmed, language),
  });
}

export function useSleepComputer() {
  return useMutation({
    mutationFn: ({ confirmed, language }: { confirmed: boolean; language?: string }) =>
      apiClient.sleepComputer(confirmed, language),
  });
}

// ─── Windows & Apps ───────────────────────────────────────────────────────────

export function useWindows() {
  return useQuery({
    queryKey: ['windows'],
    queryFn: () => apiClient.getWindows(),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useApps() {
  return useQuery({
    queryKey: ['apps'],
    queryFn: () => apiClient.getApps(),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useOpenApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (appName: string) => apiClient.openApp(appName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps'] }),
  });
}

export function useCloseApp() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ appName, confirmed }: { appName: string; confirmed?: boolean }) =>
      apiClient.closeApp(appName, confirmed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['apps'] }),
  });
}

export function useWindowAction() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ action, title }: { action: 'minimize' | 'maximize' | 'restore' | 'activate'; title: string }) => {
      switch (action) {
        case 'minimize': return apiClient.minimizeWindow(title);
        case 'maximize': return apiClient.maximizeWindow(title);
        case 'restore': return apiClient.restoreWindow(title);
        case 'activate': return apiClient.activateWindow(title);
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['windows'] }),
  });
}

// ─── File Operations ──────────────────────────────────────────────────────────

export function useFileList(folder: string, pattern?: string) {
  return useQuery({
    queryKey: ['files', folder, pattern],
    queryFn: () => apiClient.listFiles(folder, pattern),
    staleTime: 5000,
  });
}

export function useFileSearch() {
  return useMutation({
    mutationFn: ({ search, folder }: { search: string; folder?: string }) =>
      apiClient.searchFiles(search, folder),
  });
}

export function useCreateFolder() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ name, parent }: { name: string; parent: string }) =>
      apiClient.createFolder(name, parent),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useDeleteFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ path, confirmed }: { path: string; confirmed?: boolean }) =>
      apiClient.deleteFile(path, confirmed),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useCopyFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ source, destination }: { source: string; destination: string }) =>
      apiClient.copyFile(source, destination),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useMoveFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ source, destination }: { source: string; destination: string }) =>
      apiClient.moveFile(source, destination),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

export function useRenameFile() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ oldPath, newName }: { oldPath: string; newName: string }) =>
      apiClient.renameFile(oldPath, newName),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['files'] }),
  });
}

// ─── Desktop & Media ──────────────────────────────────────────────────────────

export function useScreenshot() {
  return useMutation({
    mutationFn: ({ save, language }: { save?: boolean; language?: string } = {}) =>
      apiClient.takeScreenshot(save, language),
  });
}

export function useClipboard() {
  return useQuery({
    queryKey: ['clipboard'],
    queryFn: () => apiClient.readClipboard(),
    staleTime: 1000,
  });
}

export function useSetClipboard() {
  return useMutation({
    mutationFn: (text: string) => apiClient.setClipboard(text),
  });
}

export function useMediaControl() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (action: 'play' | 'next' | 'previous' | 'stop') => {
      switch (action) {
        case 'play': return apiClient.mediaPlayPause();
        case 'next': return apiClient.mediaNext();
        case 'previous': return apiClient.mediaPrevious();
        case 'stop': return apiClient.mediaStop();
      }
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['media'] }),
  });
}

// ─── Input Simulation ─────────────────────────────────────────────────────────

export function useCursorPosition() {
  return useQuery({
    queryKey: ['cursorPosition'],
    queryFn: () => apiClient.getCursorPosition(),
    refetchInterval: 2000,
    staleTime: 1000,
  });
}

export function useMoveCursor() {
  return useMutation({
    mutationFn: ({ x, y }: { x: number; y: number }) => apiClient.moveCursor(x, y),
  });
}

export function useMouseClick() {
  return useMutation({
    mutationFn: (button: 'left' | 'right' | 'middle' = 'left') => apiClient.mouseClick(button),
  });
}

export function useTypeText() {
  return useMutation({
    mutationFn: (text: string) => apiClient.typeText(text),
  });
}

export function usePressKey() {
  return useMutation({
    mutationFn: (key: string) => apiClient.pressKey(key),
  });
}

export function useScrollWheel() {
  return useMutation({
    mutationFn: (clicks: number) => apiClient.scrollWheel(clicks),
  });
}

export function useSendShortcut() {
  return useMutation({
    mutationFn: (keys: string[]) => apiClient.sendShortcut(keys),
  });
}

// ─── OCR & Media Tools ────────────────────────────────────────────────────────

export function useOcrImage() {
  return useMutation({
    mutationFn: ({ imagePath, language }: { imagePath: string; language?: string }) =>
      apiClient.ocrImage(imagePath, language),
  });
}

export function useOcrPdf() {
  return useMutation({
    mutationFn: ({ pdfPath, pageNumber }: { pdfPath: string; pageNumber?: number }) =>
      apiClient.ocrPdf(pdfPath, pageNumber),
  });
}

export function useOcrScreen() {
  return useMutation({
    mutationFn: () => apiClient.ocrScreen(),
  });
}

export function useConvertImage() {
  return useMutation({
    mutationFn: ({ imagePath, format, outputPath }: { imagePath: string; format: string; outputPath?: string }) =>
      apiClient.convertImage(imagePath, format, outputPath),
  });
}

export function useResizeImage() {
  return useMutation({
    mutationFn: ({ imagePath, width, height }: { imagePath: string; width: number; height: number }) =>
      apiClient.resizeImage(imagePath, width, height),
  });
}

export function useCompressImage() {
  return useMutation({
    mutationFn: ({ imagePath, quality }: { imagePath: string; quality?: number }) =>
      apiClient.compressImage(imagePath, quality),
  });
}

export function useMergePdfs() {
  return useMutation({
    mutationFn: ({ pdfPaths, outputPath }: { pdfPaths: string[]; outputPath?: string }) =>
      apiClient.mergePdfs(pdfPaths, outputPath),
  });
}

export function useSplitPdf() {
  return useMutation({
    mutationFn: ({ pdfPath, outputFolder }: { pdfPath: string; outputFolder?: string }) =>
      apiClient.splitPdf(pdfPath, outputFolder),
  });
}

export function usePdfToImages() {
  return useMutation({
    mutationFn: ({ pdfPath, outputFolder }: { pdfPath: string; outputFolder?: string }) =>
      apiClient.pdfToImages(pdfPath, outputFolder),
  });
}

export function useImagesToPdf() {
  return useMutation({
    mutationFn: ({ imagePaths, outputPath }: { imagePaths: string[]; outputPath?: string }) =>
      apiClient.imagesToPdf(imagePaths, outputPath),
  });
}

// ─── Security ─────────────────────────────────────────────────────────────────

export function useProcesses() {
  return useQuery({
    queryKey: ['processes'],
    queryFn: () => apiClient.getRunningProcesses(),
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useNetworkScan() {
  return useQuery({
    queryKey: ['networkScan'],
    queryFn: () => apiClient.getNetworkScan(),
    refetchInterval: 5000,
    staleTime: 3000,
  });
}

export function useQuarantineProcess() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ pid, action }: { pid: number; action: 'suspend' | 'resume' | 'terminate' }) =>
      apiClient.quarantineProcess(pid, action),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['processes'] });
      queryClient.invalidateQueries({ queryKey: ['networkScan'] });
    },
  });
}

// ─── Settings ─────────────────────────────────────────────────────────────────

export function useSettings() {
  return useQuery({
    queryKey: ['settings'],
    queryFn: () => apiClient.getSettings(),
    staleTime: 30000,
  });
}

export function useUpdateSettings() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (settings: Partial<JarvisSettings>) => apiClient.updateSettings(settings),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['settings'] }),
  });
}

export function useApiKeyStatus() {
  return useQuery({
    queryKey: ['apiKeyStatus'],
    queryFn: () => apiClient.getApiKeyStatus(),
    staleTime: 30000,
  });
}

export function useUpdateApiKeys() {
  return useMutation({
    mutationFn: (keys: import('../types/api').ApiKeyUpdatePayload) => apiClient.updateApiKeys(keys),
  });
}

export function useTestApiKey() {
  return useMutation({
    mutationFn: ({ provider, apiKey }: { provider: string; apiKey: string }) =>
      apiClient.testApiKey(provider, apiKey),
  });
}

// ─── Memory ───────────────────────────────────────────────────────────────────

export function useConversations(limit: number = 50) {
  return useQuery({
    queryKey: ['conversations', limit],
    queryFn: () => apiClient.getConversations(limit),
    staleTime: 5000,
  });
}

export function useMemoryStats(days: number = 7) {
  return useQuery({
    queryKey: ['memoryStats', days],
    queryFn: () => apiClient.getMemoryStats(days),
    staleTime: 15000,
  });
}

export function useMemoryFacts(category?: string) {
  return useQuery({
    queryKey: ['memoryFacts', category],
    queryFn: () => apiClient.getMemoryFacts(category),
    staleTime: 10000,
  });
}

export function useMemoryNodes() {
  return useQuery({
    queryKey: ['memoryNodes'],
    queryFn: () => apiClient.getMemoryNodes(),
    staleTime: 30000,
  });
}

export function useCreateMemoryFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ key, value, category }: { key: string; value: string; category?: string }) =>
      apiClient.createMemoryFact(key, value, category),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memoryFacts'] }),
  });
}

export function useDeleteMemoryFact() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (factId: number) => apiClient.deleteMemoryFact(factId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['memoryFacts'] }),
  });
}

export function useClearConversations() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiClient.clearConversationHistory(),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['conversations'] }),
  });
}

// ─── Automation ───────────────────────────────────────────────────────────────

export function useAutomationStatus() {
  return useQuery({
    queryKey: ['automationStatus'],
    queryFn: () => apiClient.getAutomationStatus(),
    refetchInterval: 10000,
    staleTime: 5000,
  });
}

export function useTasks() {
  return useQuery({
    queryKey: ['tasks'],
    queryFn: () => apiClient.getTasks(),
    staleTime: 5000,
  });
}

export function useMacros() {
  return useQuery({
    queryKey: ['macros'],
    queryFn: () => apiClient.getMacros(),
    staleTime: 5000,
  });
}

export function useToggleTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.toggleTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useDeleteTask() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (taskId: string) => apiClient.deleteTask(taskId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['tasks'] }),
  });
}

export function useRunMacro() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (macroId: string) => apiClient.runMacro(macroId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['macros'] }),
  });
}

// ─── WhatsApp ─────────────────────────────────────────────────────────────────

export function useWhatsAppStatus() {
  return useQuery({
    queryKey: ['whatsappStatus'],
    queryFn: () => apiClient.getWhatsAppStatus(),
    refetchInterval: 30000,
    staleTime: 10000,
  });
}

export function useWhatsAppContacts() {
  return useQuery({
    queryKey: ['whatsappContacts'],
    queryFn: () => apiClient.getWhatsAppContacts(),
    staleTime: 60000,
  });
}

export function useSendWhatsAppMessage() {
  return useMutation({
    mutationFn: ({ contact, message, language }: { contact: string; message: string; language?: string }) =>
      apiClient.sendWhatsAppMessage(contact, message, language as 'en' | 'hi'),
  });
}

// ─── Context & Suggestions ────────────────────────────────────────────────────

export function useSuggestion(language: string = 'en') {
  return useQuery({
    queryKey: ['suggestion', language],
    queryFn: () => apiClient.getSuggestion(language),
    staleTime: 30000,
  });
}

export function useQuickActions() {
  return useQuery({
    queryKey: ['quickActions'],
    queryFn: () => apiClient.getQuickActions(),
    staleTime: 30000,
  });
}

// ─── Sync & Pairing ───────────────────────────────────────────────────────────

export function usePairingCode() {
  return useMutation({
    mutationFn: () => apiClient.getPairingCode(),
  });
}

export function usePairDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: PairDevicePayload) => apiClient.pairDevice(payload),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pairedDevices'] }),
  });
}

export function usePairedDevices() {
  return useQuery({
    queryKey: ['pairedDevices'],
    queryFn: () => apiClient.getPairedDevices(),
    staleTime: 10000,
  });
}

export function useUnpairDevice() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (deviceId: string) => apiClient.unpairDevice(deviceId),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pairedDevices'] }),
  });
}

// ─── Health & Probes ──────────────────────────────────────────────────────────

export function useHealthCheck() {
  return useQuery({
    queryKey: ['health'],
    queryFn: () => apiClient.healthCheck(),
    refetchInterval: 30000,
    staleTime: 15000,
  });
}

export function useAgentHealth() {
  return useQuery({
    queryKey: ['agentHealth'],
    queryFn: () => apiClient.agentHealth(),
    refetchInterval: 15000,
    staleTime: 10000,
  });
}

// ─── Weather & Search ─────────────────────────────────────────────────────────

export function useWeatherQuery() {
  return useMutation({
    mutationFn: ({ city, language }: { city: string; language?: string }) =>
      apiClient.getWeather(city, language),
  });
}

export function useWebSearch() {
  return useMutation({
    mutationFn: ({ query, language }: { query: string; language?: string }) =>
      apiClient.webSearch(query, language),
  });
}

// ─── Command Execution ────────────────────────────────────────────────────────

export function useExecuteCommand() {
  return useMutation({
    mutationFn: ({ command, language }: { command: string; language?: string }) =>
      apiClient.executeCommand(command, language as 'en' | 'hi'),
  });
}

export function useConfirmCommand() {
  return useMutation({
    mutationFn: ({ confirmationId, approved }: { confirmationId: string; approved: boolean }) =>
      apiClient.confirmCommand(confirmationId, approved),
  });
}

// ─── Volume Control Mutations ─────────────────────────────────────────────────

export function useVolumeUp() {
  return useMutation({
    mutationFn: ({ amount, language }: { amount?: number; language?: string } = {}) =>
      apiClient.volumeUp(amount, language),
  });
}

export function useVolumeDown() {
  return useMutation({
    mutationFn: ({ amount, language }: { amount?: number; language?: string } = {}) =>
      apiClient.volumeDown(amount, language),
  });
}

export function useToggleMute() {
  return useMutation({
    mutationFn: (language?: string) => apiClient.toggleMute(language),
  });
}
