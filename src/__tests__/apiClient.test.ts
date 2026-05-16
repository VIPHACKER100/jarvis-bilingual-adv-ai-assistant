/**
 * JARVIS v3.8.0 — API Client Tests
 *
 * Mock-fetch based tests verifying type contracts,
 * error handling, and response shapes for all API methods.
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';

// Mock fetch globally
const mockFetch = vi.fn();
vi.stubGlobal('fetch', mockFetch);

// Mock config
vi.mock('../config', () => ({
  API_BASE_URL: 'http://localhost:8000/api/v1',
}));

// Mock env
vi.stubGlobal('import', { meta: { env: { VITE_JARVIS_API_KEY: 'test-key' } } });

import { ApiClient } from '../services/apiClient';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(() => {
    client = new ApiClient('http://localhost:8000/api/v1');
    mockFetch.mockReset();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  // ─── Health Check ────────────────────────────────────────────────────

  describe('healthCheck', () => {
    it('should return health status on success', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', name: 'JARVIS', version: '3.9.0' }),
      });

      const result = await client.healthCheck();

      expect(result).toHaveProperty('status', 'ok');
      expect(result).toHaveProperty('name', 'JARVIS');
      expect(result).toHaveProperty('version');
    });

    it('should throw on backend unavailable', async () => {
      mockFetch.mockResolvedValueOnce({ ok: false, status: 503 });

      await expect(client.healthCheck()).rejects.toThrow('Backend not available');
    });
  });

  // ─── System Status ───────────────────────────────────────────────────

  describe('getSystemStatus', () => {
    it('should return typed system status', async () => {
      const mockStatus = {
        success: true,
        battery: { percent: 85, is_charging: true, secs_left: -1 },
        cpu: { percent: 25.0, count: 8 },
        memory: { total: 16000000000, used: 8000000000, percent: 50, available: 8000000000 },
        disk: { total: 500000000000, used: 250000000000, free: 250000000000, percent: 50 },
        network: { bytes_sent: 1000, bytes_recv: 2000, packets_sent: 10, packets_recv: 20 },
        uptime: 3600,
        volume: 50,
        platform: 'Windows',
        timestamp: '2026-05-15T10:00:00',
      };

      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus,
      });

      const result = await client.getSystemStatus();

      expect(result.battery.percent).toBe(85);
      expect(result.cpu.count).toBe(8);
      expect(result.platform).toBe('Windows');
    });
  });

  // ─── Command Execution ───────────────────────────────────────────────

  describe('executeCommand', () => {
    it('should send command and return typed response', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          action_type: 'SYSTEM',
          command_key: 'get_time',
          language: 'en',
          response: 'It is 10:00 AM',
          timestamp: '2026-05-15T10:00:00',
        }),
      });

      const result = await client.executeCommand('what time is it', 'en');

      expect(result.success).toBe(true);
      expect(result.command_key).toBe('get_time');
      expect(result.response).toContain('10:00');
    });

    it('should throw with error detail on failure', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: false,
        json: async () => ({ detail: 'Rate limited' }),
      });

      await expect(client.executeCommand('test')).rejects.toThrow('Rate limited');
    });
  });

  // ─── Memory Facts ────────────────────────────────────────────────────

  describe('Memory Facts', () => {
    it('getMemoryFacts should return typed fact list', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          facts: [{ id: 1, key: 'name', value: 'JARVIS', category: 'system', source: 'init', timestamp: '' }],
          count: 1,
        }),
      });

      const result = await client.getMemoryFacts();

      expect(result.facts).toHaveLength(1);
      expect(result.facts[0].key).toBe('name');
    });

    it('createMemoryFact should return id', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true, id: 42 }),
      });

      const result = await client.createMemoryFact('color', 'blue', 'preferences');

      expect(result.success).toBe(true);
      expect(result.id).toBe(42);
    });
  });

  // ─── Settings ────────────────────────────────────────────────────────

  describe('Settings', () => {
    it('getSettings should return typed settings', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({
          success: true,
          settings: {
            llm_provider: 'nvidia',
            enable_dangerous_commands: false,
            confirmation_timeout: 30,
            wake_word_enabled: true,
            wake_word_phrase: 'hey jarvis',
            proactive_enabled: true,
            tts_enabled: true,
            language: 'en',
          },
        }),
      });

      const result = await client.getSettings();

      expect(result.settings.llm_provider).toBe('nvidia');
      expect(result.settings.enable_dangerous_commands).toBe(false);
    });
  });

  // ─── Safe Request ────────────────────────────────────────────────────

  describe('safeRequest', () => {
    it('should return null on failure instead of throwing', async () => {
      const result = await client.safeRequest(() => Promise.reject(new Error('fail')));

      expect(result).toBeNull();
    });

    it('should return data on success', async () => {
      const result = await client.safeRequest(() => Promise.resolve({ data: 'ok' }));

      expect(result).toEqual({ data: 'ok' });
    });
  });

  // ─── Request Headers ─────────────────────────────────────────────────

  describe('Request Headers', () => {
    it('should include API key in X-API-Key header', async () => {
      mockFetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ status: 'ok', name: 'JARVIS', version: '3.9.0' }),
      });

      await client.getSystemStatus();

      const fetchCall = mockFetch.mock.calls[0];
      const headers = fetchCall[1]?.headers;
      expect(headers).toHaveProperty('X-API-Key');
    });
  });
});
