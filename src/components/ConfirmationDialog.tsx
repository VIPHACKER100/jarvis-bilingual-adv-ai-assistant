// ==========================================================================
// JARVIS v4.0 — COMP-5: ConfirmationDialog
// Modal for dangerous commands with countdown timer
// ==========================================================================

import { useState, useEffect, useRef } from 'react';
import { AlertTriangle, Check, X } from 'lucide-react';

interface ConfirmationDialogProps {
  isOpen: boolean;
  command: string;
  details?: string;
  timeout?: number;
  onApprove: () => void;
  onReject: () => void;
  isApproving?: boolean;
  isRejecting?: boolean;
}

export function ConfirmationDialog({
  isOpen,
  command,
  details,
  timeout = 30,
  onApprove,
  onReject,
  isApproving = false,
  isRejecting = false,
}: ConfirmationDialogProps) {
  const [remaining, setRemaining] = useState(timeout);
  const [timedOut, setTimedOut] = useState(false);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  useEffect(() => {
    if (!isOpen) {
      setRemaining(timeout);
      setTimedOut(false);
      return;
    }

    timerRef.current = setInterval(() => {
      setRemaining((prev) => {
        if (prev <= 1) {
          clearInterval(timerRef.current!);
          setTimedOut(true);
          onReject();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
    };
  }, [isOpen, timeout, onReject]);

  const circumference = 2 * Math.PI * 28;
  const offset = circumference - (remaining / timeout) * circumference;

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/70 backdrop-blur-sm" onClick={() => { if (!timedOut) onReject(); }} />

      {/* Dialog */}
      <div className="relative glass-panel-strong rounded-xl border border-rose-800/40 shadow-2xl max-w-md w-full p-6">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 rounded-full bg-rose-900/40">
            <AlertTriangle className="w-6 h-6 text-neon-error" />
          </div>
          <div>
            <h2 className="font-display text-lg font-bold text-slate-200">Confirm Action</h2>
            <p className="text-xs text-slate-400">This command requires confirmation</p>
          </div>
        </div>

        {/* Command Display */}
        <div className="glass-panel rounded-lg p-3 mb-4">
          <p className="font-mono text-sm text-slate-200 break-words">{command}</p>
          {details && <p className="text-xs text-slate-400 mt-2">{details}</p>}
        </div>

        {/* Timer */}
        <div className="flex items-center justify-center mb-4">
          <div className="relative w-16 h-16">
            <svg className="w-16 h-16 -rotate-90" viewBox="0 0 64 64">
              <circle cx="32" cy="32" r="28" fill="none" stroke="rgba(255,255,255,0.1)" strokeWidth="4" />
              <circle
                cx="32"
                cy="32"
                r="28"
                fill="none"
                stroke={timedOut ? '#ff3355' : remaining <= 10 ? '#ffaa00' : '#00d4ff'}
                strokeWidth="4"
                strokeDasharray={circumference}
                strokeDashoffset={offset}
                strokeLinecap="round"
                className="transition-all duration-1000 ease-linear"
              />
            </svg>
            <span className={`absolute inset-0 flex items-center justify-center text-lg font-bold font-mono ${
              timedOut ? 'text-neon-error' : remaining <= 10 ? 'text-neon-warning' : 'text-cyan-300'
            }`}>
              {timedOut ? '!' : remaining}
            </span>
          </div>
        </div>

        {timedOut ? (
          <p className="text-center text-sm text-neon-error font-semibold mb-4">Confirmation timed out</p>
        ) : null}

        {/* Actions */}
        <div className="flex gap-3">
          <button
            onClick={onReject}
            disabled={isRejecting || timedOut}
            title="Reject"
            aria-label="Reject command"
            className="flex-1 flex items-center justify-center gap-2 glass-button glass-button-danger py-2.5 disabled:opacity-40"
          >
            {isRejecting ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <X className="w-4 h-4" />
            )}
            Reject
          </button>
          <button
            onClick={onApprove}
            disabled={isApproving || timedOut}
            title="Approve"
            aria-label="Approve command"
            className="flex-1 flex items-center justify-center gap-2 glass-button glass-button-success py-2.5 disabled:opacity-40"
          >
            {isApproving ? (
              <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" /><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" /></svg>
            ) : (
              <Check className="w-4 h-4" />
            )}
            Approve
          </button>
        </div>
      </div>
    </div>
  );
}
