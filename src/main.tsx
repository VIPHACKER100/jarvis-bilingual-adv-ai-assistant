/**
 * JARVIS Frontend Entry Point
 *
 * Sets up:
 * - React 19 createRoot
 * - QueryClientProvider (TanStack Query)
 * - BrowserRouter (React Router)
 * - Error boundary
 * - Global styles (Design System V3)
 */

import { StrictMode, Suspense } from 'react';
import { createRoot } from 'react-dom/client';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { BrowserRouter } from 'react-router-dom';
import App from './App';
import './index.css';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 3,
      refetchOnWindowFocus: false,
      staleTime: 5000,
      retryDelay: (attemptIndex) => Math.min(1000 * 2 ** attemptIndex, 10000),
    },
  },
});

function Root() {
  return (
    <StrictMode>
      <QueryClientProvider client={queryClient}>
        <BrowserRouter>
          <Suspense fallback={
            <div className="flex h-screen w-screen items-center justify-center bg-cyber-dark">
              <div className="animate-pulse-core text-cyan-400 font-display text-2xl">
                INITIALIZING NEURAL CORE...
              </div>
            </div>
          }>
            <App />
          </Suspense>
        </BrowserRouter>
      </QueryClientProvider>
    </StrictMode>
  );
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

createRoot(rootElement).render(<Root />);
