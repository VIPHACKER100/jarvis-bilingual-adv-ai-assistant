import { FC, useState } from 'react';
import {
  MousePointer2, Keyboard, Type,
  ArrowUp, ArrowDown, Move3d, ScrollText, RotateCcw, Zap,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { apiClient } from '../services/apiClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';

const KEY_NAMES = [
  'Enter', 'Escape', 'Tab', 'Space', 'Backspace', 'Delete',
  'Shift', 'Control', 'Alt', 'CapsLock',
  'F1','F2','F3','F4','F5','F6','F7','F8','F9','F10','F11','F12',
  'ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight',
  'Home', 'End', 'PageUp', 'PageDown',
  'VolumeUp', 'VolumeDown', 'VolumeMute',
  'MediaPlayPause', 'MediaStop', 'MediaNextTrack', 'MediaPrevTrack',
];

const MOUSE_ACTIONS = [
  { label: 'Left Click', value: 'left' as const, icon: MousePointer2 },
  { label: 'Right Click', value: 'right' as const, icon: MousePointer2 },
  { label: 'Middle Click', value: 'middle' as const, icon: MousePointer2 },
];

export const InputSimulator: FC = () => {
  const { showInputSimulator, setShowInputSimulator } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [text, setText] = useState('');
  const [modifiers, setModifiers] = useState<string[]>([]);
  const [cursorX, setCursorX] = useState('500');
  const [cursorY, setCursorY] = useState('500');
  const [scrollAmount, setScrollAmount] = useState('3');
  const [shortcutKeys, setShortcutKeys] = useState<string[]>([]);
  const [dragToX, setDragToX] = useState('800');
  const [dragToY, setDragToY] = useState('600');
  const [activeTab, setActiveTab] = useState<'keyboard' | 'mouse' | 'type' | 'shortcut' | 'scroll'>('keyboard');
  const [commandLoading, setCommandLoading] = useState<string | null>(null);

  const executeWithLoading = async (label: string, fn: () => Promise<any>) => {
    setCommandLoading(label);
    try {
      const res = await fn();
      addNotification({ type: 'success', title: label, message: res?.response || 'Executed', duration: 1000 });
    } catch {
      addNotification({ type: 'error', title: `${label} Failed`, message: 'Could not execute command', duration: 3000 });
    }
    setCommandLoading(null);
  };

  const handleMouseClick = async (button: 'left' | 'right' | 'middle') => {
    await executeWithLoading(`Mouse: ${button}`, () =>
      apiClient.moveCursor(parseInt(cursorX), parseInt(cursorY)).then(() => apiClient.mouseClick(button))
    );
  };

  const handleType = async () => {
    if (!text.trim()) return;
    await executeWithLoading('Type Text', () => apiClient.typeText(text));
  };

  const handleKeyPress = async (keyName: string) => {
    if (modifiers.length > 0) {
      await executeWithLoading(`Shortcut: ${[...modifiers, keyName].join('+')}`,
        () => apiClient.sendShortcut([...modifiers, keyName])
      );
    } else {
      await executeWithLoading(`Key: ${keyName}`, () => apiClient.pressKey(keyName));
    }
  };

  const handleShortcutExecute = async () => {
    if (shortcutKeys.length < 2) return;
    await executeWithLoading(`Shortcut: ${shortcutKeys.join('+')}`,
      () => apiClient.sendShortcut(shortcutKeys)
    );
  };

  const handleScroll = async (direction: 'up' | 'down') => {
    const clicks = direction === 'down' ? parseInt(scrollAmount) : -parseInt(scrollAmount);
    await executeWithLoading(`Scroll ${direction}`, () => apiClient.scrollWheel(clicks));
  };

  const handleDrag = async () => {
    const x = parseInt(dragToX);
    const y = parseInt(dragToY);
    await executeWithLoading('Drag', () => apiClient.dragMouse(x, y));
  };

  const toggleModifier = (m: string) => {
    setModifiers(prev => prev.includes(m) ? prev.filter(x => x !== m) : [...prev, m]);
  };

  const toggleShortcutKey = (k: string) => {
    setShortcutKeys(prev => prev.includes(k) ? prev.filter(x => x !== k) : [...prev, k]);
  };

  if (!showInputSimulator) return null;

  const tabClass = (tab: string) =>
    `px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all border ${
      activeTab === tab
        ? 'bg-accent/15 border-accent/40 text-accent shadow-[0_0_12px_rgba(var(--accent-rgb),0.12)]'
        : 'bg-background-deep border-border-default text-foreground-muted hover:border-accent/30'
    }`;

  const isLoading = (label: string) => commandLoading === label;

  return (
    <Modal isOpen={showInputSimulator} onClose={() => setShowInputSimulator(false)} title="INPUT_SIMULATOR // v4.0" size="lg">
      <div className="flex flex-col gap-4 min-h-[400px]">
        <div className="flex flex-wrap gap-2">
          <button onClick={() => setActiveTab('keyboard')} className={tabClass('keyboard')}><Keyboard className="w-3 h-3 mr-1.5 inline" /> Keys</button>
          <button onClick={() => setActiveTab('mouse')} className={tabClass('mouse')}><MousePointer2 className="w-3 h-3 mr-1.5 inline" /> Mouse</button>
          <button onClick={() => setActiveTab('type')} className={tabClass('type')}><Type className="w-3 h-3 mr-1.5 inline" /> Type</button>
          <button onClick={() => setActiveTab('shortcut')} className={tabClass('shortcut')}><Zap className="w-3 h-3 mr-1.5 inline" /> Shortcuts</button>
          <button onClick={() => setActiveTab('scroll')} className={tabClass('scroll')}><ScrollText className="w-3 h-3 mr-1.5 inline" /> Scroll</button>
        </div>

        {/* Keyboard Tab */}
        {activeTab === 'keyboard' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['Ctrl', 'Shift', 'Alt', 'Win'].map(m => (
                <button key={m} onClick={() => toggleModifier(m)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${
                    modifiers.includes(m)
                      ? 'bg-accent/20 border-accent/40 text-accent'
                      : 'bg-background-deep border-border-default text-foreground-muted hover:border-accent/30'
                  }`}>
                  {m}
                </button>
              ))}
              {modifiers.length > 0 && (
                <button onClick={() => setModifiers([])} className="px-2 py-1.5 text-danger/60 hover:text-danger text-[9px]" title="Clear modifiers" aria-label="Clear modifiers">
                  <RotateCcw className="w-3 h-3" />
                </button>
              )}
            </div>
            {modifiers.length > 0 && (
              <div className="px-3 py-1.5 bg-accent/5 border border-accent/20 rounded-lg text-[10px] font-mono text-accent">
                {modifiers.join(' + ')} + ___ (press key below)
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {KEY_NAMES.map(k => (
                <button key={k} onClick={() => handleKeyPress(k)}
                  disabled={isLoading(`Key: ${k}`) || isLoading(`Shortcut: ${[...modifiers, k].join('+')}`)}
                  className="px-2.5 py-1.5 bg-background-deep border border-border-default rounded-lg text-[9px] font-mono text-foreground-muted hover:border-accent/30 hover:text-accent transition-all disabled:opacity-50">
                  {k}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Mouse Tab */}
        {activeTab === 'mouse' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 flex-wrap">
              <label className="text-[10px] font-mono text-foreground-muted">X:</label>
              <input type="number" value={cursorX} onChange={e => setCursorX(e.target.value)} className="w-20 bg-background-deep border border-border-default rounded-lg px-2 py-1.5 text-xs font-mono text-foreground" />
              <label className="text-[10px] font-mono text-foreground-muted">Y:</label>
              <input type="number" value={cursorY} onChange={e => setCursorY(e.target.value)} className="w-20 bg-background-deep border border-border-default rounded-lg px-2 py-1.5 text-xs font-mono text-foreground" />
            </div>
            <div className="flex gap-3">
              {MOUSE_ACTIONS.map(action => (
                <button key={action.value} onClick={() => handleMouseClick(action.value)}
                  disabled={isLoading(`Mouse: ${action.value}`)}
                  className="flex items-center gap-2 px-4 py-2.5 bg-background-deep border border-border-default rounded-lg text-xs font-mono text-foreground hover:border-accent/30 hover:text-accent transition-all flex-1 justify-center disabled:opacity-50">
                  <action.icon className="w-4 h-4" /> {action.label}
                </button>
              ))}
            </div>
            <div className="p-4 bg-background-deep/40 border border-border-default rounded-lg">
              <h4 className="text-[10px] font-mono text-foreground-muted mb-3 uppercase tracking-widest">Drag</h4>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[9px] font-mono text-foreground-muted">To X</label>
                  <input type="number" value={dragToX} onChange={e => setDragToX(e.target.value)} className="w-full bg-background-deep border border-border-default rounded-lg px-2 py-1.5 text-xs font-mono text-foreground" />
                </div>
                <div>
                  <label className="text-[9px] font-mono text-foreground-muted">To Y</label>
                  <input type="number" value={dragToY} onChange={e => setDragToY(e.target.value)} className="w-full bg-background-deep border border-border-default rounded-lg px-2 py-1.5 text-xs font-mono text-foreground" />
                </div>
              </div>
              <Button onClick={handleDrag} disabled={isLoading('Drag')} isLoading={isLoading('Drag')} variant="secondary" size="sm" className="mt-3 w-full">
                <Move3d className="w-3.5 h-3.5 mr-1.5" /> Execute Drag
              </Button>
            </div>
          </div>
        )}

        {/* Type Tab */}
        {activeTab === 'type' && (
          <div className="space-y-4">
            <textarea value={text} onChange={e => setText(e.target.value)}
              placeholder="Paste or type text to simulate..."
              rows={6}
              className="w-full bg-background-deep border border-border-default rounded-lg p-3 text-sm font-mono text-foreground placeholder:text-foreground-muted/50 focus:border-accent/50 outline-none transition-colors resize-none"
            />
            <Button onClick={handleType} disabled={!text.trim() || isLoading('Type Text')} isLoading={isLoading('Type Text')} className="w-full">
              <Type className="w-4 h-4 mr-2" /> Simulate Typing
            </Button>
          </div>
        )}

        {/* Shortcuts Tab */}
        {activeTab === 'shortcut' && (
          <div className="space-y-4">
            <div className="flex flex-wrap gap-2">
              {['Ctrl', 'Shift', 'Alt', 'Win'].map(m => (
                <button key={m} onClick={() => toggleShortcutKey(m)}
                  className={`px-3 py-1.5 rounded-lg text-[10px] font-mono font-bold uppercase border transition-all ${
                    shortcutKeys.includes(m)
                      ? 'bg-amber-500/20 border-amber-500/40 text-amber-400'
                      : 'bg-background-deep border-border-default text-foreground-muted hover:border-amber-400/30'
                  }`}>
                  {m}
                </button>
              ))}
            </div>
            {shortcutKeys.length > 0 && (
              <div className="px-3 py-1.5 bg-amber-500/5 border border-amber-500/20 rounded-lg text-[10px] font-mono text-amber-400">
                {shortcutKeys.join(' + ')} {shortcutKeys.length < 2 ? '(add more keys)' : ''}
              </div>
            )}
            <div className="flex flex-wrap gap-1.5 max-h-36 overflow-y-auto">
              {KEY_NAMES.filter(k => !['Shift','Control','Alt'].includes(k)).slice(0, 24).map(k => (
                <button key={k} onClick={() => { setShortcutKeys(prev => [...prev, k]); }}
                  className="px-2.5 py-1.5 bg-background-deep border border-border-default rounded-lg text-[9px] font-mono text-foreground-muted hover:border-amber-400/30 hover:text-amber-400 transition-all">
                  {k}
                </button>
              ))}
            </div>
            {shortcutKeys.length >= 2 && (
              <Button onClick={handleShortcutExecute} disabled={isLoading(`Shortcut: ${shortcutKeys.join('+')}`)} isLoading={isLoading(`Shortcut: ${shortcutKeys.join('+')}`)} variant="secondary" size="sm">
                <Zap className="w-3.5 h-3.5 mr-1.5" /> Execute: {shortcutKeys.join(' + ')}
              </Button>
            )}
          </div>
        )}

        {/* Scroll Tab */}
        {activeTab === 'scroll' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <label className="text-[10px] font-mono text-foreground-muted">Lines:</label>
              <input type="number" min={1} value={scrollAmount} onChange={e => setScrollAmount(e.target.value)}
                className="w-24 bg-background-deep border border-border-default rounded-lg px-2 py-1.5 text-xs font-mono text-foreground" />
            </div>
            <div className="flex gap-3">
              <Button onClick={() => handleScroll('up')} disabled={isLoading('Scroll up')} isLoading={isLoading('Scroll up')} variant="secondary" className="flex-1" size="lg">
                <ArrowUp className="w-4 h-4 mr-2" /> Scroll Up
              </Button>
              <Button onClick={() => handleScroll('down')} disabled={isLoading('Scroll down')} isLoading={isLoading('Scroll down')} variant="secondary" className="flex-1" size="lg">
                <ArrowDown className="w-4 h-4 mr-2" /> Scroll Down
              </Button>
            </div>
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <span className="text-[8px] font-mono text-foreground-muted/50">Use with caution — inputs sent to host OS</span>
        </div>
      </div>
    </Modal>
  );
};
