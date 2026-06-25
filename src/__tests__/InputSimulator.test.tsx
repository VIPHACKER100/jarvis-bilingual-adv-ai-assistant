/**
 * InputSimulator Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InputSimulator } from '../components/InputSimulator';
import { useJarvisStore } from '../store/jarvisStore';

const mockAddNotif = vi.fn();
vi.mock('../context/NotificationContext', () => ({
  useNotifications: () => ({ addNotification: mockAddNotif }),
}));

vi.mock('framer-motion', () => ({
  motion: {
    div: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, ...rest } = p;
      return <div {...rest}>{children}</div>;
    },
    button: ({ children, ...p }: any) => {
      const { initial, animate, exit, transition, whileHover, whileTap, ...rest } = p;
      return <button {...rest}>{children}</button>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

vi.mock('../services/apiClient', () => ({
  apiClient: {
    moveCursor: vi.fn().mockResolvedValue({ success: true, response: 'Moved' }),
    mouseClick: vi.fn().mockResolvedValue({ success: true, response: 'Clicked' }),
    typeText: vi.fn().mockResolvedValue({ success: true, response: 'Typed' }),
    pressKey: vi.fn().mockResolvedValue({ success: true, response: 'Pressed' }),
    sendShortcut: vi.fn().mockResolvedValue({ success: true, response: 'Shortcut sent' }),
    scrollWheel: vi.fn().mockResolvedValue({ success: true, response: 'Scrolled' }),
    dragMouse: vi.fn().mockResolvedValue({ success: true, response: 'Dragged' }),
  },
}));

describe('InputSimulator', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showInputSimulator: false });
  });

  it('returns null when showInputSimulator is false', () => {
    const { container } = render(<InputSimulator />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);
    expect(screen.getByText('INPUT_SIMULATOR // v4.0')).toBeTruthy();
  });

  it('renders all tab buttons', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    expect(screen.getByText('Keys')).toBeTruthy();
    expect(screen.getByText('Mouse')).toBeTruthy();
    expect(screen.getByText('Type')).toBeTruthy();
    expect(screen.getByText('Shortcuts')).toBeTruthy();
    expect(screen.getByText('Scroll')).toBeTruthy();
  });

  it('shows keyboard tab by default with modifier keys', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    expect(screen.getByText('Ctrl')).toBeTruthy();
    // Shift and Alt appear both as modifier buttons and in the key list
    expect(screen.getAllByText('Shift').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Alt').length).toBeGreaterThan(0);
    expect(screen.getByText('Win')).toBeTruthy();
    expect(screen.getByText('Enter')).toBeTruthy();
    expect(screen.getByText('Space')).toBeTruthy();
  });

  it('toggles modifier keys', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Ctrl'));
    expect(screen.getByText(/Ctrl \+ ___/)).toBeTruthy();
  });

  it('clears modifiers', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Ctrl'));
    expect(screen.getByText(/Ctrl \+ ___/)).toBeTruthy();

    fireEvent.click(screen.getByLabelText('Clear modifiers'));
    expect(screen.queryByText(/Ctrl \+ ___/)).toBeNull();
  });

  it('shows mouse tab with click buttons', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Mouse'));
    expect(screen.getByText('Left Click')).toBeTruthy();
    expect(screen.getByText('Right Click')).toBeTruthy();
    expect(screen.getByText('Middle Click')).toBeTruthy();
    expect(screen.getByText('Execute Drag')).toBeTruthy();
  });

  it('shows type tab with textarea and simulate button', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Type'));
    expect(screen.getByPlaceholderText('Paste or type text to simulate...')).toBeTruthy();
    expect(screen.getByText('Simulate Typing')).toBeTruthy();
  });

  it('disables type button when text is empty', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Type'));
    const typeBtn = screen.getByText('Simulate Typing').closest('button');
    expect(typeBtn).toBeDisabled();
  });

  it('shows shortcuts tab', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Shortcuts'));
    expect(screen.getByText('Ctrl')).toBeTruthy();
    expect(screen.getByText('Shift')).toBeTruthy();
    expect(screen.getByText('Alt')).toBeTruthy();
    expect(screen.getByText('Win')).toBeTruthy();
  });

  it('shows scroll tab with up/down buttons', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    fireEvent.click(screen.getByText('Scroll'));
    expect(screen.getByText('Scroll Up')).toBeTruthy();
    expect(screen.getByText('Scroll Down')).toBeTruthy();
  });

  it('shows caution footer', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);
    expect(screen.getByText(/Use with caution/)).toBeTruthy();
  });

  it('renders F-key buttons', () => {
    useJarvisStore.setState({ showInputSimulator: true });
    render(<InputSimulator />);

    const fKeys = screen.getAllByText(/^F\d+$/);
    expect(fKeys.length).toBeGreaterThan(0);
  });
});
