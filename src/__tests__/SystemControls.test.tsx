/**
 * SystemControls Component Tests
 */
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SystemControls } from '../components/SystemControls';
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

const mockShutdown = vi.fn();
const mockRestart = vi.fn();
const mockSleep = vi.fn();
const mockLock = vi.fn();
const mockHibernate = vi.fn();
const mockLogout = vi.fn();

vi.mock('../services/apiClient', () => ({
  apiClient: {
    shutdownComputer: (...args: any[]) => mockShutdown(...args),
    restartComputer: (...args: any[]) => mockRestart(...args),
    sleepComputer: (...args: any[]) => mockSleep(...args),
    lockWorkstation: (...args: any[]) => mockLock(...args),
    hibernateComputer: (...args: any[]) => mockHibernate(...args),
    logoutUser: (...args: any[]) => mockLogout(...args),
  },
}));

describe('SystemControls', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showSystemControls: false });

    mockShutdown.mockResolvedValue({ success: true, action: 'shutdown', response: 'Shutting down' });
    mockRestart.mockResolvedValue({ success: true, action: 'restart', response: 'Restarting' });
    mockSleep.mockResolvedValue({ success: true, action: 'sleep', response: 'Sleeping' });
    mockLock.mockResolvedValue({ success: true, action: 'lock', response: 'Locking' });
    mockHibernate.mockResolvedValue({ success: true, action: 'hibernate', response: 'Hibernating' });
    mockLogout.mockResolvedValue({ success: true, action: 'logout', response: 'Logging out' });

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it('returns null when showSystemControls is false', () => {
    const { container } = render(<SystemControls />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);
    expect(screen.getByText('SYSTEM_CONTROLS // v4.0')).toBeTruthy();
  });

  it('renders all six system action buttons', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    expect(screen.getByText('Shutdown')).toBeTruthy();
    expect(screen.getByText('Restart')).toBeTruthy();
    expect(screen.getByText('Sleep')).toBeTruthy();
    expect(screen.getByText('Lock')).toBeTruthy();
    expect(screen.getByText('Hibernate')).toBeTruthy();
    expect(screen.getByText('Log Out')).toBeTruthy();
  });

  it('shows confirmation dialog when shutdown is clicked', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    fireEvent.click(screen.getByText('Shutdown'));
    expect(screen.getByText(/SHUTDOWN/)).toBeTruthy();
    expect(screen.getByText(/Power off the system/)).toBeTruthy();
  });

  it('shows confirmation dialog when restart is clicked', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    fireEvent.click(screen.getByText('Restart'));
    expect(screen.getByText(/RESTART/)).toBeTruthy();
  });

  it('shows confirmation with countdown', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    fireEvent.click(screen.getByText('Shutdown'));
    expect(screen.getByText(/Confirm \(5s\)/)).toBeTruthy();
  });

  it('cancels the pending action', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    fireEvent.click(screen.getByText('Shutdown'));
    expect(screen.getByText(/Confirm \(5s\)/)).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel'));
    expect(screen.queryByText(/Confirm \(5s\)/)).toBeNull();
  });

  it('shows description text', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);
    expect(screen.getByText(/Execute system-level power operations/)).toBeTruthy();
  });

  it('shows danger zone and admin footer', () => {
    useJarvisStore.setState({ showSystemControls: true });
    render(<SystemControls />);

    expect(screen.getByText('DANGER ZONE')).toBeTruthy();
    expect(screen.getByText(/Requires admin privileges/)).toBeTruthy();
  });
});
