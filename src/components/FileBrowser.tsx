import { FC, useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Folder, File, FileText, Image, Search, ChevronRight,
  Plus, Trash2, Copy, Move, Edit3, X, RefreshCw,
  ArrowLeft, HardDrive,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { useFileList, useDeleteFile, useCreateFolder, useRenameFile, useCopyFile, useMoveFile } from '../hooks/useSystemQuery';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Input } from './ui/Input';

const DEFAULT_PATH = 'C:\\';

export const FileBrowser: FC = () => {
  const { showFileBrowser, setShowFileBrowser } = useJarvisStore();
  const { addNotification } = useNotifications();

  const [currentPath, setCurrentPath] = useState(DEFAULT_PATH);
  const [searchPattern, setSearchPattern] = useState('');
  const [selectedFile, setSelectedFile] = useState<string | null>(null);
  const [showNewFolder, setShowNewFolder] = useState(false);
  const [newFolderName, setNewFolderName] = useState('');
  const [showRename, setShowRename] = useState(false);
  const [renameValue, setRenameValue] = useState('');
  const [showCopyMove, setShowCopyMove] = useState<'copy' | 'move' | null>(null);
  const [destPath, setDestPath] = useState('');

  const { data: fileListData, isLoading, error, refetch } = useFileList(currentPath, searchPattern || undefined);
  const createFolderMutation = useCreateFolder();
  const deleteFileMutation = useDeleteFile();
  const renameFileMutation = useRenameFile();
  const copyFileMutation = useCopyFile();
  const moveFileMutation = useMoveFile();

  const files = fileListData?.files ?? [];
  const folders = files.filter(f => f.is_directory);
  const regularFiles = files.filter(f => !f.is_directory);

  const navigateTo = useCallback((path: string) => {
    setCurrentPath(path);
    setSelectedFile(null);
    setSearchPattern('');
  }, []);

  const goUp = useCallback(() => {
    const parent = currentPath.replace(/\\$/, '').split('\\').slice(0, -1).join('\\');
    navigateTo(parent || 'C:\\');
  }, [currentPath, navigateTo]);

  const handleCreateFolder = useCallback(async () => {
    if (!newFolderName.trim()) return;
    try {
      const res = await createFolderMutation.mutateAsync({ name: newFolderName, parent: currentPath });
      addNotification({ type: 'success', title: 'Folder Created', message: res.response || newFolderName, duration: 3000 });
      setNewFolderName('');
      setShowNewFolder(false);
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to create folder', duration: 4000 });
    }
  }, [newFolderName, currentPath, createFolderMutation, addNotification, refetch]);

  const handleDelete = useCallback(async (path: string) => {
    if (!confirm('Permanently delete this item? This action is dangerous.')) return;
    try {
      const res = await deleteFileMutation.mutateAsync({ path, confirmed: true });
      addNotification({ type: 'warning', title: 'Deleted', message: res.response || path, duration: 3000 });
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to delete', duration: 4000 });
    }
  }, [deleteFileMutation, addNotification, refetch]);

  const handleRename = useCallback(async () => {
    if (!selectedFile || !renameValue.trim()) return;
    try {
      const res = await renameFileMutation.mutateAsync({ oldPath: selectedFile, newName: renameValue });
      addNotification({ type: 'success', title: 'Renamed', message: res.response || '', duration: 3000 });
      setShowRename(false);
      setSelectedFile(null);
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Error', message: 'Failed to rename', duration: 4000 });
    }
  }, [selectedFile, renameValue, renameFileMutation, addNotification, refetch]);

  const handleCopyMove = useCallback(async () => {
    if (!selectedFile || !destPath.trim()) return;
    try {
      const mutation = showCopyMove === 'copy' ? copyFileMutation : moveFileMutation;
      const res = await mutation.mutateAsync({ source: selectedFile, destination: destPath });
      addNotification({ type: 'success', title: showCopyMove === 'copy' ? 'Copied' : 'Moved', message: res.response || '', duration: 3000 });
      setShowCopyMove(null);
      setDestPath('');
      refetch();
    } catch {
      addNotification({ type: 'error', title: 'Error', message: `Failed to ${showCopyMove}`, duration: 4000 });
    }
  }, [selectedFile, destPath, showCopyMove, copyFileMutation, moveFileMutation, addNotification, refetch]);

  const getFileIcon = (fileName: string) => {
    const ext = fileName.split('.').pop()?.toLowerCase();
    if (['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'].includes(ext || '')) return <Image className="w-4 h-4 text-accent" />;
    if (['txt', 'md', 'json', 'xml', 'yaml', 'log'].includes(ext || '')) return <FileText className="w-4 h-4 text-info" />;
    if (['pdf'].includes(ext || '')) return <FileText className="w-4 h-4 text-danger" />;
    return <File className="w-4 h-4 text-foreground-muted" />;
  };

  const formatSize = (bytes: number): string => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    return `${(bytes / (1024 * 1024 * 1024)).toFixed(1)} GB`;
  };

  if (!showFileBrowser) return null;

  return (
    <Modal isOpen={showFileBrowser} onClose={() => setShowFileBrowser(false)} title="FILE_SYSTEM_EXPLORER // v4.0" size="xl">
      <div className="flex flex-col h-full min-h-[500px]">
        {/* Path Bar */}
        <div className="flex items-center gap-2 mb-4 p-3 bg-background-deep/60 border border-border-default rounded-lg">
          <button onClick={() => navigateTo(DEFAULT_PATH)} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Root" aria-label="Root directory">
            <HardDrive className="w-4 h-4 text-accent" />
          </button>
          <button onClick={goUp} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Go up" aria-label="Go up one directory">
            <ArrowLeft className="w-4 h-4 text-foreground-muted" />
          </button>
          <div className="flex-1 flex items-center gap-1 text-xs font-mono text-foreground-muted overflow-x-auto whitespace-nowrap px-2">
            {currentPath.split('\\').filter(Boolean).map((part, idx, arr) => (
              <span key={idx} className="flex items-center gap-1">
                <span className="text-accent font-bold">{part}</span>
                {idx < arr.length - 1 && <ChevronRight className="w-3 h-3 opacity-40" />}
              </span>
            ))}
          </div>
          <button onClick={() => refetch()} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Refresh" aria-label="Refresh file list">
            <RefreshCw className={`w-4 h-4 text-foreground-muted ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>

        {/* Search & Actions */}
        <div className="flex items-center gap-3 mb-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-foreground-muted" />
            <input
              type="text"
              value={searchPattern}
              onChange={e => setSearchPattern(e.target.value)}
              placeholder="Filter by pattern (e.g. *.tsx)..."
              className="w-full bg-background-deep border border-border-default rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-foreground placeholder:text-foreground-muted/50 focus:border-accent/50 outline-none transition-colors"
            />
          </div>
          <button onClick={() => { setShowNewFolder(true); setShowNewFolder(true); }}
            className="flex items-center gap-2 px-3 py-2 bg-accent/10 hover:bg-accent/20 text-accent border border-accent/30 rounded-lg text-[10px] font-bold uppercase tracking-widest transition-all"
            title="Create folder" aria-label="Create new folder">
            <Plus className="w-3.5 h-3.5" /> Folder
          </button>
        </div>

        {/* New Folder Input */}
        <AnimatePresence>
          {showNewFolder && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-4 overflow-hidden">
              <Input value={newFolderName} onChange={e => setNewFolderName(e.target.value)}
                placeholder="folder_name" className="flex-1 font-mono text-xs"
                onKeyDown={e => { if (e.key === 'Enter') handleCreateFolder(); if (e.key === 'Escape') setShowNewFolder(false); }} />
              <Button size="sm" onClick={handleCreateFolder} isLoading={createFolderMutation.isPending}>Create</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowNewFolder(false)}>Cancel</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Rename / Copy-Move dialogs */}
        <AnimatePresence>
          {showRename && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-4 overflow-hidden">
              <Input value={renameValue} onChange={e => setRenameValue(e.target.value)}
                placeholder="new name" className="flex-1 font-mono text-xs"
                onKeyDown={e => { if (e.key === 'Enter') handleRename(); if (e.key === 'Escape') setShowRename(false); }} />
              <Button size="sm" onClick={handleRename} isLoading={renameFileMutation.isPending}>Rename</Button>
              <Button size="sm" variant="ghost" onClick={() => setShowRename(false)}>Cancel</Button>
            </motion.div>
          )}
          {showCopyMove && (
            <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
              className="flex items-center gap-2 mb-4 overflow-hidden">
              <Input value={destPath} onChange={e => setDestPath(e.target.value)}
                placeholder="destination path" className="flex-1 font-mono text-xs"
                onKeyDown={e => { if (e.key === 'Enter') handleCopyMove(); if (e.key === 'Escape') { setShowCopyMove(null); } }} />
              <Button size="sm" onClick={handleCopyMove} isLoading={copyFileMutation.isPending || moveFileMutation.isPending}>
                {showCopyMove === 'copy' ? 'Copy' : 'Move'}
              </Button>
              <Button size="sm" variant="ghost" onClick={() => setShowCopyMove(null)}>Cancel</Button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* File List */}
        <div className="flex-1 overflow-y-auto border border-border-default rounded-lg bg-background-deep/40">
          {isLoading ? (
            <div className="flex items-center justify-center h-48">
              <RefreshCw className="w-6 h-6 animate-spin text-accent/50" />
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center h-48 text-danger gap-3">
              <X className="w-8 h-8" />
              <span className="text-xs font-mono">Failed to load directory</span>
              <Button size="sm" variant="ghost" onClick={() => refetch()}>Retry</Button>
            </div>
          ) : files.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-48 text-foreground-muted/50 gap-3">
              <Folder className="w-10 h-10" />
              <span className="text-xs font-mono">Empty directory</span>
            </div>
          ) : (
            <div className="divide-y divide-border-subtle">
              {/* Folders */}
              {folders.map(f => (
                <div key={f.path}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-low transition-colors cursor-pointer group ${selectedFile === f.path ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
                  onDoubleClick={() => navigateTo(f.path)}
                  onClick={() => setSelectedFile(f.path === selectedFile ? null : f.path)}>
                  <Folder className="w-4 h-4 text-accent shrink-0" />
                  <span className="flex-1 text-sm font-mono text-foreground truncate">{f.name}</span>
                  <span className="text-[10px] font-mono text-foreground-muted">{new Date(f.modified_at).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); setRenameValue(f.name); setShowRename(true); }}
                      className="p-1 hover:bg-surface-hover rounded" title="Rename" aria-label="Rename"><Edit3 className="w-3 h-3 text-foreground-muted" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); setShowCopyMove('copy'); }}
                      className="p-1 hover:bg-surface-hover rounded" title="Copy" aria-label="Copy"><Copy className="w-3 h-3 text-foreground-muted" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); setShowCopyMove('move'); }}
                      className="p-1 hover:bg-surface-hover rounded" title="Move" aria-label="Move"><Move className="w-3 h-3 text-foreground-muted" /></button>
                    <button onClick={(e) => { e.stopPropagation(); handleDelete(f.path); }}
                      className="p-1 hover:bg-danger/10 rounded" title="Delete" aria-label="Delete"><Trash2 className="w-3 h-3 text-danger" /></button>
                  </div>
                </div>
              ))}
              {/* Files */}
              {regularFiles.map(f => (
                <div key={f.path}
                  className={`flex items-center gap-3 px-4 py-2.5 hover:bg-surface-low transition-colors group ${selectedFile === f.path ? 'bg-accent/5 border-l-2 border-accent' : ''}`}
                  onClick={() => setSelectedFile(f.path === selectedFile ? null : f.path)}>
                  {getFileIcon(f.name)}
                  <span className="flex-1 text-sm font-mono text-foreground truncate">{f.name}</span>
                  <span className="text-[10px] font-mono text-foreground-muted">{formatSize(f.size)}</span>
                  <span className="text-[10px] font-mono text-foreground-muted">{new Date(f.modified_at).toLocaleDateString()}</span>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); setRenameValue(f.name); setShowRename(true); }}
                      className="p-1 hover:bg-surface-hover rounded" title="Rename" aria-label="Rename"><Edit3 className="w-3 h-3 text-foreground-muted" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); setShowCopyMove('copy'); }}
                      className="p-1 hover:bg-surface-hover rounded" title="Copy" aria-label="Copy"><Copy className="w-3 h-3 text-foreground-muted" /></button>
                    <button onClick={(e) => { e.stopPropagation(); setSelectedFile(f.path); handleDelete(f.path); }}
                      className="p-1 hover:bg-danger/10 rounded" title="Delete" aria-label="Delete"><Trash2 className="w-3 h-3 text-danger" /></button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-3 text-[10px] font-mono text-foreground-muted">
          <span>{files.length} items</span>
          <span className="opacity-60">Double-click folder to open</span>
        </div>
      </div>
    </Modal>
  );
};
