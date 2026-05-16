import React, { useState } from 'react';
import { useJarvisBridge } from '../hooks/useJarvisBridge';

interface MediaToolsProps {
    language: 'en' | 'hi';
}

export const MediaTools: React.FC<MediaToolsProps> = ({ language }) => {
    const { sendCommand } = useJarvisBridge();
    const [folderPath, setFolderPath] = useState('');
    const [scanType, setScanType] = useState('all');

    const send = (text: string) => {
        sendCommand(text, language);
    };

    const labels = {
        en: {
            title: 'MEDIA TOOLS',
            batchPdf: 'Batch Images to PDF',
            scanFolder: 'Scan Folder',
            ocr: 'Extract Text',
            drawing: 'Make Drawing',
            selection: 'Read Selection',
            placeholder: 'Folder Path...',
            scanPlaceholder: 'Folder to scan...',
            convert: 'Convert',
            scan: 'Scan',
            type: 'Type',
            readPdf: 'Read PDF Aloud',
            narrate: 'Narrate Screen',
            summary: 'Screen Summary'
        },
        hi: {
            title: 'मीडिया टूल्स',
            batchPdf: 'इमेज से पीडीएफ',
            scanFolder: 'फोल्डर स्कैन',
            ocr: 'टेक्स्ट निकालें',
            drawing: 'ड्राइंग बनायें',
            selection: 'चयन पढ़ें',
            placeholder: 'फोल्डर पथ...',
            scanPlaceholder: 'स्कैन करने के लिए फोल्डर...',
            convert: 'बदलें',
            scan: 'खोजें',
            type: 'प्रकार',
            readPdf: 'पीडीएफ पढ़ें',
            narrate: 'स्क्रीन सुनाओ',
            summary: 'स्क्रीन सारांश'
        }
    };

    const t = labels[language];

    const inputStyle = "w-full bg-surface border border-border-default text-foreground px-3 py-1.5 rounded-lg focus:border-accent/60 outline-none transition-colors text-xs";
    const btnStyle = "bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover text-foreground-muted hover:text-foreground py-1.5 rounded-lg transition-all text-[10px] uppercase tracking-wide";
    const btnAccent = "bg-accent/15 hover:bg-accent/25 text-accent px-3 py-1.5 rounded-lg border border-accent/30 hover:border-accent/50 transition-all";

    return (
        <div className="glass-card w-full text-xs font-mono">
            <div className="text-accent uppercase tracking-[0.2em] text-[10px] font-bold mb-4 pb-2 border-b border-border-default flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-purple-400"></span>
                {t.title}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch PDF */}
                <div className="flex flex-col gap-2">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.batchPdf}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                            placeholder={t.placeholder}
                            className={inputStyle}
                        />
                        <button
                            onClick={() => send(`convert images in ${folderPath} to pdf`)}
                            className={btnAccent}
                        >
                            📄
                        </button>
                    </div>
                </div>

                {/* Read PDF */}
                <div className="flex flex-col gap-2">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.readPdf}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            placeholder="PDF Path..."
                            className={inputStyle}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    send(`read pdf ${e.currentTarget.value}`);
                                }
                            }}
                        />
                        <button
                            onClick={(e) => {
                                const input = e.currentTarget.previousElementSibling as HTMLInputElement;
                                send(`read pdf ${input.value}`);
                            }}
                            className={btnAccent}
                        >
                            🔊
                        </button>
                    </div>
                </div>

                {/* Scan Folder */}
                <div className="flex flex-col gap-2">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.scanFolder}</span>
                    <div className="flex gap-2">
                        <select
                            value={scanType}
                            onChange={(e) => setScanType(e.target.value)}
                            title={t.type}
                            className={`${inputStyle} w-1/3`}
                        >
                            <option value="all">All</option>
                            <option value="media">Media</option>
                            <option value="pdf">PDF</option>
                            <option value="docs">Docs</option>
                        </select>
                        <input
                            type="text"
                            placeholder={t.scanPlaceholder}
                            className={`${inputStyle} w-2/3`}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    send(`scan folder ${e.currentTarget.value} for ${scanType}`);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Narrate & Summary */}
                <div className="grid grid-cols-2 gap-2 mt-auto">
                    <button
                        onClick={() => send('narrate screen')}
                        className={`${btnStyle} text-accent`}
                    >
                        🎤 {t.narrate}
                    </button>
                    <button
                        onClick={() => send('screen summary')}
                        className={`${btnStyle} hover:text-purple-400`}
                    >
                        📝 {t.summary}
                    </button>
                </div>
            </div>

            {/* Quick Tools */}
            <div className="grid grid-cols-3 gap-2 mt-4 pt-3 border-t border-border-default">
                <button
                    onClick={() => send('make drawing')}
                    className={`flex flex-col items-center justify-center gap-1 ${btnStyle} p-2.5 hover:text-yellow-400 hover:border-yellow-500/30`}
                >
                    <span className="text-xl">🎨</span>
                    <span className="text-[9px] uppercase">{t.drawing}</span>
                </button>

                <button
                    onClick={() => send('get selected text')}
                    className={`flex flex-col items-center justify-center gap-1 ${btnStyle} p-2.5 text-accent`}
                >
                    <span className="text-xl">📋</span>
                    <span className="text-[9px] uppercase">{t.selection}</span>
                </button>

                <button
                    onClick={() => send('ocr image')}
                    className={`flex flex-col items-center justify-center gap-1 ${btnStyle} p-2.5 hover:text-green-400 hover:border-green-500/30`}
                >
                    <span className="text-xl">👁️</span>
                    <span className="text-[9px] uppercase">{t.ocr}</span>
                </button>
            </div>
        </div>
    );
};
