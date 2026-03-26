import { FC, useState, useEffect, useRef } from 'react';
import { apiClient } from '../services/apiClient';
import { THEMES, ThemeName, useTheme } from '../hooks/useTheme';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: any) => void;
}

type SettingsTab = 'general' | 'ai' | 'security' | 'appearance' | 'audio';

const SectionHeader: FC<{ children: React.ReactNode; color?: string }> = ({ children, color = 'cyan' }) => (
  <h3 className={`text-xs font-bold uppercase tracking-[0.3em] border-b pb-2 mb-4 text-${color}-500/60 border-${color}-500/10`}>
    {children}
  </h3>
);

const FormRow: FC<{ label: string; hint?: string; children: React.ReactNode }> = ({ label, hint, children }) => (
  <div className="space-y-1.5">
    <label className="text-sm text-gray-400 block ml-1 font-medium">{label}</label>
    {children}
    {hint && <p className="text-[11px] text-gray-600 ml-1">{hint}</p>}
  </div>
);

const Toggle: FC<{ id: string; checked: boolean; onChange: (v: boolean) => void; label: string; description?: string }> = ({
  id, checked, onChange, label, description
}) => (
  <div className="flex items-start gap-3 p-3 bg-white/5 border border-white/5 rounded-lg hover:border-white/10 transition-colors">
    <div className="relative mt-0.5 flex-shrink-0">
      <input
        type="checkbox"
        id={id}
        checked={checked}
        onChange={e => onChange(e.target.checked)}
        className="sr-only"
      />
      <div
        onClick={() => onChange(!checked)}
        className={`w-10 h-5 rounded-full cursor-pointer transition-all duration-300 ${checked ? 'bg-[var(--neon-blue)]' : 'bg-slate-700'}`}
      >
        <div className={`w-4 h-4 bg-white rounded-full absolute top-0.5 transition-all duration-300 shadow ${checked ? 'left-5' : 'left-0.5'}`} />
      </div>
    </div>
    <div>
      <label htmlFor={id} className="text-sm text-gray-300 cursor-pointer font-medium select-none">{label}</label>
      {description && <p className="text-[11px] text-gray-600 mt-0.5">{description}</p>}
    </div>
  </div>
);

const inputClass = "w-full bg-[#0d141d] border border-white/10 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-[var(--neon-blue)]/60 transition-colors placeholder-gray-600 text-sm";

