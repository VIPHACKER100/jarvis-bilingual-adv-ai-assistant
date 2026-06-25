/**
 * WhatsAppPanel Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { WhatsAppPanel } from '../components/WhatsAppPanel';
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

const mockUseWhatsAppStatus = vi.fn();
const mockUseWhatsAppContacts = vi.fn();
const mockUseSendWhatsAppMessage = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  useWhatsAppStatus: (...args: any[]) => mockUseWhatsAppStatus(...args),
  useWhatsAppContacts: (...args: any[]) => mockUseWhatsAppContacts(...args),
  useSendWhatsAppMessage: (...args: any[]) => mockUseSendWhatsAppMessage(...args),
}));

vi.mock('../services/apiClient', () => ({
  apiClient: {
    draftWhatsAppReply: vi.fn().mockResolvedValue({ success: true, draft: 'AI reply', copied_to_clipboard: false, response: 'OK' }),
    openWhatsApp: vi.fn().mockResolvedValue({ success: true, response: 'Opened' }),
  },
}));

const mockContacts = [
  { alias: 'Mom', name: 'Mother', phone: '+911234567890' },
  { alias: 'Dad', name: 'Father', phone: '+919876543210' },
];

describe('WhatsAppPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showWhatsApp: false });
    mockRefetch.mockReturnValue(Promise.resolve());
    mockMutateAsync.mockResolvedValue({ success: true, response: 'Sent' });

    mockUseWhatsAppStatus.mockReturnValue({
      data: { success: true, desktop_installed: true, is_running: true, response: 'Running' },
      isLoading: false, error: null, refetch: mockRefetch,
    });
    mockUseWhatsAppContacts.mockReturnValue({
      data: { contacts: mockContacts, count: 2 },
      isLoading: false, error: null, refetch: mockRefetch,
    });
    mockUseSendWhatsAppMessage.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  it('returns null when showWhatsApp is false', () => {
    const { container } = render(<WhatsAppPanel />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);
    expect(screen.getByText('WHATSAPP_NEURAL_INTERFACE // v4.0')).toBeTruthy();
  });

  it('shows ACTIVE status when WhatsApp is running', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);
    expect(screen.getByText('ACTIVE')).toBeTruthy();
  });

  it('shows OFFLINE status and Launch button when not running', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    mockUseWhatsAppStatus.mockReturnValue({
      data: { success: true, desktop_installed: true, is_running: false, response: 'Not running' },
      isLoading: false, error: null, refetch: mockRefetch,
    });
    render(<WhatsAppPanel />);
    expect(screen.getByText('OFFLINE')).toBeTruthy();
    expect(screen.getByText('Launch')).toBeTruthy();
  });

  it('renders contact list', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);
    expect(screen.getByText('Mom')).toBeTruthy();
    expect(screen.getByText('Dad')).toBeTruthy();
  });

  it('switches to custom number input', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);

    fireEvent.click(screen.getByText('Custom Number'));
    const customInput = screen.getByPlaceholderText('+919876543210');
    expect(customInput).toBeTruthy();
    fireEvent.change(customInput, { target: { value: '+919999999999' } });
    expect((customInput as HTMLInputElement).value).toBe('+919999999999');
  });

  it('shows selected contact indicator', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);

    fireEvent.click(screen.getByText('Mom'));
    expect(screen.getByText(/To:/)).toBeTruthy();
  });

  it('sends message', async () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);

    fireEvent.click(screen.getByText('Mom'));
    const textarea = screen.getByPlaceholderText('Type your message...');
    fireEvent.change(textarea, { target: { value: 'Hello!' } });

    fireEvent.click(screen.getByText('Send Message'));
    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
    expect(mockAddNotif).toHaveBeenCalledWith(expect.objectContaining({ title: 'WhatsApp Sent' }));
  });

  it('disables send button when no message or contact', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);

    const sendBtn = screen.getByText('Send Message').closest('button');
    expect(sendBtn).toBeDisabled();
  });

  it('shows AI Draft button', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);
    expect(screen.getByText('AI Draft')).toBeTruthy();
  });

  it('shows loading spinner when contacts are loading', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    mockUseWhatsAppContacts.mockReturnValue({
      data: undefined, isLoading: true, error: null, refetch: mockRefetch,
    });
    const { container } = render(<WhatsAppPanel />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty contacts message', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    mockUseWhatsAppContacts.mockReturnValue({
      data: { contacts: [], count: 0 }, isLoading: false, error: null, refetch: mockRefetch,
    });
    render(<WhatsAppPanel />);
    expect(screen.getByText('No contacts loaded')).toBeTruthy();
  });

  it('renders refresh status in footer', () => {
    useJarvisStore.setState({ showWhatsApp: true });
    render(<WhatsAppPanel />);
    expect(screen.getByText('Refresh Status')).toBeTruthy();
  });
});
