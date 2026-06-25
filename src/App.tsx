/**
 * JARVIS App Root
 *
 * Provides:
 * - ErrorBoundary for catching render errors
 * - Router outlet via AppShell
 * - NotificationCenter for toast notifications
 * - WebSocket connection (auto-started)
 */

import { Component, lazy, Suspense, type ReactNode, type ComponentType, useEffect } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { AppShell } from '@/components/layout/AppShell';
import { NotificationCenter } from '@/components/ui/NotificationCenter';
import { websocketService } from '@/services/websocketService';

// ============================================================================
// Lazy Page Loader — resolves named exports
// ============================================================================

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function lazyPage(importFn: () => Promise<any>) {
  return lazy(async () => {
    const mod = await importFn();
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const Component: ComponentType<any> = mod.default ?? Object.values(mod).find(
      (v: unknown): v is ComponentType => typeof v === 'function'
    );
    if (!Component) {
      throw new Error('lazyPage: no component found in module — expected a default or named function export');
    }
    return { default: Component };
  });
}

const Loader = ({ text }: { text?: string }) => (
  <div role="status" aria-live="polite" className="flex h-full w-full items-center justify-center">
    <div className="animate-pulse-core text-cyan-400 font-display text-lg">
      {text ?? 'LOADING...'}
    </div>
  </div>
);

const NeuralHUD = lazyPage(() => import('@/pages/NeuralHUD'));
const SettingsPage = lazyPage(() => import('@/pages/SettingsPage'));
const AuditTimeline = lazyPage(() => import('@/pages/AuditTimeline'));
const DeviceSyncHub = lazyPage(() => import('@/pages/DeviceSyncHub'));
const AutomationDashboard = lazyPage(() => import('@/pages/AutomationDashboard'));
const FileManager = lazyPage(() => import('@/pages/FileManager'));
const WindowManager = lazyPage(() => import('@/pages/WindowManager'));
const SecurityDashboard = lazyPage(() => import('@/pages/SecurityDashboard'));
const WhatsAppControl = lazyPage(() => import('@/pages/WhatsAppControl'));
const RemoteDesktop = lazyPage(() => import('@/pages/RemoteDesktop'));
const InputSimulator = lazyPage(() => import('@/pages/InputSimulator'));
const MediaTools = lazyPage(() => import('@/pages/MediaTools'));
const NeuralTraining = lazyPage(() => import('@/pages/NeuralTraining'));
const AboutPage = lazyPage(() => import('@/pages/AboutPage'));

// ============================================================================
// Error Boundary
// ============================================================================

interface ErrorBoundaryProps {
  children: ReactNode;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
}

class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: React.ErrorInfo): void {
    console.error('[ErrorBoundary] Caught error:', error, info);
  }

  render(): ReactNode {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-cyber-dark gap-4 p-8">
          <h1 className="neon-text-pink text-3xl">SYSTEM MALFUNCTION</h1>
          <div className="text-slate-400 text-sm max-w-md text-center font-mono">
            {this.state.error?.message ?? 'An unexpected error occurred'}
          </div>
          <button
            title="Reload application"
            aria-label="Reload application"
            className="glass-button-primary mt-4"
            onClick={() => {
              this.setState({ hasError: false, error: null });
              window.location.reload();
            }}
          >
            REBOOT
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

// ============================================================================
// App Root Component
// ============================================================================

export default function App() {
  // Auto-connect WebSocket on app mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    websocketService.connect();
    return () => {
      websocketService.disconnect();
    };
  }, []);

  return (
    <ErrorBoundary>
      <Routes>
        <Route path="/" element={<AppShell />}>
          <Route index element={<Navigate to="/hud" replace />} />
          <Route path="hud" element={<Suspense fallback={<Loader text="LOADING HUD..." />}><NeuralHUD /></Suspense>} />
          <Route path="settings" element={<Suspense fallback={<Loader text="LOADING CONFIG..." />}><SettingsPage /></Suspense>} />
          <Route path="timeline" element={<Suspense fallback={<Loader text="LOADING TIMELINE..." />}><AuditTimeline /></Suspense>} />
          <Route path="sync" element={<Suspense fallback={<Loader text="LOADING SYNC..." />}><DeviceSyncHub /></Suspense>} />
          <Route path="automation" element={<Suspense fallback={<Loader text="LOADING AUTOMATION..." />}><AutomationDashboard /></Suspense>} />
          <Route path="files" element={<Suspense fallback={<Loader text="LOADING FILES..." />}><FileManager /></Suspense>} />
          <Route path="windows" element={<Suspense fallback={<Loader text="LOADING WINDOWS..." />}><WindowManager /></Suspense>} />
          <Route path="security" element={<Suspense fallback={<Loader text="LOADING SECURITY..." />}><SecurityDashboard /></Suspense>} />
          <Route path="whatsapp" element={<Suspense fallback={<Loader text="LOADING WHATSAPP..." />}><WhatsAppControl /></Suspense>} />
          <Route path="desktop" element={<Suspense fallback={<Loader text="LOADING DESKTOP..." />}><RemoteDesktop /></Suspense>} />
          <Route path="input" element={<Suspense fallback={<Loader text="LOADING INPUT..." />}><InputSimulator /></Suspense>} />
          <Route path="media-tools" element={<Suspense fallback={<Loader text="LOADING MEDIA TOOLS..." />}><MediaTools /></Suspense>} />
          <Route path="training" element={<Suspense fallback={<Loader text="LOADING TRAINING..." />}><NeuralTraining /></Suspense>} />
          <Route path="about" element={<Suspense fallback={<Loader text="LOADING ABOUT..." />}><AboutPage /></Suspense>} />
          <Route path="*" element={<Navigate to="/hud" replace />} />
        </Route>
      </Routes>
      <NotificationCenter />
    </ErrorBoundary>
  );
}
