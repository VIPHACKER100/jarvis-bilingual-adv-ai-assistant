import { FC, useState, useEffect } from 'react';
import { apiClient } from '../services/apiClient';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSettingsUpdated?: (settings: any) => void;
}

export const SettingsModal: FC<SettingsModalProps> = ({
  isOpen,
  onClose,
  onSettingsUpdated
}) => {
  const [settings, setSettings] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadSettings();
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

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await apiClient.updateSettings(settings);
      if (response.success) {
        setSuccess('Settings updated successfully');
        if (onSettingsUpdated) {
          onSettingsUpdated(response.settings);
        }
        setTimeout(() => setSuccess(null), 3000);
      }
    } catch (err: any) {
      setError(err.message || 'Failed to update settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (key: string, value: any) => {
    setSettings((prev: any) => ({
      ...prev,
      [key]: value
    }));
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md p-4 overflow-y-auto">
      <div className="bg-[#0a0f16] border border-cyan-500/30 rounded-xl w-full max-w-2xl mx-auto shadow-2xl shadow-cyan-500/10 relative overflow-hidden">
        {/* Glow Effect */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-1 bg-cyan-500/50 blur-sm shadow-[0_0_15px_rgba(6,182,212,0.5)]"></div>
        
        {/* Header */}
        <div className="p-6 border-b border-cyan-500/10 flex justify-between items-center bg-cyan-500/5">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-cyan-500/10 rounded-lg border border-cyan-500/30">
              <svg className="w-5 h-5 text-cyan-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <h2 className="text-xl font-bold tracking-wider text-cyan-400 uppercase">System Settings</h2>
          </div>
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-white transition-colors p-2 hover:bg-white/5 rounded-full"
            title="Close Settings"
            aria-label="Close Settings"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="p-20 flex flex-col items-center justify-center gap-4">
            <div className="w-12 h-12 border-4 border-cyan-500/20 border-t-cyan-500 rounded-full animate-spin"></div>
            <p className="text-cyan-500/50 font-mono text-sm uppercase tracking-widest">Accessing core config...</p>
          </div>
        ) : settings ? (
          <form onSubmit={handleSave} className="p-6 space-y-8">
            {/* General Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-cyan-500/50 uppercase tracking-[0.3em] border-b border-cyan-500/10 pb-2">General Configuration</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <label htmlFor="settings-language" className="text-sm text-gray-400 block ml-1">Default Language</label>
                  <select 
                    id="settings-language"
                    value={settings.language || 'en'}
                    onChange={(e) => handleChange('language', e.target.value)}
                    className="w-full bg-[#0d141d] border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  >
                    <option value="en">English (US)</option>
                    <option value="hi">Hindi (हिन्दी)</option>
                    <option value="hinglish">Hinglish (Hindi with Latin script)</option>
                  </select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="settings-timeout" className="text-sm text-gray-400 block ml-1">Confirmation Timeout (Seconds)</label>
                  <input 
                    id="settings-timeout"
                    type="number"
                    value={settings.confirmation_timeout || 30}
                    onChange={(e) => handleChange('confirmation_timeout', parseInt(e.target.value))}
                    className="w-full bg-[#0d141d] border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3 p-3 bg-cyan-500/5 border border-cyan-500/10 rounded-lg">
                <input 
                  type="checkbox"
                  id="enable_danger"
                  checked={settings.enable_dangerous_commands || false}
                  onChange={(e) => handleChange('enable_dangerous_commands', e.target.checked)}
                  className="w-4 h-4 rounded border-cyan-500/30 text-cyan-600 focus:ring-cyan-500 bg-black"
                />
                <label htmlFor="enable_danger" className="text-sm text-gray-300 cursor-pointer select-none">
                  Enable Dangerous Commands (System Power, File Deletion)
                </label>
              </div>
            </section>

            {/* AI Model Section */}
            <section className="space-y-4">
              <h3 className="text-xs font-bold text-purple-500/50 uppercase tracking-[0.3em] border-b border-purple-500/10 pb-2">AI Protocol & LLM</h3>
              
              <div className="space-y-2">
                <label className="text-sm text-gray-400 block ml-1">Model Provider</label>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => handleChange('llm_provider', 'nvidia')}
                    className={`py-2 px-4 rounded-lg border transition-all text-sm font-medium ${settings.llm_provider === 'nvidia' 
                      ? 'bg-green-500/10 border-green-500/50 text-green-400' 
                      : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    NVIDIA NIM
                  </button>
                  <button
                    type="button"
                    onClick={() => handleChange('llm_provider', 'openrouter')}
                    className={`py-2 px-4 rounded-lg border transition-all text-sm font-medium ${settings.llm_provider === 'openrouter' 
                      ? 'bg-purple-500/10 border-purple-500/50 text-purple-400' 
                      : 'bg-slate-900 border-slate-700 text-slate-500'}`}
                  >
                    OpenRouter
                  </button>
                </div>
              </div>

              <div className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-mono uppercase tracking-widest block ml-1">NVIDIA Model ID</label>
                  <input 
                    type="text"
                    value={settings.nvidia_model || ''}
                    onChange={(e) => handleChange('nvidia_model', e.target.value)}
                    placeholder="e.g. meta/llama-3.1-405b-instruct"
                    className="w-full bg-[#0d141d] border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-gray-500 font-mono uppercase tracking-widest block ml-1">OpenRouter Model ID</label>
                  <input 
                    type="text"
                    value={settings.openrouter_model || ''}
                    onChange={(e) => handleChange('openrouter_model', e.target.value)}
                    placeholder="e.g. google/gemini-2.0-flash-exp:free"
                    className="w-full bg-[#0d141d] border border-cyan-500/20 rounded-lg px-4 py-2.5 text-white font-mono text-sm focus:outline-none focus:border-cyan-500/50 transition-colors"
                  />
                </div>
              </div>
            </section>

            {/* Error/Success Messages */}
            {error && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 text-red-500 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                {error}
              </div>
            )}
            
            {success && (
              <div className="p-3 bg-green-500/10 border border-green-500/30 text-green-500 rounded-lg text-sm flex items-center gap-2">
                <svg className="w-5 h-5 flex-shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                {success}
              </div>
            )}

            {/* Footer Buttons */}
            <div className="flex justify-end gap-3 pt-4 border-t border-cyan-500/10">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors text-sm font-medium"
              >
                Close
              </button>
              <button
                type="submit"
                disabled={saving}
                className={`px-8 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-lg text-sm font-bold transition-all shadow-lg shadow-cyan-600/20 flex items-center gap-2 ${saving ? 'opacity-70 cursor-not-allowed' : ''}`}
              >
                {saving ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/20 border-t-white rounded-full animate-spin"></div>
                    Executing...
                  </>
                ) : 'Save Configuration'}
              </button>
            </div>
          </form>
        ) : null}
      </div>
    </div>
  );
};
