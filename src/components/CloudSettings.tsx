import { FC, useState, useEffect } from 'react';
import {
  Shield, Eye, EyeOff,
  RefreshCw, CheckCircle, XCircle, Loader2, Sparkles, Server,
} from 'lucide-react';
import { useNotifications } from '../context/NotificationContext';
import {
  useApiKeyStatus, useUpdateApiKeys, useTestApiKey,
} from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Badge } from './ui/Badge';
import type { ApiKeyStatus } from '../types/api';

const PROVIDER_META: Record<string, { label: string; icon: string; color: string }> = {
  NVIDIA_API_KEY: { label: 'NVIDIA', icon: '🔮', color: 'text-emerald-400' },
  OPENROUTER_API_KEY: { label: 'OpenRouter', icon: '⚡', color: 'text-amber-400' },
  BACKEND_API_KEY: { label: 'Backend', icon: '🖥️', color: 'text-blue-400' },
};

const PROVIDER_KEYS = ['NVIDIA_API_KEY', 'OPENROUTER_API_KEY', 'BACKEND_API_KEY'] as const;

interface CloudSettingsProps {
  isOpen: boolean;
  onClose: () => void;
}

export const CloudSettingsModal: FC<CloudSettingsProps> = ({ isOpen, onClose }) => {
  const { addNotification } = useNotifications();
  const keyStatusQuery = useApiKeyStatus();
  const updateKeysMutation = useUpdateApiKeys();
  const testKeyMutation = useTestApiKey();

  const [editedKeys, setEditedKeys] = useState<Record<string, string>>({});
  const [visibleKeys, setVisibleKeys] = useState<Record<string, boolean>>({});
  const [testResults, setTestResults] = useState<Record<string, { valid: boolean; message: string } | null>>({});

  const keys: ApiKeyStatus = keyStatusQuery.data?.keys ?? {
    NVIDIA_API_KEY: null, OPENROUTER_API_KEY: null, BACKEND_API_KEY: null,
  };

  // Initialize edited keys when modal opens or data loads
  useEffect(() => {
    if (isOpen && keyStatusQuery.data) {
      const init: Record<string, string> = {};
      for (const k of PROVIDER_KEYS) {
        init[k] = keys[k as keyof typeof keys] ?? '';
      }
      setEditedKeys(init);
      setTestResults({});
    }
  }, [isOpen, keyStatusQuery.data]);

  const handleSave = async () => {
    const payload: Record<string, string> = {};
    for (const k of PROVIDER_KEYS) {
      const editedVal = editedKeys[k];
      const currentVal = keys[k as keyof typeof keys] ?? '';
      if (editedVal && editedVal !== currentVal) {
        if (k === 'NVIDIA_API_KEY') payload.nvidia_api_key = editedVal;
        else if (k === 'OPENROUTER_API_KEY') payload.openrouter_api_key = editedVal;
        else if (k === 'BACKEND_API_KEY') payload.backend_api_key = editedVal;
      }
    }
    if (Object.keys(payload).length === 0) {
      addNotification({ type: 'info', title: 'No Changes', message: 'No keys were modified', duration: 2000 });
      return;
    }
    try {
      await updateKeysMutation.mutateAsync(payload as any);
      addNotification({ type: 'success', title: 'Keys Updated', message: 'API keys saved successfully', duration: 3000 });
      keyStatusQuery.refetch();
    } catch {
      addNotification({ type: 'error', title: 'Save Failed', message: 'Could not update API keys', duration: 4000 });
    }
  };

  const handleTest = async (providerKey: string) => {
    const keyValue = editedKeys[providerKey] || keys[providerKey as keyof typeof keys];
    if (!keyValue) {
      setTestResults(prev => ({ ...prev, [providerKey]: { valid: false, message: 'No key provided' } }));
      return;
    }
    try {
      const res = await testKeyMutation.mutateAsync({
        provider: providerKey.toLowerCase().replace('_api_key', ''),
        apiKey: keyValue,
      });
      setTestResults(prev => ({ ...prev, [providerKey]: { valid: res.valid, message: res.message } }));
    } catch {
      setTestResults(prev => ({ ...prev, [providerKey]: { valid: false, message: 'Test failed (network error)' } }));
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="CLOUD_SETTINGS // API KEY MANAGER" size="md">
      <div className="space-y-5">
        <div className="flex items-center gap-3 px-1">
          <Server className="w-5 h-5 text-accent" />
          <span className="text-xs font-mono text-foreground-muted">
            Manage and test third-party API keys for LLM providers and backend services.
          </span>
        </div>

        {keyStatusQuery.isLoading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-accent/50" />
          </div>
        ) : (
          <div className="space-y-4">
            {PROVIDER_KEYS.map((providerKey) => {
              const meta = PROVIDER_META[providerKey];
              const currentVal = keys[providerKey as keyof typeof keys] ?? '';
              const editVal = editedKeys[providerKey] ?? currentVal;
              const isVisible = visibleKeys[providerKey];
              const testResult = testResults[providerKey];

              return (
                <div key={providerKey} className="p-4 bg-background-deep/40 border border-border-default rounded-xl space-y-3">
                  <div className="flex items-center gap-3">
                    <span className="text-xl">{meta.icon}</span>
                    <div>
                      <h4 className="text-sm font-bold text-foreground">{meta.label} API Key</h4>
                      <p className="text-[9px] font-mono text-foreground-muted">
                        {currentVal
                          ? `Set: ${currentVal.slice(0, 8)}...${currentVal.slice(-4)}`
                          : 'Not configured'}
                      </p>
                    </div>
                    <div className="ml-auto">
                      {currentVal ? (
                        <Badge variant="success" className="text-[8px]">SET</Badge>
                      ) : (
                        <Badge variant="warning" className="text-[8px]">MISSING</Badge>
                      )}
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="relative flex-1">
                      <input
                        type={isVisible ? 'text' : 'password'}
                        value={editVal}
                        onChange={e => setEditedKeys(prev => ({ ...prev, [providerKey]: e.target.value }))}
                        placeholder={`Enter ${meta.label} API key...`}
                        className="w-full bg-background-deep border border-border-default rounded-lg px-3 py-2 pr-10 text-xs font-mono text-foreground placeholder:text-foreground-muted/40 focus:border-accent/50 outline-none transition-colors"
                      />
                      <button
                        onClick={() => setVisibleKeys(prev => ({ ...prev, [providerKey]: !prev[providerKey] }))}
                        className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-foreground-muted hover:text-foreground transition-colors"
                        title={isVisible ? 'Hide key' : 'Show key'}
                        aria-label={isVisible ? 'Hide API key' : 'Show API key'}
                      >
                        {isVisible ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                      </button>
                    </div>
                    <button
                      onClick={() => handleTest(providerKey)}
                      disabled={testKeyMutation.isPending}
                      className="p-2 bg-accent/10 hover:bg-accent/20 border border-accent/30 rounded-lg transition-colors"
                      title={`Test ${meta.label} key`}
                      aria-label={`Test ${meta.label} API key`}
                    >
                      {testKeyMutation.isPending
                        ? <Loader2 className="w-4 h-4 animate-spin text-accent" />
                        : <Sparkles className="w-4 h-4 text-accent" />}
                    </button>
                  </div>

                  {testResult && (
                    <div className={`flex items-center gap-2 px-3 py-2 rounded-lg text-[10px] font-mono ${
                      testResult.valid
                        ? 'bg-success/5 border border-success/20 text-success'
                        : 'bg-danger/5 border border-danger/20 text-danger'
                    }`}>
                      {testResult.valid
                        ? <CheckCircle className="w-3.5 h-3.5 shrink-0" />
                        : <XCircle className="w-3.5 h-3.5 shrink-0" />}
                      {testResult.message}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}

        <div className="flex items-center gap-3 pt-2">
          <Button onClick={handleSave} isLoading={updateKeysMutation.isPending} className="flex-1">
            <Shield className="w-4 h-4 mr-2" /> Save Keys
          </Button>
          <Button onClick={() => keyStatusQuery.refetch()} variant="ghost" disabled={keyStatusQuery.isFetching}>
            <RefreshCw className={`w-3.5 h-3.5 ${keyStatusQuery.isFetching ? 'animate-spin' : ''}`} />
          </Button>
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-border-subtle text-[8px] font-mono text-foreground-muted/50">
          <span>Keys stored encrypted at rest</span>
          <span>Changes apply immediately</span>
        </div>
      </div>
    </Modal>
  );
};