export const SettingsModal: FC<SettingsModalProps> = ({ isOpen, onClose, onSettingsUpdated }) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<SettingsTab>('general');

  // API key fields (not stored in config, used to update .env on backend)
  const [nvidiaKey, setNvidiaKey] = useState('');
  const [openrouterKey, setOpenrouterKey] = useState('');
  const [showNvidiaKey, setShowNvidiaKey] = useState(false);
  const [showOpenrouterKey, setShowOpenrouterKey] = useState(false);
  const [keySaving, setKeySaving] = useState(false);

  // Audio
  const [audioInputs, setAudioInputs] = useState<MediaDeviceInfo[]>([]);
  const [audioOutputs, setAudioOutputs] = useState<MediaDeviceInfo[]>([]);
  const [selectedInput, setSelectedInput] = useState('default');
  const [selectedOutput, setSelectedOutput] = useState('default');
  const [audioLoading, setAudioLoading] = useState(false);

  // Theme
  const { themeName, changeTheme } = useTheme();

  useEffect(() => {
    if (isOpen) {
      loadSettings();
      loadAudioDevices();
    }
  }, [isOpen]);

  const loadSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await apiClient.getSettings();
      if (response.success) {
        setSettings(response.settings);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const loadAudioDevices = async () => {
    setAudioLoading(true);
    try {
      // Must request permission before enumerating
      await navigator.mediaDevices.getUserMedia({ audio: true }).then(s => s.getTracks().forEach(t => t.stop())).catch(() => {});
      const devices = await navigator.mediaDevices.enumerateDevices();
      setAudioInputs(devices.filter(d => d.kind === 'audioinput'));
      setAudioOutputs(devices.filter(d => d.kind === 'audiooutput'));

      const savedInput = localStorage.getItem('jarvis-audio-input') || 'default';
      const savedOutput = localStorage.getItem('jarvis-audio-output') || 'default';
      setSelectedInput(savedInput);
      setSelectedOutput(savedOutput);
    } catch (e) {
      console.warn('Audio device enumeration failed:', e);
    } finally {
      setAudioLoading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.updateSettings(settings);
      if (response.success) {
        setSuccess('Configuration saved successfully');
        if (onSettingsUpdated) onSettingsUpdated(response.settings);
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleSaveApiKeys = async () => {
    if (!nvidiaKey && !openrouterKey) {
      setError('Please enter at least one API key');
      return;
    }
    setKeySaving(true);
    setError(null);
    try {
      const body: any = {};
      if (nvidiaKey.trim()) body.nvidia_api_key = nvidiaKey.trim();
      if (openrouterKey.trim()) body.openrouter_api_key = openrouterKey.trim();

      const response = await fetch('http://localhost:8000/api/settings/keys', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body)
      });
      const data = await response.json();
      if (data.success) {
        setSuccess('API keys updated. Restart backend to apply.');
        setNvidiaKey('');
        setOpenrouterKey('');
        setTimeout(() => setSuccess(null), 5000);
      } else {
        setError(data.detail || 'Failed to update API keys');
      }
    } catch (err: any) {
      setError('Backend unreachable. Keys not saved.');
    } finally {
      setKeySaving(false);
    }
  };

  const handleSaveAudio = () => {
    localStorage.setItem('jarvis-audio-input', selectedInput);
    localStorage.setItem('jarvis-audio-output', selectedOutput);
    // Dispatch custom event so voiceService can react
    window.dispatchEvent(new CustomEvent('jarvis-audio-change', {
      detail: { input: selectedInput, output: selectedOutput }
    }));
    setSuccess('Audio devices saved');
    setTimeout(() => setSuccess(null), 2500);
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({ ...prev, [key]: value }));
  };

  const TABS: { id: SettingsTab; label: string; icon: string }[] = [
    { id: 'general', label: 'General', icon: '⚙️' },
    { id: 'ai', label: 'AI / LLM', icon: '🤖' },
    { id: 'security', label: 'Security', icon: '🔐' },
    { id: 'audio', label: 'Audio', icon: '🎙️' },
    { id: 'appearance', label: 'Theme', icon: '🎨' },
  ];

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-md p-4 overflow-y-auto">
      <div
        className="bg-[#080d14] border border-white/10 rounded-2xl w-full max-w-2xl mx-auto shadow-2xl relative overflow-hidden hud-panel-shadow"
      >
        {/* Top glow line */}
        <div className="absolute top-0 left-0 right-0 h-px neon-glow-line" />

        {/* Header */}
        <div className="p-5 border-b border-white/5 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl border neon-bg-subtle neon-border">
              <svg className="w-5 h-5 neon-text" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div>
              <h2 className="text-lg font-bold tracking-wider uppercase neon-text">System Settings</h2>
              <p className="text-[10px] text-gray-600 tracking-widest uppercase">VIPHACKER100 OS Configuration Panel</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-600 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            aria-label="Close Settings"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tab Nav */}
        <div className="flex border-b border-white/5 bg-black/20">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 py-3 text-[11px] font-bold tracking-wider uppercase transition-all flex flex-col items-center gap-1 ${
                activeTab === tab.id
                  ? 'border-b-2 neon-text'
                  : 'text-gray-600 hover:text-gray-400 border-b-2 border-transparent'
              }`}
              style={activeTab === tab.id ? { borderColor: 'var(--neon-blue)' } : {}}
            >
              <span className="text-base">{tab.icon}</span>
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-white/5 border-t-[var(--neon-blue)] rounded-full animate-spin" />
            <p className="text-gray-600 font-mono text-xs uppercase tracking-widest">Accessing core config...</p>
          </div>
        ) : settings ? (
          <div className="p-6 max-h-[55vh] overflow-y-auto custom-settings-scroll">

            {/* ── GENERAL TAB ── */}
            {activeTab === 'general' && (
              <form onSubmit={handleSave} className="space-y-6">
                <SectionHeader>General Configuration</SectionHeader>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <FormRow label="Default Language">
                    <select
                      value={settings.language || 'en'}
                      onChange={(e) => handleChange('language', e.target.value)}
                      className={inputClass}
                      aria-label="Default Language"
                      title="Default Language"
                    >
                      <option value="en">English (US)</option>
                      <option value="hi">Hindi (हिन्दी)</option>
                      <option value="hinglish">Hinglish (Mix)</option>
                    </select>
                  </FormRow>
                  <FormRow label="Confirmation Timeout (sec)" hint="How long to wait before auto-cancelling a dangerous command.">
                    <input
                      type="number"
                      min={5}
                      max={120}
                      value={settings.confirmation_timeout || 30}
                      onChange={(e) => handleChange('confirmation_timeout', parseInt(e.target.value))}
                      className={inputClass}
                      aria-label="Confirmation Timeout in seconds"
                      title="Confirmation Timeout (seconds)"
                    />
                  </FormRow>
                </div>
                <FormRow label="Log Level">
                  <select
                    value={settings.log_level || 'INFO'}
                    onChange={(e) => handleChange('log_level', e.target.value)}
                    className={inputClass}
                    aria-label="Log Level"
                    title="Log Level"
                  >
                    <option value="DEBUG">DEBUG</option>
                    <option value="INFO">INFO</option>
                    <option value="WARNING">WARNING</option>
                    <option value="ERROR">ERROR</option>
                  </select>
                </FormRow>
                <div className="pt-2 flex justify-end">
                  <SaveButton saving={saving} />
                </div>
              </form>
            )}

            {/* ── AI / LLM TAB ── */}
            {activeTab === 'ai' && (
              <form onSubmit={handleSave} className="space-y-6">
                <SectionHeader color="purple">AI Protocol & LLM</SectionHeader>

                <FormRow label="Model Provider">
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: 'nvidia', label: '🟩 NVIDIA NIM' },
                      { id: 'openrouter', label: '🔀 OpenRouter' },
                      { id: 'ollama', label: '🦙 Ollama' }
                    ].map(p => (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => handleChange('llm_provider', p.id)}
                        className={`py-3 px-2 rounded-xl border transition-all text-[10px] font-bold uppercase tracking-widest ${
                          settings.llm_provider === p.id
                            ? 'text-white border-[var(--neon-blue)] bg-[var(--neon-blue)]/10 shadow-[0_0_20px_rgba(var(--neon-rgb),0.2)]'
                            : 'bg-slate-900 border-slate-800 text-slate-500 hover:border-slate-600'
                        }`}
                      >
                        {p.label}
                      </button>
                    ))}
                  </div>
                </FormRow>

                {settings.llm_provider === 'ollama' ? (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <FormRow label="Ollama API URL" hint="Default: http://localhost:11434/api/chat">
                      <input
                        type="text"
                        value={settings.ollama_url || ''}
                        onChange={(e) => handleChange('ollama_url', e.target.value)}
                        className={inputClass + ' font-mono'}
                        placeholder="http://localhost:11434/api/chat"
                        title="Ollama API Endpoint"
                      />
                    </FormRow>
                    <FormRow label="Ollama Model" hint="e.g. llama3, mistral, qwen2">
                      <input
                        type="text"
                        value={settings.ollama_model || ''}
                        onChange={(e) => handleChange('ollama_model', e.target.value)}
                        className={inputClass + ' font-mono'}
                        placeholder="llama3"
                        title="Ollama Model Name"
                      />
                    </FormRow>
                  </div>
                ) : (
                  <FormRow label={settings.llm_provider === 'nvidia' ? "NVIDIA Model ID" : "OpenRouter Model ID"}>
                    <input
                      type="text"
                      value={settings.llm_provider === 'nvidia' ? (settings.nvidia_model || '') : (settings.openrouter_model || '')}
                      onChange={(e) => handleChange(settings.llm_provider === 'nvidia' ? 'nvidia_model' : 'openrouter_model', e.target.value)}
                      placeholder={settings.llm_provider === 'nvidia' ? "e.g. meta/llama-3.1-405b-instruct" : "e.g. google/gemini-2.0-flash-001"}
                      className={inputClass + ' font-mono'}
                      title={settings.llm_provider === 'nvidia' ? "NVIDIA Model Identifier" : "OpenRouter Model Identifier"}
                    />
                  </FormRow>
                )}

                <div className="pt-2 flex justify-end">
                  <SaveButton saving={saving} />
                </div>

                {/* API Keys Sub-section */}
                <div className="border-t border-white/5 pt-6 space-y-4">
                  <h3 className="text-xs font-bold uppercase tracking-[0.3em] text-amber-500/60 mb-4">🔑 API Key Management</h3>
                  <div className="p-3 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[11px] text-amber-400/80 font-mono">
                    ⚠️ Keys are written to the backend .env file. Restart the backend process after saving for changes to take effect.
                  </div>
                  <FormRow label="NVIDIA NIM API Key">
                    <div className="relative">
                      <input
                        type={showNvidiaKey ? 'text' : 'password'}
                        value={nvidiaKey}
                        onChange={e => setNvidiaKey(e.target.value)}
                        placeholder="nvapi-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className={inputClass + ' font-mono pr-12'}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowNvidiaKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs"
                      >
                        {showNvidiaKey ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </FormRow>
                  <FormRow label="OpenRouter API Key">
                    <div className="relative">
                      <input
                        type={showOpenrouterKey ? 'text' : 'password'}
                        value={openrouterKey}
                        onChange={e => setOpenrouterKey(e.target.value)}
                        placeholder="sk-or-v1-xxxxxxxxxxxxxxxxxxxxxxxx"
                        className={inputClass + ' font-mono pr-12'}
                        autoComplete="off"
                      />
                      <button
                        type="button"
                        onClick={() => setShowOpenrouterKey(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-300 transition-colors text-xs"
                      >
                        {showOpenrouterKey ? '🙈' : '👁️'}
                      </button>
                    </div>
                  </FormRow>
                  <div className="flex justify-end">
                    <button
                      type="button"
                      onClick={handleSaveApiKeys}
                      disabled={keySaving}
                      className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all flex items-center gap-2 border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 disabled:opacity-50"
                    >
                      {keySaving ? <><span className="w-4 h-4 border-2 border-amber-400/20 border-t-amber-400 rounded-full animate-spin" /> Saving...</> : '🔑 Update API Keys'}
                    </button>
                  </div>
                </div>
              </form>
            )}

            {/* ── SECURITY TAB ── */}
            {activeTab === 'security' && (
              <form onSubmit={handleSave} className="space-y-5">
                <SectionHeader color="red">Security & Dangerous Commands</SectionHeader>
                <Toggle
                  id="enable_danger"
                  checked={settings.enable_dangerous_commands || false}
                  onChange={(v) => handleChange('enable_dangerous_commands', v)}
                  label="Enable Dangerous Commands"
                  description="Allows system power management, file deletion, and other irreversible actions. Requires confirmation."
                />
                <FormRow label="Confirmation Timeout (seconds)" hint="Countdown before dangerous actions are auto-cancelled.">
                  <input
                    type="number"
                    min={5}
                    max={120}
                    value={settings.confirmation_timeout || 30}
                    onChange={(e) => handleChange('confirmation_timeout', parseInt(e.target.value))}
                    className={inputClass}
                    aria-label="Confirmation Timeout in seconds"
                    title="Confirmation Timeout (seconds)"
                  />
                </FormRow>
                <div className="pt-2 flex justify-end">
                  <SaveButton saving={saving} />
                </div>
              </form>
            )}

            {/* ── AUDIO TAB ── */}
            {activeTab === 'audio' && (
              <div className="space-y-6">
                <SectionHeader color="green">Audio Device Selection</SectionHeader>
                {audioLoading ? (
                  <div className="flex items-center gap-3 text-gray-500 text-sm py-4">
                    <div className="w-5 h-5 border-2 border-gray-600 border-t-[var(--neon-blue)] rounded-full animate-spin" />
                    Enumerating audio devices...
                  </div>
                ) : (
                  <>
                    <div className="p-3 bg-blue-500/5 border border-blue-500/15 rounded-lg text-[11px] text-blue-400/70 font-mono">
                      ℹ️ Device selection applies to the browser's Web Speech API and TTS output. Microphone permission must be granted.
                    </div>
                    <FormRow label="🎙️ Microphone Input" hint={`${audioInputs.length} device(s) detected`}>
                      <select
                        value={selectedInput}
                        onChange={e => setSelectedInput(e.target.value)}
                        className={inputClass}
                        aria-label="Microphone Input Device"
                        title="Microphone Input Device"
                      >
                        <option value="default">System Default</option>
                        {audioInputs.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Microphone ${d.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </FormRow>

                    <div className="py-2 border-t border-white/5 mt-4">
                      <SectionHeader color="amber">Passive Activation</SectionHeader>
                      <div className="space-y-4">
                        <Toggle
                          id="wake_word_enabled"
                          checked={settings?.wake_word_enabled || false}
                          onChange={(v) => setSettings({ ...settings, wake_word_enabled: v })}
                          label="Passive Monitoring (Wake Word)"
                          description="JARVIS will silently listen for the activation phrase."
                        />
                        {settings?.wake_word_enabled && (
                          <FormRow label="Activation Phrase" hint="The word that triggers JARVIS to start listening.">
                            <input
                              type="text"
                              value={settings.wake_word_phrase || 'jarvis'}
                              onChange={(e) => setSettings({ ...settings, wake_word_phrase: e.target.value.toLowerCase() })}
                              className={inputClass}
                              placeholder="e.g. jarvis, hey jarvis"
                              title="Wake Word Phrase"
                            />
                          </FormRow>
                        )}
                      </div>
                    </div>
                    <FormRow label="🔊 Audio Output / Speaker" hint={`${audioOutputs.length} device(s) detected`}>
                      <select
                        value={selectedOutput}
                        onChange={e => setSelectedOutput(e.target.value)}
                        className={inputClass}
                        aria-label="Audio Output Device"
                        title="Audio Output Device"
                      >
                        <option value="default">System Default</option>
                        {audioOutputs.map(d => (
                          <option key={d.deviceId} value={d.deviceId}>
                            {d.label || `Speaker ${d.deviceId.slice(0, 8)}`}
                          </option>
                        ))}
                      </select>
                    </FormRow>
                    <div className="flex justify-end">
                      <button
                        type="button"
                        onClick={handleSaveAudio}
                        className="px-6 py-2.5 rounded-lg text-sm font-bold transition-all border text-white"
                        style={{ background: `rgba(var(--neon-rgb), 0.15)`, borderColor: `rgba(var(--neon-rgb), 0.4)`, color: 'var(--neon-blue)' }}
                      >
                        💾 Save Audio Devices
                      </button>
                    </div>
                  </>
                )}
              </div>
            )}

            {/* ── APPEARANCE / THEME TAB ── */}
            {activeTab === 'appearance' && (
              <div className="space-y-6">
                <SectionHeader color="purple">UI Theme Customization</SectionHeader>
                <p className="text-[12px] text-gray-500 -mt-2">
                  Choose the reactor color that powers your JARVIS interface. Changes apply instantly.
                </p>
                <div className="grid grid-cols-1 gap-3">
                  {THEMES.map(theme => {
                    const isActive = themeName === theme.name;
                    return (
                      <button
                        key={theme.name}
                        type="button"
                        onClick={() => changeTheme(theme.name as ThemeName)}
                        className={`w-full flex items-center gap-4 p-4 rounded-xl border transition-all text-left ${
                          isActive
                            ? 'border-white/25 bg-white/5'
                            : 'border-white/5 bg-white/[0.02] hover:border-white/15 hover:bg-white/[0.04]'
                        }`}
                        style={isActive ? { borderColor: theme.primary + '60', background: theme.primary + '10' } : {}}
                      >
                        {/* Color preview circle */}
                        <div
                          className="w-10 h-10 rounded-full flex-shrink-0 flex items-center justify-center text-xl font-bold shadow-lg transition-all"
                          style={{
                            background: `radial-gradient(circle at 35% 35%, ${theme.accent}, ${theme.primary})`,
                            boxShadow: isActive ? `0 0 20px ${theme.primary}80` : 'none',
                          }}
                        >
                          {isActive ? '✓' : ''}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-bold text-white">{theme.emoji} {theme.label}</span>
                            {isActive && (
                              <span
                                className="text-[9px] px-2 py-0.5 rounded font-bold uppercase tracking-widest"
                                style={{ background: theme.primary + '20', color: theme.primary, border: `1px solid ${theme.primary}40` }}
                              >
                                ACTIVE
                              </span>
                            )}
                          </div>
                          <p className="text-[11px] text-gray-500 mt-0.5 truncate">{theme.description}</p>
                        </div>
                        {/* Gradient swatch */}
                        <div
                          className="w-14 h-8 rounded-md flex-shrink-0 border border-white/5"
                          style={{ background: `linear-gradient(135deg, ${theme.primary}, ${theme.accent})` }}
                        />
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        ) : null}

        {/* Alerts */}
        {(error || success) && (
          <div className="px-6 pb-2">
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-400 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-400 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-4 h-4 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="p-5 border-t border-white/5 flex justify-between items-center bg-black/20">
          <span className="text-[10px] font-mono text-gray-700 uppercase tracking-widest">JARVIS CONFIG v2.2.0</span>
          <button
            type="button"
            onClick={onClose}
            className="px-6 py-2 text-gray-500 hover:text-white transition-colors text-sm font-medium rounded-lg hover:bg-white/5"
          >
            Close
          </button>
        </div>

        {/* Scrollbar style */}
        <style>{`
          .custom-settings-scroll::-webkit-scrollbar { width: 4px; }
          .custom-settings-scroll::-webkit-scrollbar-track { background: transparent; }
          .custom-settings-scroll::-webkit-scrollbar-thumb { background: rgba(var(--neon-rgb), 0.2); border-radius: 4px; }
          .custom-settings-scroll::-webkit-scrollbar-thumb:hover { background: rgba(var(--neon-rgb), 0.4); }
        `}</style>
      </div>
    </div>
  );
};

// Reusable save button
const SaveButton: FC<{ saving: boolean }> = ({ saving }) => (
  <button
    type="submit"
    disabled={saving}
    className="px-8 py-2.5 text-white rounded-xl text-sm font-bold transition-all flex items-center gap-2 disabled:opacity-60"
    style={{
      background: `linear-gradient(135deg, rgba(var(--neon-rgb), 0.8), rgba(var(--accent-rgb), 0.8))`,
      boxShadow: `0 4px 15px rgba(var(--neon-rgb), 0.25)`,
    }}
  >
    {saving ? (
      <>
        <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin" />
        Executing...
      </>
    ) : (
      '💾 Save Configuration'
    )}
  </button>
);
