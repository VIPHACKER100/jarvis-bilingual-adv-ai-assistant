import React, { useState } from 'react';
import { useJarvisBridge } from '../src/hooks/useJarvisBridge';

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
            type: 'Type'
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
            type: 'प्रकार'
        }
    };

    const t = labels[language];

    return (
        <div className="border border-purple-500/30 bg-slate-900/60 p-4 w-full text-xs font-mono rounded-sm backdrop-blur-sm mt-4">
            <div className="text-purple-400 uppercase tracking-wider mb-3 pb-2 border-b border-purple-500/20">
                {t.title}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Batch PDF */}
                <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-[10px] uppercase">{t.batchPdf}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={folderPath}
                            onChange={(e) => setFolderPath(e.target.value)}
                            placeholder={t.placeholder}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded w-full focus:border-purple-500 outline-none"
                        />
                        <button
                            onClick={() => send(`convert images in ${folderPath} to pdf`)}
                            className="bg-purple-500/20 hover:bg-purple-500/40 text-purple-400 px-3 py-1 rounded border border-purple-500/50"
                        >
                            📄
                        </button>
                    </div>
                </div>

                {/* Scan Folder */}
                <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-[10px] uppercase">{t.scanFolder}</span>
                    <div className="flex gap-2">
                        <select
                            value={scanType}
                            onChange={(e) => setScanType(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded w-1/3 focus:border-purple-500 outline-none"
                        >
                            <option value="all">All</option>
                            <option value="media">Media</option>
                            <option value="pdf">PDF</option>
                            <option value="docs">Docs</option>
                        </select>
                        <input
                            type="text"
                            placeholder={t.scanPlaceholder}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded w-2/3 focus:border-purple-500 outline-none"
                            onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                    send(`scan folder ${e.currentTarget.value} for ${scanType}`);
                                }
                            }}
                        />
                    </div>
                </div>

                {/* Quick Tools */}
                <div className="grid grid-cols-3 gap-2 col-span-1 md:col-span-2 mt-2">
                    <button
                        onClick={() => send('make drawing')}
                        className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-yellow-400 p-2 rounded border border-yellow-500/30 transition-all hover:scale-105"
                    >
                        <span className="text-xl">🎨</span>
                        <span className="text-[9px] uppercase">{t.drawing}</span>
                    </button>

                    <button
                        onClick={() => send('get selected text')}
                        className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 p-2 rounded border border-cyan-500/30 transition-all hover:scale-105"
                    >
                        <span className="text-xl">📋</span>
                        <span className="text-[9px] uppercase">{t.selection}</span>
                    </button>

                    <button
                        onClick={() => send('ocr image')}
                        className="flex flex-col items-center justify-center gap-1 bg-slate-800 hover:bg-slate-700 text-green-400 p-2 rounded border border-green-500/30 transition-all hover:scale-105"
                    >
                        <span className="text-xl">👁️</span>
                        <span className="text-[9px] uppercase">{t.ocr}</span>
                    </button>
                </div>
            </div>
        </div>
    );
};
