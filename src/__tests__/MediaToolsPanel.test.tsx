/**
 * MediaToolsPanel Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MediaToolsPanel } from '../components/MediaToolsPanel';
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

const mockOcrScreen = vi.fn();
const mockOcrImage = vi.fn();
const mockConvertImage = vi.fn();
const mockOcrPdf = vi.fn();

vi.mock('../services/apiClient', () => ({
  apiClient: {
    ocrScreen: (...args: any[]) => mockOcrScreen(...args),
    ocrImage: (...args: any[]) => mockOcrImage(...args),
    convertImage: (...args: any[]) => mockConvertImage(...args),
    ocrPdf: (...args: any[]) => mockOcrPdf(...args),
  },
}));

describe('MediaToolsPanel', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showMediaTools: false });

    mockOcrScreen.mockResolvedValue({ success: true, text: 'Screen text extracted', response: 'OK' });
    mockOcrImage.mockResolvedValue({ success: true, text: 'Image text extracted', response: 'OK' });
    mockConvertImage.mockResolvedValue({ success: true, output_path: '/output/image.png', response: 'OK' });
    mockOcrPdf.mockResolvedValue({ success: true, pages: [{ page: 1, text: 'PDF content' }], response: 'OK' });
  });

  it('returns null when showMediaTools is false', () => {
    const { container } = render(<MediaToolsPanel />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when visible', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);
    expect(screen.getByText('MEDIA_TOOLS_SUITE // v4.0')).toBeTruthy();
  });

  it('renders all tab items', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    expect(screen.getByText('OCR')).toBeTruthy();
    expect(screen.getByText('Image')).toBeTruthy();
    expect(screen.getByText('PDF')).toBeTruthy();
  });

  it('shows OCR tab by default', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    expect(screen.getByText('Capture & OCR Screen')).toBeTruthy();
    expect(screen.getByPlaceholderText('C:\\path\\to\\image.png')).toBeTruthy();
  });

  it('performs screen OCR on click', async () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    fireEvent.click(screen.getByText('Capture & OCR Screen'));
    await waitFor(() => {
      expect(mockOcrScreen).toHaveBeenCalled();
    });
    expect(screen.getByText('Screen text extracted')).toBeTruthy();
  });

  it('shows OCR result with copy button', async () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    fireEvent.click(screen.getByText('Capture & OCR Screen'));
    await waitFor(() => {
      expect(screen.getByText('Screen text extracted')).toBeTruthy();
    });

    expect(screen.getByLabelText('Copy OCR result')).toBeTruthy();
    expect(screen.getByTitle('Copy to clipboard')).toBeTruthy();
  });

  it('shows image convert tab with format selector', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    fireEvent.click(screen.getByText('Image'));
    expect(screen.getByText('Convert')).toBeTruthy();
    expect(screen.getByDisplayValue('PNG')).toBeTruthy();
  });

  it('shows PDF extract tab', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);

    fireEvent.click(screen.getByText('PDF'));
    expect(screen.getByPlaceholderText('C:\\path\\to\\document.pdf')).toBeTruthy();
    expect(screen.getByText('Extract Text')).toBeTruthy();
  });

  it('shows footer message', () => {
    useJarvisStore.setState({ showMediaTools: true });
    render(<MediaToolsPanel />);
    expect(screen.getByText(/File paths reference files on the server/)).toBeTruthy();
  });
});
