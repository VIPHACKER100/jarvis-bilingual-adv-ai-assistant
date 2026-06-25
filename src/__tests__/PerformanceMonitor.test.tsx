/**
 * PerformanceMonitor Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { PerformanceMonitor } from '../components/PerformanceMonitor';
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
const mockUsePerformanceHistory = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  usePerformanceHistory: (...args: any[]) => mockUsePerformanceHistory(...args),
}));

const mockPerformanceData = {
  data: [
    { timestamp: '2026-06-25T10:00:00Z', cpu_percent: 45.2, memory_percent: 62.8, disk_percent: 55.0, network_bytes_sent: 1024000, network_bytes_recv: 2048000 },
    { timestamp: '2026-06-25T10:00:10Z', cpu_percent: 48.5, memory_percent: 63.1, disk_percent: 55.0, network_bytes_sent: 1124000, network_bytes_recv: 2148000 },
    { timestamp: '2026-06-25T10:00:20Z', cpu_percent: 42.1, memory_percent: 62.5, disk_percent: 55.0, network_bytes_sent: 1024000, network_bytes_recv: 2048000 },
  ],
  period_minutes: 1,
};

describe('PerformanceMonitor', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showPerformanceMonitor: false });
    mockRefetch.mockReturnValue(Promise.resolve());

    mockUsePerformanceHistory.mockReturnValue({
      data: mockPerformanceData,
      isLoading: false,
      isRefetching: false,
      refetch: mockRefetch,
      dataUpdatedAt: Date.now(),
    });
  });

  it('returns null when showPerformanceMonitor is false', () => {
    const { container } = render(<PerformanceMonitor />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    render(<PerformanceMonitor />);
    expect(screen.getByText('PERFORMANCE_MONITOR // v4.0')).toBeTruthy();
  });

  it('shows loading state', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    mockUsePerformanceHistory.mockReturnValue({
      data: undefined, isLoading: true, isRefetching: false, refetch: mockRefetch, dataUpdatedAt: 0,
    });
    render(<PerformanceMonitor />);
    expect(screen.getByText('Loading metrics...')).toBeTruthy();
  });

  it('shows empty state when no data', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    mockUsePerformanceHistory.mockReturnValue({
      data: { data: [], period_minutes: 0 },
      isLoading: false, isRefetching: false, refetch: mockRefetch, dataUpdatedAt: 0,
    });
    render(<PerformanceMonitor />);
    expect(screen.getByText('No performance data available')).toBeTruthy();
  });

  it('renders performance metric labels', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    render(<PerformanceMonitor />);

    expect(screen.getByText('CPU')).toBeTruthy();
    expect(screen.getByText('Memory')).toBeTruthy();
    expect(screen.getByText('Disk')).toBeTruthy();
    expect(screen.getByText('Network')).toBeTruthy();
  });

  it('shows data point count', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    const { container } = render(<PerformanceMonitor />);
    // Text is split across nested <span> elements, check via textContent
    expect(container.textContent).toContain('3');
    expect(container.textContent).toContain('data points');
  });

  it('shows system nominal status', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    render(<PerformanceMonitor />);
    expect(screen.getByText('System Nominal')).toBeTruthy();
  });

  it('renders refresh button with accessibility', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    render(<PerformanceMonitor />);

    const refreshBtn = screen.getByTitle('Refresh metrics');
    expect(refreshBtn).toBeTruthy();
    expect(refreshBtn).toHaveAttribute('aria-label', 'Refresh performance metrics');
    fireEvent.click(refreshBtn);
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('renders network metrics', () => {
    useJarvisStore.setState({ showPerformanceMonitor: true });
    render(<PerformanceMonitor />);

    expect(screen.getByText(/Received/)).toBeTruthy();
    expect(screen.getByText(/Sent/)).toBeTruthy();
  });
});
