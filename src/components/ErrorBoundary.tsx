import React, { Component, ErrorInfo, ReactNode } from 'react';

interface Props {
  children?: ReactNode;
}

interface State {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<Props, State> {
  public state: State = {
    hasError: false
  };

  public static getDerivedStateFromError(error: Error): State {
    // Update state so the next render will show the fallback UI.
    return { hasError: true, error };
  }

  public componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    console.error('Uncaught error:', error, errorInfo);
  }

  public render() {
    if (this.state.hasError) {
      return (
        <div className="fixed inset-0 flex items-center justify-center p-4 bg-[#0a0f16] text-white z-[9999]" id="error-boundary-shield">
          <div className="max-w-md w-full border border-red-500/30 bg-red-500/5 p-8 rounded-xl backdrop-blur-md shadow-2xl shadow-red-500/10">
            <div className="flex items-center gap-3 mb-6">
              <div className="p-2 bg-red-500/20 rounded-lg">
                <svg className="w-6 h-6 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
              <h1 className="text-xl font-bold tracking-tight text-red-400">System Malfunction</h1>
            </div>
            
            <p className="text-gray-400 mb-6 leading-relaxed">
              JARVIS has encountered an unexpected internal error. The core diagnostic unit has been notified.
            </p>
            
            <div className="bg-black/50 p-4 rounded-lg font-mono text-sm text-red-300 border border-red-900/50 mb-8 overflow-auto max-h-40">
              {this.state.error?.message || "Unknown Runtime Error"}
            </div>

            <button
              id="reset-jarvis-btn"
              onClick={() => window.location.reload()}
              className="w-full py-3 px-6 bg-red-600 hover:bg-red-700 active:scale-95 transition-all rounded-lg font-medium text-white shadow-lg shadow-red-600/20"
            >
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
