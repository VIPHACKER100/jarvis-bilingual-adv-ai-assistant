/**
 * WindowManager Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WindowManager } from '../components/WindowManager';
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
    span: ({ children, ...p }: any) => {
      const { initial, animate, exit, ...rest } = p;
      return <span {...rest}>{children}</span>;
    },
  },
  AnimatePresence: ({ children }: any) => <>{children}</>,
}));

const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn();

const mockUseWindows = vi.fn();
const mockUseApps = vi.fn();
const mockUseCloseApp = vi.fn();
const mockUseWindowAction = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  useWindows: (...args: any[]) => mockUseWindows(...args),
  useApps: (...args: any[]) => mockUseApps(...args),
  useCloseApp: (...args: any[]) => mockUseCloseApp(...args),
  useWindowAction: (...args: any[]) => mockUseWindowAction(...args),
}));

const mockWindows = [
  { title: 'Visual Studio Code', process: 'Code.exe', pid: 1234, is_visible: true },
  { title: 'Chrome', process: 'chrome.exe', pid: 5678, is_visible: true },
];
const mockApps = [
  { name: 'Code.exe', pid: 1234, cpu_percent: 5.2, memory_mb: 250 },
  { name: 'chrome.exe', pid: 5678, cpu_percent: 12.8, memory_mb: 800 },
  { name: 'spotify.exe', pid: 9012, cpu_percent: 1.5, memory_mb: 120 },
];

describe('WindowManager', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showWindowManager: false });
    mockRefetch.mockReturnValue(Promise.resolve());
    mockMutateAsync.mockResolvedValue({ success: true, response: 'Done' });

    mockUseWindows.mockReturnValue({ data: { windows: mockWindows, count: 2 }, isLoading: false, error: null, refetch: mockRefetch });
    mockUseApps.mockReturnValue({ data: { apps: mockApps, count: 3 }, isLoading: false, error: null, refetch: mockRefetch });
    mockUseCloseApp.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseWindowAction.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  it('returns null when showWindowManager is false', () => {
    const { container } = render(<WindowManager />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);
    expect(screen.getByText('WINDOW_&_APP_MANAGER // v4.0')).toBeTruthy();
  });

  it('shows loading spinner for windows tab', () => {
    useJarvisStore.setState({ showWindowManager: true });
    mockUseWindows.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: mockRefetch });
    const { container } = render(<WindowManager />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state for windows', () => {
    useJarvisStore.setState({ showWindowManager: true });
    mockUseWindows.mockReturnValue({ data: { windows: [], count: 0 }, isLoading: false, error: null, refetch: mockRefetch });
    render(<WindowManager />);
    expect(screen.getByText('No open windows detected')).toBeTruthy();
  });

  it('shows empty state for apps', () => {
    useJarvisStore.setState({ showWindowManager: true });
    mockUseApps.mockReturnValue({ data: { apps: [], count: 0 }, isLoading: false, error: null, refetch: mockRefetch });
    render(<WindowManager />);
    fireEvent.click(screen.getByText(/Running Apps/));
    expect(screen.getByText('No apps found')).toBeTruthy();
  });

  it('renders windows list', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);
    expect(screen.getByText('Visual Studio Code')).toBeTruthy();
    expect(screen.getByText('Chrome')).toBeTruthy();
  });

  it('renders apps list when apps tab is active', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);
    fireEvent.click(screen.getByText(/Running Apps/));
    expect(screen.getByText('Code.exe')).toBeTruthy();
    expect(screen.getByText('chrome.exe')).toBeTruthy();
  });

  it('filters apps by search', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);
    fireEvent.click(screen.getByText(/Running Apps/));

    const searchInput = screen.getByPlaceholderText('Search apps...');
    fireEvent.change(searchInput, { target: { value: 'chrome' } });
    expect(screen.getByText('chrome.exe')).toBeTruthy();
    expect(screen.queryByText('spotify.exe')).toBeNull();
  });

  it('calls window action on button click', async () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    // Multiple windows each have action buttons; use first one
    const activateBtns = screen.getAllByLabelText('Activate window');
    expect(activateBtns.length).toBeGreaterThan(0);
    fireEvent.click(activateBtns[0]);
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
  });

  it('calls minimize action', async () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    const minimizeBtns = screen.getAllByLabelText('Minimize window');
    fireEvent.click(minimizeBtns[0]);
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ action: 'minimize' }));
    });
  });

  it('calls maximize action', async () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    const maximizeBtns = screen.getAllByLabelText('Maximize window');
    fireEvent.click(maximizeBtns[0]);
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ action: 'maximize' }));
    });
  });

  it('calls restore action', async () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    const restoreBtns = screen.getAllByLabelText('Restore window');
    fireEvent.click(restoreBtns[0]);
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith(expect.objectContaining({ action: 'restore' }));
    });
  });

  it('has accessibility attributes on all action buttons', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    const activateBtns = screen.getAllByLabelText('Activate window');
    expect(activateBtns.length).toBeGreaterThan(0);
    activateBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Activate'));

    const minimizeBtns = screen.getAllByLabelText('Minimize window');
    minimizeBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Minimize'));

    const maximizeBtns = screen.getAllByLabelText('Maximize window');
    maximizeBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Maximize'));

    const restoreBtns = screen.getAllByLabelText('Restore window');
    restoreBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Restore'));
  });

  it('shows close app buttons with accessibility attributes', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);
    fireEvent.click(screen.getByText(/Running Apps/));

    const closeBtns = screen.getAllByLabelText('Close app');
    expect(closeBtns.length).toBeGreaterThan(0);
    closeBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Close app'));
  });

  it('renders the refresh button in footer', () => {
    useJarvisStore.setState({ showWindowManager: true });
    render(<WindowManager />);

    fireEvent.click(screen.getByText('Refresh'));
    expect(mockRefetch).toHaveBeenCalledTimes(2);
  });
});
