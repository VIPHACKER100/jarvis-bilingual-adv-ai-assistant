import React, { useState } from 'react';
import { useJarvisBridge } from '../src/hooks/useJarvisBridge';

interface DesktopControlsProps {
    language: 'en' | 'hi';
}

export const DesktopControls: React.FC<DesktopControlsProps> = ({ language }) => {
    const { sendCommand } = useJarvisBridge();
    const [wallpaperPath, setWallpaperPath] = useState('');

    const send = (text: string) => {
        sendCommand(text, language);
    };

    const labels = {
        en: {
            title: 'DESKTOP CONTROL',
            wallpaper: 'Set Wallpaper',
            recycle: 'Empty Trash',
            recycleConfirm: 'Empty Recycle Bin',
            taskbar: 'Taskbar',
            zoom: 'Zoom',
            placeholder: 'Image Path...',
            show: 'Show',
            hide: 'Hide',
            in: 'In',
            out: 'Out'
        },
        hi: {
            title: 'डेस्कटॉप कंट्रोल',
            wallpaper: 'वॉलपेपर बदलें',
            recycle: 'ट्रैश खाली करें',
            recycleConfirm: 'रिसाइकिल बिन खाली करें',
            taskbar: 'टास्कबार',
            zoom: 'ज़ूम',
            placeholder: 'इमेज पथ...',
            show: 'दिखाओ',
            hide: 'छुपाओ',
            in: 'बड़ा',
            out: 'छोटा'
        }
    };

    const t = labels[language];

    return (
        <div className="border border-cyan-500/30 bg-slate-900/60 p-4 w-full text-xs font-mono rounded-sm backdrop-blur-sm mt-4">
            <div className="text-cyan-400 uppercase tracking-wider mb-3 pb-2 border-b border-cyan-500/20">
                {t.title}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wallpaper */}
                <div className="flex flex-col gap-2">
                    <span className="text-slate-400 text-[10px] uppercase">{t.wallpaper}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={wallpaperPath}
                            onChange={(e) => setWallpaperPath(e.target.value)}
                            placeholder={t.placeholder}
                            className="bg-slate-800 border border-slate-700 text-slate-300 px-2 py-1 rounded w-full focus:border-cyan-500 outline-none"
                        />
                        <button
                            onClick={() => send(`change wallpaper to ${wallpaperPath}`)}
                            className="bg-cyan-500/20 hover:bg-cyan-500/40 text-cyan-400 px-3 py-1 rounded border border-cyan-500/50"
                        >
                            GO
                        </button>
                    </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-2 gap-2">
                    {/* Recycle Bin */}
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px] uppercase">{t.recycle}</span>
                        <button
                            onClick={() => send(language === 'hi' ? 'recycle bin khali karo' : 'empty recycle bin')}
                            className="bg-red-500/10 hover:bg-red-500/30 text-red-400 px-2 py-2 rounded border border-red-500/30 transition-all"
                        >
                            🗑️ {t.recycleConfirm}
                        </button>
                    </div>

                    {/* Taskbar */}
                    <div className="flex flex-col gap-1">
                        <span className="text-slate-400 text-[10px] uppercase">{t.taskbar}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => send(language === 'hi' ? 'taskbar dikhao' : 'show taskbar')}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-cyan-400 py-1 rounded border border-slate-700"
                            >
                                {t.show}
                            </button>
                            <button
                                onClick={() => send(language === 'hi' ? 'taskbar chhupao' : 'hide taskbar')}
                                className="flex-1 bg-slate-800 hover:bg-slate-700 text-slate-400 py-1 rounded border border-slate-700"
                            >
                                {t.hide}
                            </button>
                        </div>
                    </div>
                </div>
            </div>

            {/* Zoom */}
            <div className="flex flex-col gap-1 mt-3">
                <span className="text-slate-400 text-[10px] uppercase">{t.zoom}</span>
                <div className="flex gap-2">
                    <button
                        onClick={() => send('zoom in')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-green-400 py-1 rounded border border-slate-700"
                    >
                        🔍+ {t.in}
                    </button>
                    <button
                        onClick={() => send('zoom out')}
                        className="flex-1 bg-slate-800 hover:bg-slate-700 text-orange-400 py-1 rounded border border-slate-700"
                    >
                        🔍- {t.out}
                    </button>
                </div>
            </div>
        </div>
    );
};
