/**
 * CloudSettings (CloudSettingsModal) Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CloudSettingsModal } from '../components/CloudSettings';

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
const mockTestMutateAsync = vi.fn();

const mockUseApiKeyStatus = vi.fn();
const mockUseUpdateApiKeys = vi.fn();
const mockUseTestApiKey = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  useApiKeyStatus: (...args: any[]) => mockUseApiKeyStatus(...args),
  useUpdateApiKeys: (...args: any[]) => mockUseUpdateApiKeys(...args),
  useTestApiKey: (...args: any[]) => mockUseTestApiKey(...args),
}));

const mockKeys = {
  NVIDIA_API_KEY: 'nv-test-key-123',
  OPENROUTER_API_KEY: null,
  BACKEND_API_KEY: 'backend-key-456',
};

describe('CloudSettingsModal', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockRefetch.mockReturnValue(Promise.resolve());
    mockMutateAsync.mockResolvedValue({ success: true, message: 'Saved' });
    mockTestMutateAsync.mockResolvedValue({ success: true, valid: true, provider: 'nvidia', message: 'Key is valid' });

    mockUseApiKeyStatus.mockReturnValue({
      data: { success: true, keys: mockKeys },
      isLoading: false,
      isFetching: false,
      refetch: mockRefetch,
    });
    mockUseUpdateApiKeys.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseTestApiKey.mockReturnValue({ mutateAsync: mockTestMutateAsync, isPending: false });
  });

  it('renders modal content when isOpen is true', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('CLOUD_SETTINGS // API KEY MANAGER')).toBeTruthy();
  });

  it('returns nothing when isOpen is false', () => {
    const { container } = render(<CloudSettingsModal isOpen={false} onClose={vi.fn()} />);
    expect(container.innerHTML).toBe('');
  });

  it('shows loading state', () => {
    mockUseApiKeyStatus.mockReturnValue({ data: undefined, isLoading: true, isFetching: false, refetch: mockRefetch });
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(document.querySelector('.animate-spin')).toBeTruthy();
  });

  it('renders all provider key sections', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('NVIDIA API Key')).toBeTruthy();
    expect(screen.getByText('OpenRouter API Key')).toBeTruthy();
    expect(screen.getByText('Backend API Key')).toBeTruthy();
  });

  it('shows SET badge for configured keys and MISSING for unconfigured', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    const setBadges = screen.getAllByText('SET');
    expect(setBadges.length).toBe(2);
    const missingBadges = screen.getAllByText('MISSING');
    expect(missingBadges.length).toBe(1);
  });

  it('toggles key visibility', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    const showBtns = screen.getAllByLabelText('Show API key');
    expect(showBtns.length).toBeGreaterThan(0);
    fireEvent.click(showBtns[0]);
    expect(screen.getAllByLabelText('Hide API key').length).toBeGreaterThan(0);
  });

  it('has test key buttons with accessibility attributes', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    const testBtns = screen.getAllByLabelText(/Test .* API key/);
    expect(testBtns.length).toBe(3);
    testBtns.forEach(btn => expect(btn).toHaveAttribute('title'));
  });

  it('shows Save Keys button', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Save Keys')).toBeTruthy();
  });

  it('shows description text', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText(/Manage and test third-party API keys/)).toBeTruthy();
  });

  it('shows encrypted at rest footer', () => {
    render(<CloudSettingsModal isOpen={true} onClose={vi.fn()} />);
    expect(screen.getByText('Keys stored encrypted at rest')).toBeTruthy();
  });
});
