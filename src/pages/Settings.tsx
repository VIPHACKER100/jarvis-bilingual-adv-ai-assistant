// ==========================================================================
// JARVIS v4.0 — PAGE-2: Settings / Configuration
// Settings form, API keys, personality selection
// ==========================================================================

import { useEffect, useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store';
import { settingsApi } from '../api/settings';
import { systemApi } from '../api/system';
import { authService } from '../services/auth';
import { SettingsToggle } from '../components/SettingsToggle';
import { PersonalityCard } from '../components/PersonalityCard';
import { ApiKeyCard } from '../components/ApiKeyCard';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { LoadingOverlay } from '../components/LoadingOverlay';
import { NotificationStack } from '../components/NotificationToast';
import type { PersonalityInfo, ApiKeyStatusResponse } from '../types';
import { ArrowLeft, Key, Palette, Settings2, Info, LogOut } from 'lucide-react';

export function SettingsPage() {
  const navigate = useNavigate();
  const {
    data: settings,
    setSettings,
    setLoading,
    notifications,
    addNotification,
    dismissNotification,
    setApiKey,
    setAuthenticated,
    clearEntries,
    clearConfirmations,
  } = useStore();

  // Local state
  const [personalities, setPersonalities] = useState<PersonalityInfo[]>([]);
  const [activePersonality, setActivePersonality] = useState<string | null>(null);
  const [apiKeyStatus, setApiKeyStatus] = useState<ApiKeyStatusResponse | null>(null);
  const [personalityLoading, setPersonalityLoading] = useState(false);

  // Form state
  const [form, setForm] = useState({
    llm_provider: 'openrouter',
    wake_word_enabled: false,
    wake_word_phrase: 'jarvis',
    enable_dangerous_commands: false,
    confirmation_timeout: 30,
    language: 'en',
  });
  const [saving, setSaving] = useState(false);

  // API key inputs (not pre-filled for security)
  const [keyInputs, setKeyInputs] = useState({
    nvidia_api_key: '',
    openrouter_api_key: '',
    gemini_api_key: '',
    backend_api_key: '',
  });
  const [keySaving, setKeySaving] = useState<string | null>(null);
  const [keyTesting, setKeyTesting] = useState<string | null>(null);
  const [keyTestResults, setKeyTestResults] = useState<Record<string, { success: boolean; message: string } | null>>({});

  // Fetch data on mount
  useEffect(() => {
    const fetchAll = async () => {
      setLoading(true);
      try {
        const [settingsRes, personalitiesRes, keyStatusRes] = await Promise.all([
          settingsApi.get(),
          systemApi.getPersonalities(),
          settingsApi.getKeys(),
        ]);
        setSettings(settingsRes.settings);
        setPersonalities(personalitiesRes.data);
        setApiKeyStatus(keyStatusRes);

        // Set form defaults
        if (settingsRes.settings) {
          setForm({
            llm_provider: settingsRes.settings.llm_provider ?? 'openrouter',
            wake_word_enabled: settingsRes.settings.wake_word_enabled ?? false,
            wake_word_phrase: settingsRes.settings.wake_word_phrase ?? 'jarvis',
            enable_dangerous_commands: settingsRes.settings.enable_dangerous_commands ?? false,
            confirmation_timeout: settingsRes.settings.confirmation_timeout ?? 30,
            language: settingsRes.settings.language ?? 'en',
          });
        }
      } catch (err: unknown) {
        addNotification({
          id: crypto.randomUUID(),
          title: 'Load Error',
          message: err instanceof Error ? err.message : 'Failed to load settings',
          type: 'error',
          duration: 5000,
        });
      } finally {
        setLoading(false);
      }
    };
    fetchAll();
  }, [setSettings, setLoading, addNotification]);

  // Save settings
  const handleSaveSettings = useCallback(async () => {
    setSaving(true);
    try {
      const res = await settingsApi.update({
        llm_provider: form.llm_provider as 'openrouter' | 'nvidia' | 'openai' | 'google' | 'ollama',
        wake_word_enabled: form.wake_word_enabled,
        wake_word_phrase: form.wake_word_phrase,
        enable_dangerous_commands: form.enable_dangerous_commands,
        confirmation_timeout: form.confirmation_timeout,
        language: form.language,
      });
      setSettings(res.settings);
      addNotification({
        id: crypto.randomUUID(),
        title: 'Settings Saved',
        message: 'Settings updated successfully',
        type: 'success',
        duration: 3000,
      });
    } catch (err: unknown) {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Save Error',
        message: err instanceof Error ? err.message : 'Failed to save settings',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setSaving(false);
    }
  }, [form, setSettings, addNotification]);

  // Select personality
  const handlePersonalitySelect = useCallback(async (id: string) => {
    setPersonalityLoading(true);
    try {
      const res = await systemApi.setPersonality(id);
      setActivePersonality(res.config.id);

      // Apply theme as CSS variables
      if (res.config.accent) {
        document.documentElement.style.setProperty('--accent-color', res.config.accent);
      }
      if (res.config.primary) {
        document.documentElement.style.setProperty('--primary-color', res.config.primary);
      }
      if (res.config.secondary) {
        document.documentElement.style.setProperty('--secondary-color', res.config.secondary);
      }

      addNotification({
        id: crypto.randomUUID(),
        title: 'Personality Changed',
        message: res.message,
        type: 'success',
        duration: 3000,
      });
    } catch (err: unknown) {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Personality Error',
        message: err instanceof Error ? err.message : 'Failed to set personality',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setPersonalityLoading(false);
    }
  }, [addNotification]);

  // Save API key
  const handleSaveKey = useCallback(async (provider: string, value: string) => {
    setKeySaving(provider);
    try {
      await settingsApi.updateKeys({ [provider]: value });
      // Refresh key status
      const status = await settingsApi.getKeys();
      setApiKeyStatus(status);
      addNotification({
        id: crypto.randomUUID(),
        title: 'Key Saved',
        message: `${provider} API key updated`,
        type: 'success',
        duration: 3000,
      });
      // Clear the input
      setKeyInputs((prev) => ({ ...prev, [provider]: '' }));
    } catch (err: unknown) {
      addNotification({
        id: crypto.randomUUID(),
        title: 'Key Save Error',
        message: err instanceof Error ? err.message : 'Failed to save API key',
        type: 'error',
        duration: 5000,
      });
    } finally {
      setKeySaving(null);
    }
  }, [addNotification]);

  // Test API key
  const handleTestKey = useCallback(async (provider: string, value: string) => {
    setKeyTesting(provider);
    try {
      const res = await settingsApi.testKey(provider, value);
      setKeyTestResults((prev) => ({
        ...prev,
        [provider]: { success: res.success, message: res.response },
      }));
    } catch (err: unknown) {
      setKeyTestResults((prev) => ({
        ...prev,
        [provider]: { success: false, message: err instanceof Error ? err.message : 'Test failed' },
      }));
    } finally {
      setKeyTesting(null);
    }
  }, []);

  // Logout / clear API key
  const handleLogout = useCallback(() => {
    authService.clearApiKey();
    setApiKey(null);
    setAuthenticated(false);
    clearEntries();
    clearConfirmations();
    addNotification({
      id: crypto.randomUUID(),
      title: 'Disconnected',
      message: 'API key cleared. Some features are now unavailable.',
      type: 'info',
      duration: 4000,
    });
  }, [setApiKey, setAuthenticated, clearEntries, clearConfirmations, addNotification]);

  const apiKeyFields = [
    { key: 'nvidia_api_key', label: 'NVIDIA API Key', providerKey: 'NVIDIA_API_KEY' },
    { key: 'openrouter_api_key', label: 'OpenRouter API Key', providerKey: 'OPENROUTER_API_KEY' },
    { key: 'gemini_api_key', label: 'Gemini API Key', providerKey: 'GEMINI_API_KEY' },
    { key: 'backend_api_key', label: 'Backend API Key', providerKey: 'BACKEND_API_KEY' },
  ];

  return (
    <div className="min-h-screen bg-cyber-dark p-4 md:p-6">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => navigate('/')}
            title="Back to Home"
            aria-label="Back to Home"
            className="p-2 glass-button !rounded-lg"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <h1 className="font-display text-2xl font-bold neon-text">Settings</h1>
        </div>
        <button
          onClick={handleLogout}
          title="Disconnect / Clear API Key"
          aria-label="Disconnect and clear API key"
          className="flex items-center gap-1.5 glass-button glass-button-danger px-3 py-1.5 text-xs"
        >
          <LogOut className="w-3.5 h-3.5" />
          Disconnect
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-6xl mx-auto">
        {/* 🎨 General Settings */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Settings2 className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-lg font-bold text-slate-200">General Settings</h2>
          </div>

          <div className="space-y-4">
            {/* LLM Provider */}
            <div className="flex flex-col gap-1.5">
              <label className="font-display text-sm font-semibold uppercase tracking-wider text-cyan-300">
                LLM Provider
              </label>
              <select
                value={form.llm_provider}
                onChange={(e) => setForm((f) => ({ ...f, llm_provider: e.target.value }))}
                className="w-full px-4 py-2.5 bg-cyber-surface/60 backdrop-blur-md border border-cyan-800/30 rounded-lg font-mono text-sm text-slate-200 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                aria-label="LLM Provider"
              >
                <option value="openrouter">OpenRouter</option>
                <option value="nvidia">NVIDIA</option>
                <option value="openai">OpenAI</option>
                <option value="google">Google</option>
                <option value="ollama">Ollama</option>
              </select>
            </div>

            <SettingsToggle
              label="Wake Word"
              description="Enable wake word detection"
              checked={form.wake_word_enabled}
              onChange={(checked) => setForm((f) => ({ ...f, wake_word_enabled: checked }))}
            />

            {form.wake_word_enabled && (
              <Input
                label="Wake Word Phrase"
                value={form.wake_word_phrase}
                onChange={(e) => setForm((f) => ({ ...f, wake_word_phrase: e.target.value }))}
                maxLength={50}
                helperText="Max 50 characters"
              />
            )}

            <SettingsToggle
              label="Dangerous Commands"
              description="Allow shutdown, restart, delete operations"
              checked={form.enable_dangerous_commands}
              onChange={(checked) => setForm((f) => ({ ...f, enable_dangerous_commands: checked }))}
            />

            <div className="flex flex-col gap-1.5">
              <label className="font-display text-sm font-semibold uppercase tracking-wider text-cyan-300">
                Confirmation Timeout (seconds)
              </label>
              <input
                type="number"
                min={5}
                max={300}
                value={form.confirmation_timeout}
                onChange={(e) => setForm((f) => ({ ...f, confirmation_timeout: parseInt(e.target.value) || 30 }))}
                className="w-full px-4 py-2.5 bg-cyber-surface/60 backdrop-blur-md border border-cyan-800/30 rounded-lg font-mono text-sm text-slate-200 transition-all duration-300 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-400/50"
                aria-label="Confirmation timeout in seconds"
              />
            </div>

            <Button
              variant="primary"
              size="md"
              isLoading={saving}
              onClick={handleSaveSettings}
              className="w-full"
              title="Save settings"
              aria-label="Save settings"
            >
              Save Settings
            </Button>
          </div>
        </Card>

        {/* 🔑 API Keys */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Key className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-lg font-bold text-slate-200">API Keys</h2>
          </div>

          <div className="space-y-4">
            {apiKeyFields.map(({ key, label, providerKey }) => (
              <ApiKeyCard
                key={key}
                name={key}
                label={label}
                value={keyInputs[key as keyof typeof keyInputs]}
                isSet={apiKeyStatus?.[providerKey] ?? false}
                isTesting={keyTesting === key}
                isSaving={keySaving === key}
                testResult={keyTestResults[key] ?? null}
                onChange={(val) => setKeyInputs((prev) => ({ ...prev, [key]: val }))}
                onTest={() => handleTestKey(key, keyInputs[key as keyof typeof keyInputs])}
                onSave={() => handleSaveKey(key, keyInputs[key as keyof typeof keyInputs])}
              />
            ))}
          </div>
        </Card>

        {/* 🎭 Personality */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Palette className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-lg font-bold text-slate-200">Personality</h2>
          </div>

          {personalityLoading && <LoadingOverlay visible={true} message="Changing personality..." />}

          <div className="grid grid-cols-2 gap-3">
            {personalities.map((p) => (
              <PersonalityCard
                key={p.id}
                personality={p}
                isActive={activePersonality === p.id || (activePersonality === null && p.id === 'stark')}
                onClick={handlePersonalitySelect}
              />
            ))}
          </div>
        </Card>

        {/* ℹ️ System Info */}
        <Card className="p-5">
          <div className="flex items-center gap-2 mb-4">
            <Info className="w-5 h-5 text-cyan-400" />
            <h2 className="font-display text-lg font-bold text-slate-200">System Information</h2>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between py-2 border-b border-cyan-900/20">
              <span className="text-xs font-mono text-slate-400">NVIDIA Model</span>
              <span className="text-xs font-mono text-slate-200">{settings?.nvidia_model ?? '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-cyan-900/20">
              <span className="text-xs font-mono text-slate-400">OpenRouter Model</span>
              <span className="text-xs font-mono text-slate-200">{settings?.openrouter_model ?? '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-cyan-900/20">
              <span className="text-xs font-mono text-slate-400">Server Port</span>
              <span className="text-xs font-mono text-slate-200">{settings?.port ?? '-'}</span>
            </div>
            <div className="flex justify-between py-2 border-b border-cyan-900/20">
              <span className="text-xs font-mono text-slate-400">Log Level</span>
              <span className="text-xs font-mono text-slate-200">{settings?.log_level ?? '-'}</span>
            </div>
            <div className="flex justify-between py-2">
              <span className="text-xs font-mono text-slate-400">Language</span>
              <span className="text-xs font-mono text-slate-200">{settings?.language ?? 'en'}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Notifications */}
      <NotificationStack notifications={notifications} onDismiss={dismissNotification} />
    </div>
  );
}
