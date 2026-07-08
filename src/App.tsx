// ==========================================================================
// JARVIS v4.0 — App Entry with React Router
// ==========================================================================

import React, { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { ErrorBoundary } from './components/ErrorBoundary';
import { authService } from './services/auth';
import { useStore } from './store';
import { healthApi } from './api/health';

// Lazy-loaded pages for code-splitting
const HomePage = lazy(() =>
  import('./pages/Home').then((m) => ({ default: m.HomePage })),
);
const SettingsPage = lazy(() =>
  import('./pages/Settings').then((m) => ({ default: m.SettingsPage })),
);
const AnalyticsPage = lazy(() =>
  import('./pages/Analytics').then((m) => ({ default: m.AnalyticsPage })),
);

function PageLoader() {
  return (
    <div className="min-h-screen bg-cyber-dark flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="relative w-16 h-16">
          <div className="absolute inset-0 border-2 border-cyan-900/30 rounded-full" />
          <div className="absolute inset-0 border-2 border-t-cyan-400 rounded-full animate-spin" />
        </div>
        <p className="font-mono text-sm text-cyan-400 animate-pulse-core">Initializing J.A.R.V.I.S.</p>
      </div>
    </div>
  );
}

function AuthInitializer({ children }: { children: React.ReactNode }) {
  const { setApiKey, setAuthenticated, setCheckingAuth } = useStore();

  useEffect(() => {
    const init = async () => {
      setCheckingAuth(true);
      const key = authService.getApiKey();
      if (key) {
        setApiKey(key);
        // Verify the key works
        try {
          await healthApi.getHealth();
          setAuthenticated(true);
        } catch {
          // Key might be invalid — try with the key header
          try {
            const { systemApi } = await import('./api/system');
            await systemApi.getStatus();
            setAuthenticated(true);
          } catch {
            // Key is likely invalid
            authService.clearApiKey();
            setApiKey(null);
            setAuthenticated(false);
          }
        }
      } else {
        setAuthenticated(false);
      }
      setCheckingAuth(false);
    };
    init();
  }, [setApiKey, setAuthenticated, setCheckingAuth]);

  return <>{children}</>;
}

export default function App() {
  return (
    <BrowserRouter>
      <ErrorBoundary>
        <AuthInitializer>
          <Suspense fallback={<PageLoader />}>
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/analytics" element={<AnalyticsPage />} />
            </Routes>
          </Suspense>
        </AuthInitializer>
      </ErrorBoundary>
    </BrowserRouter>
  );
}
