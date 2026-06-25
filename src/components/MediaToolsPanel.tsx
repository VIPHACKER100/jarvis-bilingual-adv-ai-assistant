import { FC, useState } from 'react';
import {
  ScanText, Image, FileText,
  Camera, Clipboard, Upload, Sparkles,
} from 'lucide-react';
import { useJarvisStore } from '../store/jarvisStore';
import { useNotifications } from '../context/NotificationContext';
import { apiClient } from '../services/apiClient';
import { Modal } from './ui/Modal';
import { Button } from './ui/Button';
import { Tabs } from './ui/Tabs';

type MediaTab = 'ocr' | 'image' | 'pdf';

export const MediaToolsPanel: FC = () => {
  const { showMediaTools, setShowMediaTools } = useJarvisStore();
  const { addNotification } = useNotifications();
  const [activeTab, setActiveTab] = useState<MediaTab>('ocr');

  // OCR state
  const [ocrResult, setOcrResult] = useState<string | null>(null);
  const [ocrLoading, setOcrLoading] = useState(false);
  const [ocrPath, setOcrPath] = useState('');

  // Image state
  const [imagePath, setImagePath] = useState('');
  const [imageFormat, setImageFormat] = useState('png');
  const [imageResult, setImageResult] = useState<string | null>(null);
  const [imageLoading, setImageLoading] = useState(false);

  // PDF state
  const [pdfPath, setPdfPath] = useState('');
  const [pdfResult, setPdfResult] = useState<string | null>(null);
  const [pdfLoading, setPdfLoading] = useState(false);

  // OCR Handler
  const handleOCR = async () => {
    setOcrLoading(true);
    setOcrResult(null);
    try {
      if (activeTab === 'ocr') {
        // Screen OCR (default, no path needed)
        const res = await apiClient.ocrScreen();
        setOcrResult(res.text || 'No text detected');
      }
      addNotification({ type: 'success', title: 'OCR Complete', message: 'Text extracted', duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'OCR Failed', message: 'Could not perform OCR', duration: 4000 });
      setOcrResult('Error: OCR failed');
    }
    setOcrLoading(false);
  };

  const handleOCRFromFile = async () => {
    if (!ocrPath.trim()) return;
    setOcrLoading(true);
    setOcrResult(null);
    try {
      const res = await apiClient.ocrImage(ocrPath);
      setOcrResult(res.text || 'No text detected');
      addNotification({ type: 'success', title: 'File OCR Complete', message: 'Text extracted from file', duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'File OCR Failed', message: 'Could not read file', duration: 4000 });
    }
    setOcrLoading(false);
  };

  // Image: Convert
  const handleConvert = async () => {
    if (!imagePath.trim()) return;
    setImageLoading(true);
    setImageResult(null);
    try {
      const res = await apiClient.convertImage(imagePath, imageFormat);
      setImageResult(`Converted → ${res.output_path}`);
      addNotification({ type: 'success', title: 'Image Converted', message: `Saved to ${res.output_path}`, duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'Convert Failed', message: 'Could not convert image', duration: 4000 });
    }
    setImageLoading(false);
  };

  // PDF: Extract
  const handlePDFExtract = async () => {
    if (!pdfPath.trim()) return;
    setPdfLoading(true);
    setPdfResult(null);
    try {
      const res = await apiClient.ocrPdf(pdfPath);
      const texts = res.pages.map(p => `[Page ${p.page}]\n${p.text}`).join('\n\n');
      setPdfResult(texts || 'No text extracted');
      addNotification({ type: 'success', title: 'PDF Extracted', message: `${res.pages.length} pages processed`, duration: 3000 });
    } catch {
      addNotification({ type: 'error', title: 'PDF Failed', message: 'Could not extract PDF', duration: 4000 });
    }
    setPdfLoading(false);
  };

  if (!showMediaTools) return null;

  const TAB_ITEMS = [
    { id: 'ocr', label: 'OCR', icon: <ScanText className="w-3.5 h-3.5" /> },
    { id: 'image', label: 'Image', icon: <Image className="w-3.5 h-3.5" /> },
    { id: 'pdf', label: 'PDF', icon: <FileText className="w-3.5 h-3.5" /> },
  ];

  return (
    <Modal isOpen={showMediaTools} onClose={() => setShowMediaTools(false)} title="MEDIA_TOOLS_SUITE // v4.0" size="lg">
      <div className="flex flex-col gap-4 min-h-[420px]">
        <Tabs tabs={TAB_ITEMS} activeTab={activeTab} onChange={(id) => setActiveTab(id as MediaTab)} />

        {/* OCR Tab */}
        {activeTab === 'ocr' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3 mb-2">
              <ScanText className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Screen Capture</span>
            </div>

            <Button onClick={handleOCR} disabled={ocrLoading} isLoading={ocrLoading} className="w-full">
              <Camera className="w-4 h-4 mr-2" /> Capture & OCR Screen
            </Button>

            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-border-subtle" />
              </div>
              <div className="relative flex justify-center text-[9px] font-mono text-foreground-muted">
                <span className="px-2 bg-background-base">or from file path</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <input value={ocrPath} onChange={e => setOcrPath(e.target.value)}
                placeholder="C:\path\to\image.png"
                className="flex-1 bg-background-deep border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-foreground-muted/40 focus:border-accent/50 outline-none transition-colors" />
              <Button onClick={handleOCRFromFile} disabled={!ocrPath.trim() || ocrLoading} variant="secondary" size="sm">
                <Upload className="w-3.5 h-3.5" />
              </Button>
            </div>

            {ocrResult && (
              <div className="p-4 bg-background-deep border border-accent/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-mono text-accent uppercase tracking-widest">Extracted Text</h4>
                  <button onClick={() => navigator.clipboard.writeText(ocrResult)} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Copy to clipboard" aria-label="Copy OCR result">
                    <Clipboard className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                </div>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap max-h-48 overflow-y-auto">{ocrResult}</pre>
              </div>
            )}
          </div>
        )}

        {/* Image Tab */}
        {activeTab === 'image' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <Image className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Convert Image</span>
            </div>
            <input value={imagePath} onChange={e => setImagePath(e.target.value)}
              placeholder="C:\path\to\image.png"
              className="w-full bg-background-deep border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-foreground placeholder:text-foreground-muted/40 focus:border-accent/50 outline-none transition-colors" />
            <div className="flex gap-3">
              <select value={imageFormat} onChange={e => setImageFormat(e.target.value)}
                className="bg-background-deep border border-border-default rounded-lg px-3 py-2 text-xs font-mono text-foreground">
                <option value="png">PNG</option>
                <option value="jpg">JPEG</option>
                <option value="webp">WebP</option>
                <option value="bmp">BMP</option>
              </select>
              <Button onClick={handleConvert} disabled={!imagePath.trim() || imageLoading} isLoading={imageLoading} variant="secondary" className="flex-1">
                <Sparkles className="w-4 h-4 mr-2" /> Convert
              </Button>
            </div>
            {imageResult && (
              <div className="p-3 bg-background-deep border border-accent/20 rounded-lg text-xs font-mono text-foreground">
                {imageResult}
              </div>
            )}
          </div>
        )}

        {/* PDF Tab */}
        {activeTab === 'pdf' && (
          <div className="space-y-4">
            <div className="flex items-center gap-3">
              <FileText className="w-5 h-5 text-accent" />
              <span className="text-[10px] font-mono text-foreground-muted uppercase tracking-widest">Extract PDF Text</span>
            </div>
            <div className="flex items-center gap-2 p-3 bg-background-deep/40 border border-border-default rounded-lg">
              <input value={pdfPath} onChange={e => setPdfPath(e.target.value)}
                placeholder="C:\path\to\document.pdf"
                className="flex-1 bg-background-deep border-0 text-xs font-mono text-foreground placeholder:text-foreground-muted/40 outline-none" />
            </div>
            <Button onClick={handlePDFExtract} disabled={!pdfPath.trim() || pdfLoading} isLoading={pdfLoading} className="w-full">
              <FileText className="w-4 h-4 mr-2" /> Extract Text
            </Button>

            {pdfResult && (
              <div className="p-4 bg-background-deep border border-accent/20 rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-[10px] font-mono text-accent uppercase tracking-widest">Extracted Text</h4>
                  <button onClick={() => navigator.clipboard.writeText(pdfResult)} className="p-1.5 hover:bg-surface-hover rounded transition-colors" title="Copy text" aria-label="Copy PDF text">
                    <Clipboard className="w-3.5 h-3.5 text-foreground-muted" />
                  </button>
                </div>
                <pre className="text-xs font-mono text-foreground whitespace-pre-wrap max-h-64 overflow-y-auto">{pdfResult}</pre>
              </div>
            )}
          </div>
        )}

        <div className="flex justify-end pt-2 border-t border-border-subtle">
          <span className="text-[8px] font-mono text-foreground-muted/50">File paths reference files on the server</span>
        </div>
      </div>
    </Modal>
  );
};
