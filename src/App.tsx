import { Component, type ReactNode } from 'react';
import { AppShell } from '@/components/layout/AppShell';

interface EBProps { children: ReactNode }
interface EBState { hasError: boolean; error: Error | null }
class ErrorBoundary extends Component<EBProps, EBState> {
  state: EBState = { hasError: false, error: null };
  static getDerivedStateFromError(error: Error) { return { hasError: true, error }; }
  render() {
    if (this.state.hasError) {
      return (
        <div className="flex h-screen w-screen flex-col items-center justify-center bg-cyber-dark gap-4 p-8">
          <h1 className="neon-text-pink text-3xl">SYSTEM MALFUNCTION</h1>
          <div className="text-slate-400 text-sm max-w-md text-center font-mono">{this.state.error?.message ?? 'Unexpected error'}</div>
          <button title="Reload" aria-label="Reload" className="glass-button-primary mt-4" onClick={() => window.location.reload()}>REBOOT</button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  return (
    <ErrorBoundary>
      <AppShell />
    </ErrorBoundary>
  );
}
