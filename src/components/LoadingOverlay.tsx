// ==========================================================================
// JARVIS v4.0 — COMP-11: LoadingOverlay
// Full-screen or container overlay with spinner
// ==========================================================================



interface LoadingOverlayProps {
  visible: boolean;
  message?: string;
  fullScreen?: boolean;
}

export function LoadingOverlay({ visible, message, fullScreen = false }: LoadingOverlayProps) {
  if (!visible) return null;

  const content = (
    <div className="flex flex-col items-center justify-center gap-3">
      {/* Spinner */}
      <div className="relative w-12 h-12">
        <div className="absolute inset-0 border-2 border-cyan-900/30 rounded-full" />
        <div className="absolute inset-0 border-2 border-t-cyan-400 rounded-full animate-spin" />
      </div>
      {message && (
        <p className="text-sm font-mono text-cyan-300 animate-pulse-core">{message}</p>
      )}
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-50 flex items-center justify-center bg-cyber-dark/80 backdrop-blur-sm">
        {content}
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-[100px] glass-panel rounded-xl">
      {content}
    </div>
  );
}
