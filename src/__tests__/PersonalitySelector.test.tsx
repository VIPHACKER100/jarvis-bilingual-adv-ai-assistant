/**
 * PersonalitySelector Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { PersonalitySelector } from '../components/PersonalitySelector';
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

const mockMutateAsync = vi.fn();
const mockUsePersonalities = vi.fn();
const mockUseSetPersonality = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  usePersonalities: (...args: any[]) => mockUsePersonalities(...args),
  useSetPersonality: (...args: any[]) => mockUseSetPersonality(...args),
}));

const mockPersonalities = [
  { id: 'stark', name: 'Stark', accent: '#FFD700', style: 'active', primary: '#FFD700' },
  { id: 'midnight', name: 'Midnight', accent: '#FF6B6B', style: 'tactical', primary: '#FF6B6B' },
  { id: 'avenue', name: 'Avenue', accent: '#34D399', style: 'minimal', primary: '#34D399' },
];

describe('PersonalitySelector', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showPersonality: false, systemStatus: null });
    mockMutateAsync.mockResolvedValue({ success: true, response: 'Switched' });

    mockUsePersonalities.mockReturnValue({ data: { personalities: mockPersonalities, count: 3 }, isLoading: false, error: null });
    mockUseSetPersonality.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  it('returns null when showPersonality is false', () => {
    const { container } = render(<PersonalitySelector />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showPersonality: true });
    render(<PersonalitySelector />);
    expect(screen.getByText('PERSONALITY_MATRIX // v4.0')).toBeTruthy();
  });

  it('shows loading state', () => {
    useJarvisStore.setState({ showPersonality: true });
    mockUsePersonalities.mockReturnValue({ data: undefined, isLoading: true, error: null });
    const { container } = render(<PersonalitySelector />);
    expect(container.querySelector('.animate-spin')).toBeTruthy();
  });

  it('shows empty state when no personalities', () => {
    useJarvisStore.setState({ showPersonality: true });
    mockUsePersonalities.mockReturnValue({ data: { personalities: [], count: 0 }, isLoading: false, error: null });
    render(<PersonalitySelector />);
    expect(screen.getByText('No personalities available')).toBeTruthy();
  });

  it('renders all personality cards', () => {
    useJarvisStore.setState({ showPersonality: true });
    render(<PersonalitySelector />);

    expect(screen.getByText('Stark')).toBeTruthy();
    expect(screen.getByText('Midnight')).toBeTruthy();
    expect(screen.getByText('Avenue')).toBeTruthy();
  });

  it('shows Active badge on the active personality', () => {
    useJarvisStore.setState({
      showPersonality: true,
      systemStatus: { personality: { id: 'stark', name: 'Stark', accent: '#FFD700', style: 'active', primary: '#FFD700' } } as any,
    });
    render(<PersonalitySelector />);

    expect(screen.getByText('Active')).toBeTruthy();
  });

  it('selects a personality on click', async () => {
    useJarvisStore.setState({ showPersonality: true });
    render(<PersonalitySelector />);

    const midnightBtn = screen.getByText('Midnight').closest('button')!;
    fireEvent.click(midnightBtn);

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalledWith('midnight');
    });
    expect(mockAddNotif).toHaveBeenCalledWith(expect.objectContaining({ title: 'Personality Updated' }));
  });

  it('renders close interface button', () => {
    useJarvisStore.setState({ showPersonality: true });
    render(<PersonalitySelector />);
    expect(screen.getByText('Close Interface')).toBeTruthy();
  });

  it('shows description text', () => {
    useJarvisStore.setState({ showPersonality: true });
    render(<PersonalitySelector />);
    expect(screen.getByText(/Select a neural personality/)).toBeTruthy();
  });
});
