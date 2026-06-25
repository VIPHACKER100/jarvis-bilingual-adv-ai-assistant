/**
 * DeviceSyncPanel Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { DeviceSyncPanel } from '../components/DeviceSyncPanel';
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

const mockRefetch = vi.fn();
const mockMutateAsync = vi.fn();

const mockUsePairedDevices = vi.fn();
const mockUseUnpairDevice = vi.fn();
const mockUsePairingCode = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  usePairedDevices: (...args: any[]) => mockUsePairedDevices(...args),
  useUnpairDevice: (...args: any[]) => mockUseUnpairDevice(...args),
  usePairingCode: (...args: any[]) => mockUsePairingCode(...args),
}));

const mockDevices = [
  { id: 'dev-1', name: 'OnePlus 12', type: 'Phone', paired_at: '2026-06-01T10:00:00Z', last_seen: '2026-06-25T10:00:00Z' },
  { id: 'dev-2', name: 'iPad Pro', type: 'Tablet', paired_at: '2026-06-15T10:00:00Z', last_seen: '2026-06-24T10:00:00Z' },
];

const mockPairingMutate = vi.fn().mockResolvedValue({ code: '654321', expires_in: 300 });

describe('DeviceSyncPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showDeviceSync: false });
    mockRefetch.mockReturnValue(Promise.resolve());
    mockMutateAsync.mockResolvedValue({ success: true, response: 'Done' });
    mockPairingMutate.mockResolvedValue({ code: '654321', expires_in: 300 });

    mockUsePairedDevices.mockReturnValue({ data: { devices: mockDevices, count: 2 }, isLoading: false, error: null, refetch: mockRefetch });
    mockUseUnpairDevice.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUsePairingCode.mockReturnValue({ mutateAsync: mockPairingMutate, isPending: false });
  });

  it('returns null when showDeviceSync is false', () => {
    const { container } = render(<DeviceSyncPanel />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);
    expect(screen.getByText('DEVICE_SYNC_HUB // v4.0')).toBeTruthy();
  });

  it('shows loading spinner when devices are loading', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    mockUsePairedDevices.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: mockRefetch });
    const { container } = render(<DeviceSyncPanel />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state when no devices paired', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    mockUsePairedDevices.mockReturnValue({ data: { devices: [], count: 0 }, isLoading: false, error: null, refetch: mockRefetch });
    render(<DeviceSyncPanel />);
    expect(screen.getByText('No devices paired yet')).toBeTruthy();
  });

  it('renders paired devices list', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);
    expect(screen.getByText('OnePlus 12')).toBeTruthy();
    expect(screen.getByText('iPad Pro')).toBeTruthy();
    expect(screen.getByText('Trusted Devices (2)')).toBeTruthy();
  });

  it('generates pairing code', async () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);

    fireEvent.click(screen.getByText('Generate Pairing Code'));
    await waitFor(() => {
      expect(mockPairingMutate).toHaveBeenCalled();
    });
  });

  it('has accessibility attributes on refresh button', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);

    const refreshBtn = screen.getByTitle('Refresh');
    expect(refreshBtn).toBeTruthy();
    expect(refreshBtn).toHaveAttribute('aria-label', 'Refresh device list');
  });

  it('shows Unpair buttons with accessibility attributes', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);

    const unpairBtns = screen.getAllByLabelText('Unpair device');
    expect(unpairBtns.length).toBe(2);
    unpairBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Unpair device'));
  });

  it('shows Trusted badges on devices', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);

    const trustedBadges = screen.getAllByText('Trusted');
    expect(trustedBadges.length).toBe(2);
  });

  it('renders footer with sync protocol text', () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);
    expect(screen.getByText('Sync Protocol v4.0 — Encrypted')).toBeTruthy();
  });

  it('dismisses pairing code display', async () => {
    useJarvisStore.setState({ showDeviceSync: true });
    render(<DeviceSyncPanel />);

    fireEvent.click(screen.getByText('Generate Pairing Code'));
    await waitFor(() => {
      expect(screen.getByText('Dismiss')).toBeTruthy();
    });

    fireEvent.click(screen.getByText('Dismiss'));
    expect(screen.queryByText('654321')).toBeNull();
  });
});
