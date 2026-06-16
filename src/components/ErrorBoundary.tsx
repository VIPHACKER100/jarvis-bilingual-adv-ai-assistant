import { Component, ErrorInfo, ReactNode } from 'react';
import { AlertTriangle, RefreshCw } from 'lucide-react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false,
  };

  public static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-background-deep">
          <div className="w-full max-w-md glass-panel--high border border-danger/30 p-8 text-center">
            <div className="w-14 h-14 rounded-full bg-danger-soft flex items-center justify-center border border-danger/20 mx-auto mb-6">
              <AlertTriangle className="w-7 h-7 text-danger" />
            </div>

            <h1 className="text-xl font-bold text-foreground mb-2">
              System Malfunction
            </h1>

            <p className="text-sm text-foreground-muted leading-relaxed mb-6">
              JARVIS has encountered an unexpected internal error. The core diagnostic unit has been notified.
            </p>

            <div className="bg-background-deep border border-border-default rounded-lg p-4 mb-8 max-h-32 overflow-auto">
              <code className="text-xs font-mono text-danger">
                {this.state.error?.message || 'Unknown Runtime Error'}
              </code>
            </div>

            <button
              onClick={() => window.location.reload()}
              className="inline-flex items-center gap-2 btn btn-danger mx-auto"
            >
              <RefreshCw className="w-4 h-4" />
              Restart JARVIS
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
