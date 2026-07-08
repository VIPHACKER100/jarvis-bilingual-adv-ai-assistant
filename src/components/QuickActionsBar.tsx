// ==========================================================================
// JARVIS v4.0 — COMP-15: QuickActionsBar
// Horizontal row of icon buttons for common actions
// ==========================================================================

import { Volume2, VolumeX, Camera, RefreshCw, Monitor, Volume1 } from 'lucide-react';

export type QuickActionKey =
  | 'volume_up'
  | 'volume_down'
  | 'mute'
  | 'screenshot'
  | 'refresh_status'
  | 'open_analytics';

interface QuickActionsBarProps {
  onAction: (actionKey: QuickActionKey) => void;
  disabled?: boolean;
}

const actions: Array<{
  key: QuickActionKey;
  icon: React.ReactNode;
  label: string;
}> = [
  { key: 'volume_up', icon: <Volume2 className="w-4 h-4" />, label: 'Volume Up' },
  { key: 'volume_down', icon: <Volume1 className="w-4 h-4" />, label: 'Volume Down' },
  { key: 'mute', icon: <VolumeX className="w-4 h-4" />, label: 'Mute/Unmute' },
  { key: 'screenshot', icon: <Camera className="w-4 h-4" />, label: 'Take Screenshot' },
  { key: 'refresh_status', icon: <RefreshCw className="w-4 h-4" />, label: 'Refresh Status' },
  { key: 'open_analytics', icon: <Monitor className="w-4 h-4" />, label: 'Analytics Dashboard' },
];

export function QuickActionsBar({ onAction, disabled = false }: QuickActionsBarProps) {
  return (
    <div className="flex items-center gap-2 p-2 glass-panel rounded-lg overflow-x-auto">
      {actions.map((action) => (
        <button
          key={action.key}
          onClick={() => onAction(action.key)}
          disabled={disabled}
          title={action.label}
          aria-label={action.label}
          className="flex items-center justify-center p-2.5 glass-button !rounded-lg !p-2 transition-all duration-200 disabled:opacity-40 disabled:cursor-not-allowed hover:scale-105"
        >
          {action.icon}
        </button>
      ))}
    </div>
  );
}
