/**
 * FileBrowser Component Tests
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { FileBrowser } from '../components/FileBrowser';
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

const mockUseFileList = vi.fn();
const mockUseCreateFolder = vi.fn();
const mockUseDeleteFile = vi.fn();
const mockUseRenameFile = vi.fn();
const mockUseCopyFile = vi.fn();
const mockUseMoveFile = vi.fn();

vi.mock('../hooks/useSystemQuery', () => ({
  useFileList: (...args: any[]) => mockUseFileList(...args),
  useCreateFolder: (...args: any[]) => mockUseCreateFolder(...args),
  useDeleteFile: (...args: any[]) => mockUseDeleteFile(...args),
  useRenameFile: (...args: any[]) => mockUseRenameFile(...args),
  useCopyFile: (...args: any[]) => mockUseCopyFile(...args),
  useMoveFile: (...args: any[]) => mockUseMoveFile(...args),
}));

const mockFileData = {
  files: [
    { name: 'Documents', path: 'C:\\Documents', size: 0, is_directory: true, modified_at: '2026-06-01T10:00:00Z', created_at: '2026-01-01T00:00:00Z' },
    { name: 'image.png', path: 'C:\\image.png', size: 102400, is_directory: false, modified_at: '2026-06-02T10:00:00Z', created_at: '2026-01-02T00:00:00Z' },
    { name: 'notes.txt', path: 'C:\\notes.txt', size: 2048, is_directory: false, modified_at: '2026-06-03T10:00:00Z', created_at: '2026-01-03T00:00:00Z' },
    { name: 'report.pdf', path: 'C:\\report.pdf', size: 512000, is_directory: false, modified_at: '2026-06-04T10:00:00Z', created_at: '2026-01-04T00:00:00Z' },
  ],
  folder: 'C:\\',
  count: 4,
};

describe('FileBrowser', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    useJarvisStore.setState({ showFileBrowser: false });
    mockRefetch.mockReturnValue(Promise.resolve());
    mockMutateAsync.mockResolvedValue({ success: true, response: 'Done' });

    mockUseFileList.mockReturnValue({ data: mockFileData, isLoading: false, error: null, refetch: mockRefetch });
    mockUseCreateFolder.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseDeleteFile.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseRenameFile.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseCopyFile.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
    mockUseMoveFile.mockReturnValue({ mutateAsync: mockMutateAsync, isPending: false });
  });

  it('returns null when showFileBrowser is false', () => {
    const { container } = render(<FileBrowser />);
    expect(container.innerHTML).toBe('');
  });

  it('renders modal when showFileBrowser is true', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);
    expect(screen.getByText('FILE_SYSTEM_EXPLORER // v4.0')).toBeTruthy();
  });

  it('shows loading spinner when isLoading is true', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    mockUseFileList.mockReturnValue({ data: undefined, isLoading: true, error: null, refetch: mockRefetch });
    const { container } = render(<FileBrowser />);
    const spinner = container.querySelector('.animate-spin');
    expect(spinner).toBeTruthy();
  });

  it('shows error state with retry button', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    mockUseFileList.mockReturnValue({ data: undefined, isLoading: false, error: new Error('Failed'), refetch: mockRefetch });
    render(<FileBrowser />);
    expect(screen.getByText('Failed to load directory')).toBeTruthy();
    expect(screen.getByText('Retry')).toBeTruthy();
    fireEvent.click(screen.getByText('Retry'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('shows empty directory message when no files', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    mockUseFileList.mockReturnValue({ data: { files: [], folder: 'C:\\', count: 0 }, isLoading: false, error: null, refetch: mockRefetch });
    render(<FileBrowser />);
    expect(screen.getByText('Empty directory')).toBeTruthy();
  });

  it('renders file and folder list', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);
    expect(screen.getByText('Documents')).toBeTruthy();
    expect(screen.getByText('image.png')).toBeTruthy();
    expect(screen.getByText('notes.txt')).toBeTruthy();
    expect(screen.getByText('report.pdf')).toBeTruthy();
    expect(screen.getByText('4 items')).toBeTruthy();
  });

  it('renders navigation buttons with correct titles and aria-labels', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    // The component uses title="Root" and aria-label="Root directory"
    const rootBtn = screen.getByTitle('Root');
    expect(rootBtn).toBeTruthy();
    expect(rootBtn).toHaveAttribute('aria-label', 'Root directory');

    const goUpBtn = screen.getByTitle('Go up');
    expect(goUpBtn).toBeTruthy();
    expect(goUpBtn).toHaveAttribute('aria-label', 'Go up one directory');
  });

  it('renders and updates search input', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    const searchInput = screen.getByPlaceholderText('Filter by pattern (e.g. *.tsx)...');
    expect(searchInput).toBeTruthy();
    fireEvent.change(searchInput, { target: { value: '*.tsx' } });
    expect((searchInput as HTMLInputElement).value).toBe('*.tsx');
  });

  it('shows new folder input and creates folder', async () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    // The create button has title "Create folder"
    fireEvent.click(screen.getByTitle('Create folder'));

    const folderInput = screen.getByPlaceholderText('folder_name');
    expect(folderInput).toBeTruthy();

    fireEvent.change(folderInput, { target: { value: 'NewFolder' } });
    fireEvent.click(screen.getByText('Create'));

    await waitFor(() => {
      expect(mockMutateAsync).toHaveBeenCalled();
    });
    expect(mockAddNotif).toHaveBeenCalled();
  });

  it('cancels folder creation via Cancel button', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    fireEvent.click(screen.getByTitle('Create folder'));
    expect(screen.getByPlaceholderText('folder_name')).toBeTruthy();

    fireEvent.click(screen.getByText('Cancel'));
    // After cancel, the input should be gone
    expect(screen.queryByPlaceholderText('folder_name')).toBeNull();
  });

  it('renders action buttons with proper titles and aria-labels', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    const renameBtns = screen.getAllByLabelText('Rename');
    expect(renameBtns.length).toBeGreaterThan(0);
    renameBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Rename'));

    const copyBtns = screen.getAllByLabelText('Copy');
    expect(copyBtns.length).toBeGreaterThan(0);
    copyBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Copy'));

    const deleteBtns = screen.getAllByLabelText('Delete');
    expect(deleteBtns.length).toBeGreaterThan(0);
    deleteBtns.forEach(btn => expect(btn).toHaveAttribute('title', 'Delete'));
  });

  it('calls refetch when refresh button clicked', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    fireEvent.click(screen.getByTitle('Refresh'));
    expect(mockRefetch).toHaveBeenCalled();
  });

  it('displays formatted file sizes', () => {
    useJarvisStore.setState({ showFileBrowser: true });
    render(<FileBrowser />);

    expect(screen.getByText(/100\.0 KB/)).toBeTruthy();
    expect(screen.getByText(/2\.0 KB/)).toBeTruthy();
    expect(screen.getByText(/500\.0 KB/)).toBeTruthy();
  });
});
