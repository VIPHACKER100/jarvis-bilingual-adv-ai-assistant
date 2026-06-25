/**
 * useSystemQuery Hook Tests
 *
 * Tests TanStack Query wrappers for all system API calls.
 * Uses vi.hoisted() to define mockApiClient before vi.mock() is hoisted.
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { renderHook, waitFor } from '@testing-library/react';
import { ReactNode } from 'react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// ─── Mock apiClient using vi.hoisted() — hoisted before vi.mock() ──────

const { mockApiClient } = vi.hoisted(() => {
  return {
    mockApiClient: {
      getSystemStatus: vi.fn(),
      getPersonalities: vi.fn(),
      setPersonality: vi.fn(),
      shutdownComputer: vi.fn(),
      restartComputer: vi.fn(),
      sleepComputer: vi.fn(),
      getPerformanceHistory: vi.fn(),
      getBattery: vi.fn(),
      getWindows: vi.fn(),
      getApps: vi.fn(),
      closeApp: vi.fn(),
      openApp: vi.fn(),
      listFiles: vi.fn(),
      getCursorPosition: vi.fn(),
      moveCursor: vi.fn(),
      mouseClick: vi.fn(),
      typeText: vi.fn(),
      pressKey: vi.fn(),
      scrollWheel: vi.fn(),
      sendShortcut: vi.fn(),
      ocrImage: vi.fn(),
      convertImage: vi.fn(),
      getRunningProcesses: vi.fn(),
      getNetworkScan: vi.fn(),
      getSettings: vi.fn(),
      updateSettings: vi.fn(),
      getWhatsAppStatus: vi.fn(),
      getWhatsAppContacts: vi.fn(),
      getQuickActions: vi.fn(),
      getPairedDevices: vi.fn(),
      unpairDevice: vi.fn(),
      getPairingCode: vi.fn(),
      healthCheck: vi.fn(),
      getSuggestion: vi.fn(),
      getApiKeyStatus: vi.fn(),
      updateApiKeys: vi.fn(),
      testApiKey: vi.fn(),
    },
  };
});

vi.mock('../services/apiClient', () => ({
  apiClient: mockApiClient,
}));

vi.mock('../lib/react-query', () => ({
  queryKeys: {
    systemMetrics: () => ['systemMetrics'] as const,
    systemMetricsHistory: (tw: number) => ['systemMetrics', 'history', tw] as const,
  },
}));

// Import hooks after mocks
import {
  useSystemStatus,
  usePersonalities,
  useSetPersonality,
  useShutdownComputer,
  useRestartComputer,
  useSleepComputer,
  usePerformanceHistory,
  useBattery,
  useWindows,
  useApps,
  useCloseApp,
  useOpenApp,
  useFileList,
  useCursorPosition,
  useMoveCursor,
  useMouseClick,
  useTypeText,
  usePressKey,
  useScrollWheel,
  useSendShortcut,
  useOcrImage,
  useProcesses,
  useNetworkScan,
  useSettings,
  useWhatsAppStatus,
  useWhatsAppContacts,
  useQuickActions,
  usePairedDevices,
  useUnpairDevice,
  useHealthCheck,
  useSuggestion,
  useApiKeyStatus,
  useUpdateApiKeys,
  useTestApiKey,
  usePairingCode,
} from '../hooks/useSystemQuery';

// ─── Helpers ────────────────────────────────────────────────────────────

function createWrapper() {
  const queryClient = new QueryClient({
    defaultOptions: {
      queries: { retry: false, gcTime: 0 },
      mutations: { retry: false },
    },
  });
  return function Wrapper({ children }: { children: ReactNode }) {
    return <QueryClientProvider client={queryClient}>{children}</QueryClientProvider>;
  };
}

// ─── Tests ──────────────────────────────────────────────────────────────

describe('useSystemQuery hooks', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Set default success responses
    Object.values(mockApiClient).forEach(mock => {
      if (vi.isMockFunction(mock)) {
        mock.mockResolvedValue({ success: true });
      }
    });
  });

  // ─── Query Hooks ────────────────────────────────────────────────────

  describe('useSystemStatus', () => {
    it('returns system status data', async () => {
      const data = { success: true, battery: { percent: 85 } };
      mockApiClient.getSystemStatus.mockResolvedValue(data);
      const { result } = renderHook(() => useSystemStatus('en'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(data);
    });

    it('handles error state', async () => {
      mockApiClient.getSystemStatus.mockRejectedValue(new Error('Network error'));
      const { result } = renderHook(() => useSystemStatus('en'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isError).toBe(true));
    });
  });

  describe('usePersonalities', () => {
    it('fetches personalities', async () => {
      const data = { success: true, personalities: [{ id: 'stark', name: 'Stark' }], count: 1 };
      mockApiClient.getPersonalities.mockResolvedValue(data);
      const { result } = renderHook(() => usePersonalities(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(data);
    });
  });

  describe('usePerformanceHistory', () => {
    it('fetches performance history with limit', async () => {
      const data = { success: true, data: [{ cpu_percent: 50 }], period_minutes: 1 };
      mockApiClient.getPerformanceHistory.mockResolvedValue(data);
      const { result } = renderHook(() => usePerformanceHistory(60), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.getPerformanceHistory).toHaveBeenCalledWith(60);
    });
  });

  describe('useBattery', () => {
    it('fetches battery info', async () => {
      const data = { success: true, battery: { percent: 90, is_charging: true }, response: 'Battery 90%' };
      mockApiClient.getBattery.mockResolvedValue(data);
      const { result } = renderHook(() => useBattery('en'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(data);
    });
  });

  describe('useWindows', () => {
    it('fetches windows list', async () => {
      const data = { success: true, windows: [{ title: 'Test' }], count: 1 };
      mockApiClient.getWindows.mockResolvedValue(data);
      const { result } = renderHook(() => useWindows(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useApps', () => {
    it('fetches apps list', async () => {
      const data = { success: true, apps: [{ name: 'Code' }], count: 1 };
      mockApiClient.getApps.mockResolvedValue(data);
      const { result } = renderHook(() => useApps(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useFileList', () => {
    it('fetches file list with folder and pattern', async () => {
      mockApiClient.listFiles.mockResolvedValue({ success: true, files: [], folder: 'C:\\', count: 0 });
      const { result } = renderHook(() => useFileList('C:\\', '*.tsx'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.listFiles).toHaveBeenCalledWith('C:\\', '*.tsx');
    });
  });

  describe('useCursorPosition', () => {
    it('fetches cursor position', async () => {
      const data = { success: true, position: { x: 500, y: 300 } };
      mockApiClient.getCursorPosition.mockResolvedValue(data);
      const { result } = renderHook(() => useCursorPosition(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  // ─── Mutation Hooks ──────────────────────────────────────────────────

  describe('useSetPersonality', () => {
    it('mutates and returns success', async () => {
      mockApiClient.setPersonality.mockResolvedValue({ success: true, response: 'Switched' });
      const { result } = renderHook(() => useSetPersonality(), { wrapper: createWrapper() });
      result.current.mutate('stark');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.setPersonality).toHaveBeenCalledWith('stark');
    });
  });

  describe('useShutdownComputer', () => {
    it('calls shutdown with confirmed flag', async () => {
      mockApiClient.shutdownComputer.mockResolvedValue({ success: true, action: 'shutdown' });
      const { result } = renderHook(() => useShutdownComputer(), { wrapper: createWrapper() });
      result.current.mutate({ confirmed: true, language: 'en' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.shutdownComputer).toHaveBeenCalledWith(true, 'en');
    });
  });

  describe('useRestartComputer', () => {
    it('calls restart with confirmed flag', async () => {
      const { result } = renderHook(() => useRestartComputer(), { wrapper: createWrapper() });
      result.current.mutate({ confirmed: true });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.restartComputer).toHaveBeenCalledWith(true, undefined);
    });
  });

  describe('useSleepComputer', () => {
    it('calls sleep with confirmed flag', async () => {
      const { result } = renderHook(() => useSleepComputer(), { wrapper: createWrapper() });
      result.current.mutate({ confirmed: false });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.sleepComputer).toHaveBeenCalledWith(false, undefined);
    });
  });

  describe('useCloseApp', () => {
    it('closes an app with confirmation', async () => {
      const { result } = renderHook(() => useCloseApp(), { wrapper: createWrapper() });
      result.current.mutate({ appName: 'Code.exe', confirmed: true });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.closeApp).toHaveBeenCalledWith('Code.exe', true);
    });
  });

  describe('useOpenApp', () => {
    it('opens an app', async () => {
      const { result } = renderHook(() => useOpenApp(), { wrapper: createWrapper() });
      result.current.mutate('Code.exe');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.openApp).toHaveBeenCalledWith('Code.exe');
    });
  });

  // ─── Input Simulation Mutations ──────────────────────────────────────

  describe('useMoveCursor', () => {
    it('moves cursor to coordinates', async () => {
      const { result } = renderHook(() => useMoveCursor(), { wrapper: createWrapper() });
      result.current.mutate({ x: 100, y: 200 });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.moveCursor).toHaveBeenCalledWith(100, 200);
    });
  });

  describe('useMouseClick', () => {
    it('clicks mouse button', async () => {
      const { result } = renderHook(() => useMouseClick(), { wrapper: createWrapper() });
      result.current.mutate('right');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.mouseClick).toHaveBeenCalledWith('right');
    });
  });

  describe('useTypeText', () => {
    it('types text', async () => {
      const { result } = renderHook(() => useTypeText(), { wrapper: createWrapper() });
      result.current.mutate('Hello world');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.typeText).toHaveBeenCalledWith('Hello world');
    });
  });

  describe('usePressKey', () => {
    it('presses a key', async () => {
      const { result } = renderHook(() => usePressKey(), { wrapper: createWrapper() });
      result.current.mutate('Enter');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.pressKey).toHaveBeenCalledWith('Enter');
    });
  });

  describe('useScrollWheel', () => {
    it('scrolls wheel', async () => {
      const { result } = renderHook(() => useScrollWheel(), { wrapper: createWrapper() });
      result.current.mutate(3);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.scrollWheel).toHaveBeenCalledWith(3);
    });
  });

  describe('useSendShortcut', () => {
    it('sends keyboard shortcut', async () => {
      const { result } = renderHook(() => useSendShortcut(), { wrapper: createWrapper() });
      result.current.mutate(['Ctrl', 'C']);
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.sendShortcut).toHaveBeenCalledWith(['Ctrl', 'C']);
    });
  });

  // ─── Media Tools Mutations ───────────────────────────────────────────

  describe('useOcrImage', () => {
    it('performs OCR on image', async () => {
      const { result } = renderHook(() => useOcrImage(), { wrapper: createWrapper() });
      result.current.mutate({ imagePath: '/path/image.png', language: 'eng' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.ocrImage).toHaveBeenCalledWith('/path/image.png', 'eng');
    });
  });

  // ─── Security Queries ────────────────────────────────────────────────

  describe('useProcesses', () => {
    it('fetches running processes', async () => {
      const data = { success: true, processes: [], count: 0 };
      mockApiClient.getRunningProcesses.mockResolvedValue(data);
      const { result } = renderHook(() => useProcesses(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useNetworkScan', () => {
    it('fetches network connections', async () => {
      mockApiClient.getNetworkScan.mockResolvedValue({ success: true, connections: [], count: 0 });
      const { result } = renderHook(() => useNetworkScan(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  // ─── Settings Queries ────────────────────────────────────────────────

  describe('useSettings', () => {
    it('fetches settings', async () => {
      const data = { success: true, settings: { language: 'en', llm_provider: 'nvidia' } };
      mockApiClient.getSettings.mockResolvedValue(data);
      const { result } = renderHook(() => useSettings(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useApiKeyStatus', () => {
    it('fetches API key status', async () => {
      mockApiClient.getApiKeyStatus.mockResolvedValue({ success: true, keys: { NVIDIA_API_KEY: 'test' } });
      const { result } = renderHook(() => useApiKeyStatus(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useUpdateApiKeys', () => {
    it('updates API keys', async () => {
      const { result } = renderHook(() => useUpdateApiKeys(), { wrapper: createWrapper() });
      result.current.mutate({ nvidia_api_key: 'new-key' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.updateApiKeys).toHaveBeenCalledWith({ nvidia_api_key: 'new-key' });
    });
  });

  describe('useTestApiKey', () => {
    it('tests an API key', async () => {
      const { result } = renderHook(() => useTestApiKey(), { wrapper: createWrapper() });
      result.current.mutate({ provider: 'nvidia', apiKey: 'test-key' });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.testApiKey).toHaveBeenCalledWith('nvidia', 'test-key');
    });
  });

  // ─── WhatsApp Queries ────────────────────────────────────────────────

  describe('useWhatsAppStatus', () => {
    it('fetches WhatsApp status', async () => {
      mockApiClient.getWhatsAppStatus.mockResolvedValue({ success: true, desktop_installed: true, is_running: true });
      const { result } = renderHook(() => useWhatsAppStatus(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useWhatsAppContacts', () => {
    it('fetches WhatsApp contacts', async () => {
      mockApiClient.getWhatsAppContacts.mockResolvedValue({ success: true, contacts: [], count: 0 });
      const { result } = renderHook(() => useWhatsAppContacts(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  // ─── Sync / Pairing ──────────────────────────────────────────────────

  describe('usePairedDevices', () => {
    it('fetches paired devices', async () => {
      mockApiClient.getPairedDevices.mockResolvedValue({ success: true, devices: [], count: 0 });
      const { result } = renderHook(() => usePairedDevices(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useUnpairDevice', () => {
    it('unpairs a device', async () => {
      const { result } = renderHook(() => useUnpairDevice(), { wrapper: createWrapper() });
      result.current.mutate('dev-1');
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.unpairDevice).toHaveBeenCalledWith('dev-1');
    });
  });

  describe('usePairingCode', () => {
    it('generates pairing code', async () => {
      mockApiClient.getPairingCode.mockResolvedValue({ success: true, code: '123456', expires_in: 300 });
      const { result } = renderHook(() => usePairingCode(), { wrapper: createWrapper() });
      result.current.mutate();
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(mockApiClient.getPairingCode).toHaveBeenCalled();
    });
  });

  // ─── Context & Suggestions ───────────────────────────────────────────

  describe('useSuggestion', () => {
    it('fetches suggestions', async () => {
      mockApiClient.getSuggestion.mockResolvedValue({ success: true, suggestion: 'Try voice command' });
      const { result } = renderHook(() => useSuggestion('en'), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useQuickActions', () => {
    it('fetches quick actions', async () => {
      mockApiClient.getQuickActions.mockResolvedValue({ success: true, actions: [] });
      const { result } = renderHook(() => useQuickActions(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
    });
  });

  describe('useHealthCheck', () => {
    it('fetches health status', async () => {
      const data = { status: 'ok', name: 'JARVIS', version: '4.0.0' };
      mockApiClient.healthCheck.mockResolvedValue(data);
      const { result } = renderHook(() => useHealthCheck(), { wrapper: createWrapper() });
      await waitFor(() => expect(result.current.isSuccess).toBe(true));
      expect(result.current.data).toEqual(data);
    });
  });
});
