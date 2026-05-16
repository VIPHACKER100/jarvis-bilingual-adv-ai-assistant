import React, { useState } from 'react';
import { useJarvisBridge } from '../hooks/useJarvisBridge';

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
            out: 'Out',
            theme: 'System Theme',
            dark: 'Dark',
            light: 'Light',
            icons: 'Desktop Icons',
            center: 'Center Active Window'
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
            in: 'बड़ा',
            out: 'छोटा',
            theme: 'सिस्टम थीम',
            dark: 'डार्क',
            light: 'लाइट',
            icons: 'डेस्कटॉप आइकन्स',
            center: 'विंडो बीच में लाओ'
        }
    };

    const t = labels[language];

    const inputStyle = "w-full bg-surface border border-border-default text-foreground px-3 py-1.5 rounded-lg focus:border-accent/60 outline-none transition-colors text-xs";
    const btnStyle = "bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover text-foreground-muted hover:text-foreground py-1.5 rounded-lg transition-all text-[10px] uppercase tracking-wide";
    const btnAccent = "bg-accent/15 hover:bg-accent/25 text-accent px-3 py-1.5 rounded-lg border border-accent/30 hover:border-accent/50 transition-all text-xs font-bold";

    return (
        <div className="glass-card w-full text-xs font-mono">
            <div className="text-accent uppercase tracking-[0.2em] text-[10px] font-bold mb-4 pb-2 border-b border-border-default flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-accent"></span>
                {t.title}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Wallpaper */}
                <div className="flex flex-col gap-2">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.wallpaper}</span>
                    <div className="flex gap-2">
                        <input
                            type="text"
                            value={wallpaperPath}
                            onChange={(e) => setWallpaperPath(e.target.value)}
                            placeholder={t.placeholder}
                            className={inputStyle}
                        />
                        <button
                            onClick={() => send(`change wallpaper to ${wallpaperPath}`)}
                            className={btnAccent}
                        >
                            GO
                        </button>
                    </div>
                </div>

                {/* Theme & Icons */}
                <div className="grid grid-cols-2 gap-2">
                    <div className="flex flex-col gap-1">
                        <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.theme}</span>
                        <div className="flex gap-1">
                            <button
                                onClick={() => send('set theme to dark')}
                                className={`flex-1 ${btnStyle}`}
                            >
                                🌙 {t.dark}
                            </button>
                            <button
                                onClick={() => send('set theme to light')}
                                className={`flex-1 ${btnStyle} hover:text-yellow-400`}
                            >
                                ☀️ {t.light}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col gap-1">
                        <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.icons}</span>
                        <button
                            onClick={() => send('toggle desktop icons')}
                            className={`${btnStyle} h-full text-accent`}
                        >
                            🖥️ TOGGLE
                        </button>
                    </div>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mt-4">
                {/* Taskbar */}
                <div className="flex flex-col gap-1">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.taskbar}</span>
                    <div className="flex gap-1">
                        <button
                            onClick={() => send(language === 'hi' ? 'taskbar dikhao' : 'show taskbar')}
                            className={`flex-1 ${btnStyle} text-accent`}
                        >
                            {t.show}
                        </button>
                        <button
                            onClick={() => send(language === 'hi' ? 'taskbar chhupao' : 'hide taskbar')}
                            className={`flex-1 ${btnStyle}`}
                        >
                            {t.hide}
                        </button>
                    </div>
                </div>

                {/* Zoom */}
                <div className="flex flex-col gap-1">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">{t.zoom}</span>
                    <div className="flex gap-2">
                        <button
                            onClick={() => send('zoom in')}
                            className={`flex-1 ${btnStyle} hover:text-green-400`}
                        >
                            🔍+ {t.in}
                        </button>
                        <button
                            onClick={() => send('zoom out')}
                            className={`flex-1 ${btnStyle} hover:text-orange-400`}
                        >
                            🔍- {t.out}
                        </button>
                    </div>
                </div>

                {/* Center Window */}
                <div className="flex flex-col gap-1">
                    <span className="text-foreground-muted text-[10px] uppercase tracking-wide">Window</span>
                    <button
                        onClick={() => send('center window')}
                        className={`${btnStyle} h-full text-accent`}
                    >
                        🎯 {t.center}
                    </button>
                </div>
            </div>

            {/* Recycle Bin */}
            <div className="mt-4 pt-3 border-t border-border-default">
                <button
                    onClick={() => send(language === 'hi' ? 'recycle bin khali karo' : 'empty recycle bin')}
                    className="w-full bg-red-500/10 hover:bg-red-500/20 text-red-400 px-2 py-2 rounded-lg border border-red-500/20 hover:border-red-500/40 transition-all flex items-center justify-center gap-2"
                >
                    🗑️ {t.recycleConfirm}
                </button>
            </div>
        </div>
    );
};
