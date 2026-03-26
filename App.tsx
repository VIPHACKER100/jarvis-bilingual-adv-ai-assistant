import { useState, useEffect, useRef, FC } from 'react';
import { ArcReactor } from './components/ArcReactor';
import { HistoryLog } from './components/HistoryLog';
import { VolumeControl } from './components/VolumeControl';
import { PermissionModal } from './components/PermissionModal';
import { ConfirmationModal } from './src/components/ConfirmationModal';
import { MemoryViewer } from './src/components/MemoryViewer';
import { AutomationDashboard } from './src/components/AutomationDashboard';
import { DesktopControls } from './components/DesktopControls';
import { MediaTools } from './components/MediaTools';
import { SettingsModal } from './src/components/SettingsModal';
import { CommandResult, AppMode, Language } from './types';
import { voiceService } from './services/voiceService';
import { useJarvisBridge } from './src/hooks/useJarvisBridge';
import { INITIAL_VOLUME } from './constants';
import { sfx } from './utils/audioUtils';

const App: FC = () => {
  const [mode, setMode] = useState<AppMode>(AppMode.IDLE);
  const [transcript, setTranscript] = useState<string>("");
  const [history, setHistory] = useState<CommandResult[]>([]);
  const [volume, setVolume] = useState<number>(INITIAL_VOLUME);

  // Default to Hindi-India to support bilingual/mixed usage better
  const [language, setLanguage] = useState<Language>(Language.HINDI);
  const [showPermissionModal, setShowPermissionModal] = useState(false);
  const [showMemoryViewer, setShowMemoryViewer] = useState(false);
  const [showAutomationDashboard, setShowAutomationDashboard] = useState(false);
  const [showAdvancedHelper, setShowAdvancedHelper] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  // Backend integration
  const {
    isConnected,
    connectionStatus,
    systemStatus,
    sendCommand,
    lastResponse,
    pendingConfirmation,
    confirmCommand,
    error: bridgeError,
    reconnect,
  } = useJarvisBridge();

  // References to manage state in async callbacks
  const processingRef = useRef(false);
  // Ref to track if the app is effectively "ON" to handle the loop logic
  const isActiveRef = useRef(false);

  useEffect(() => {
    // Proactive Permission Check
    if (navigator.permissions && navigator.permissions.query) {
      navigator.permissions.query({ name: 'microphone' as PermissionName })
        .then((permissionStatus) => {
          if (permissionStatus.state === 'denied') {
            setShowPermissionModal(true);
            addToHistory({
              transcript: "",
              response: "SYSTEM ALERT: Microphone access denied / माइक्रोफ़ोन एक्सेस अस्वीकार।",
              actionType: "ERROR",
              language: 'en',
              timestamp: Date.now(),
              isSystemMessage: true
            });
          }
        })
        .catch(() => {
          // Ignore if permission API is not supported or fails
        });
    }

    // Initial System Check Log
    addToHistory({
      transcript: "System Init...",
      response: "JARVIS Online. Waiting for activation.",
      actionType: "SYSTEM",
      language: 'en',
      timestamp: Date.now(),
      isSystemMessage: true
    });

    // Set initial voice service language
    voiceService.setLanguage(language);

    return () => {
      // Cleanup on unmount
      isActiveRef.current = false;
      voiceService.stopListening();
    }
  }, []);

  // Update voice service when user toggles language
  useEffect(() => {
    voiceService.setLanguage(language);
  }, [language]);

  // Handle backend responses
  useEffect(() => {
    if (lastResponse) {
      // Handle volume updates from backend
      if (lastResponse.command_key === 'volume_up' && lastResponse.success) {
        setVolume(lastResponse.volume || Math.min(volume + 10, 100));
        sfx.playBlip();
      } else if (lastResponse.command_key === 'volume_down' && lastResponse.success) {
        setVolume(lastResponse.volume || Math.max(volume - 10, 0));
        sfx.playBlip();
      }

      // Add to history
      addToHistory({
        transcript: transcript,
        response: lastResponse.response,
        actionType: lastResponse.command_key.toUpperCase(),
        language: lastResponse.language,
        timestamp: Date.now()
      });

      // Speak response
      setMode(AppMode.SPEAKING);
      voiceService.speak(lastResponse.response, lastResponse.language);

      // Reset after speaking delay
      setTimeout(() => {
        processingRef.current = false;
        if (isActiveRef.current) {
          startListening();
        } else {
          setMode(AppMode.IDLE);
        }
      }, 2000);
    }
  }, [lastResponse]);

  // Handle bridge errors
  useEffect(() => {
    if (bridgeError) {
      console.error('Backend error:', bridgeError);
      addToHistory({
        transcript: "",
        response: `Backend Error: ${bridgeError}`,
        actionType: "ERROR",
        language: language === Language.HINDI ? 'hi' : 'en',
        timestamp: Date.now(),
        isSystemMessage: true
      });
    }
  }, [bridgeError]);

  const addToHistory = (entry: CommandResult) => {
    setHistory(prev => [...prev, entry]);
  };

  const handleCommandResult = async (text: string, isFinal: boolean) => {
    setTranscript(text);

    if (isFinal && !processingRef.current) {
      processingRef.current = true;
      setMode(AppMode.PROCESSING);

      // Send command to backend
      const langCode =
        language === Language.HINGLISH ? 'hinglish' :
          language === Language.HINDI ? 'hi' : 'en';
      sendCommand(text, langCode as any);
    }
  };

  const handleError = (error: string) => {
    // Only log unexpected errors to console to reduce noise
    if (error !== 'not-allowed' && error !== 'no-speech') {
      console.error("Speech Error:", error);
    }

    let userMessage = "";
    let isCritical = false;

    // Bilingual Error Mapping
    const errorMessages: Record<string, { en: string, hi: string }> = {
      'not-allowed': {
        en: "ACCESS DENIED. Microphone permissions required.",
        hi: "एक्सेस अस्वीकार। माइक्रोफ़ोन अनुमति की आवश्यकता है।"
      },
      'not-supported': {
        en: "Browser not supported. Use Chrome or Edge.",
        hi: "ब्राउज़र समर्थित नहीं है। कृपया क्रोम या एज का उपयोग करें।"
      },
      'network': {
        en: "Network error. Checking connectivity...",
        hi: "नेटवर्क त्रुटि। कनेक्टिविटी की जांच कर रहा हूँ..."
      },
      'audio-capture': {
        en: "Audio capture failed. Check microphone.",
        hi: "ऑडियो कैप्चर विफल। माइक्रोफ़ोन की जांच करें।"
      },
      'start-failed': {
        en: "Initialization failed. Please refresh page.",
        hi: "आरंभ करने में विफल। कृपया पेज रिफ्रेश करें।"
      }
    };

    if (error === 'no-speech') {
      // Silence timeout - not critical, just stop the visual loop until restart or manual
      if (isActiveRef.current) {
        // Restart immediately without error logging for seamless feel
        startListening();
        return;
      }
    } else if (error === 'aborted') {
      // 'aborted' often happens on tab switch/refresh or stopListening call. Ignore.
      processingRef.current = false;
      return;
    } else if (errorMessages[error]) {
      const isHindi = language === Language.HINDI;
      userMessage = isHindi ? errorMessages[error].hi : errorMessages[error].en;
      isCritical = true;

      if (error === 'not-allowed') {
        setShowPermissionModal(true);
      }
    } else {
      // Generic fallback
      userMessage = language === Language.HINDI
        ? `सिस्टम त्रुटि: ${error}`
        : `System Error: ${error}`;
      isCritical = true;
    }

    if (isCritical) {
      setMode(AppMode.IDLE);
      isActiveRef.current = false; // Stop the loop
      setTranscript(userMessage);

      // Speak the critical error so the user knows why it stopped
      const speakLang = language === Language.HINGLISH ? 'hinglish' : (language === Language.HINDI ? 'hi' : 'en');
      voiceService.speak(userMessage, speakLang as any);

      addToHistory({
        transcript: "",
        response: userMessage,
        actionType: "ERROR",
        language: language === Language.HINDI ? 'hi' : 'en',
        timestamp: Date.now(),
        isSystemMessage: true
      });
    }

    processingRef.current = false;
  };

  const startListening = () => {
    // If not active, don't start (safety check for async calls)
    if (!isActiveRef.current) return;

    setMode(AppMode.LISTENING);
    setTranscript(""); // Clear previous transcript for new command

    voiceService.startListening(
      handleCommandResult,
      () => {
        // onEnd: The service stopped.
        if (isActiveRef.current && !processingRef.current) {
          // Small delay to prevent tight loops
          setTimeout(() => startListening(), 100);
        }
      },
      handleError
    );
  };

  const stopListening = () => {
    isActiveRef.current = false;
    setMode(AppMode.IDLE);
    voiceService.stopListening();
    processingRef.current = false;
  };

  const toggleActivation = () => {
    if (isActiveRef.current) {
      stopListening();
    } else {
      isActiveRef.current = true;
      startListening();
    }
  };

  const toggleLanguage = () => {
    setLanguage(prev => {
      if (prev === Language.ENGLISH) return Language.HINDI;
      if (prev === Language.HINDI) return Language.HINGLISH;
      return Language.ENGLISH;
    });
  };

  const handleConfirmAction = () => {
    confirmCommand(true);
  };

  const handleCancelAction = () => {
    confirmCommand(false);
    processingRef.current = false;
    if (isActiveRef.current) {
      startListening();
    } else {
      setMode(AppMode.IDLE);
    }
  };

  // Format system stats for display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const formatUptime = (seconds: number) => {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    return `${hours}h ${minutes}m`;
  };

  return (
    <div className="min-h-screen w-full flex flex-col items-center bg-black relative overflow-x-hidden">

      {/* Background Grid/Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(rgba(6,182,212,0.05)_1px,transparent_1px),linear-gradient(90deg,rgba(6,182,212,0.05)_1px,transparent_1px)] bg-[size:40px_40px] pointer-events-none"></div>
      <div className="absolute inset-0 bg-radial-gradient from-transparent to-black pointer-events-none"></div>

      {/* Header / Language Toggle */}
      <header className="relative w-full max-w-6xl p-4 md:p-8 flex flex-col md:flex-row justify-between items-center z-20 gap-4">
        <div className="text-center md:text-left">
          <h1 className="text-3xl md:text-4xl font-bold tracking-[0.3em] text-cyan-400 drop-shadow-[0_0_15px_rgba(6,182,212,0.8)]">
            JARVIS
          </h1>
          <p className="text-[10px] md:text-xs text-slate-500 tracking-[0.4em] uppercase mt-2">Personal AI Assistant // Bilingual Protocol</p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          {/* Connection Status */}
          <div className={`flex items-center gap-2 text-[10px] font-mono tracking-wider px-3 py-1 rounded border ${isConnected
            ? 'border-green-500/50 text-green-400 bg-green-500/10'
            : connectionStatus === 'connecting'
              ? 'border-yellow-500/50 text-yellow-400 bg-yellow-500/10'
              : 'border-red-500/50 text-red-400 bg-red-500/10'
            }`}>
            <span className={`w-2 h-2 rounded-full animate-pulse ${isConnected ? 'bg-green-400' : connectionStatus === 'connecting' ? 'bg-yellow-400' : 'bg-red-400'
              }`}></span>
            <span>{isConnected ? 'BACKEND ONLINE' : connectionStatus === 'connecting' ? 'CONNECTING...' : 'BACKEND OFFLINE'}</span>
            {!isConnected && (
              <button
                onClick={reconnect}
                className="ml-2 text-cyan-400 hover:text-cyan-300 underline"
              >
                Retry
              </button>
            )}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowSettingsModal(true)}
              className="bg-slate-900/60 border border-slate-700/50 p-2 md:p-1.5 rounded-sm text-slate-400 hover:border-cyan-500 hover:text-cyan-400 transition-all duration-300 backdrop-blur-md shadow-lg group"
              title="System Configuration"
            >
              <svg className="w-5 h-5 group-hover:rotate-90 transition-transform duration-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
            <button
              onClick={toggleLanguage}
              className="flex items-center space-x-3 bg-slate-900/60 border border-slate-700/50 px-5 py-2 md:px-4 md:py-1.5 rounded-sm text-xs tracking-widest hover:border-cyan-500 transition-all duration-300 backdrop-blur-md shadow-lg"
            >
              <span className={language === Language.ENGLISH ? "text-cyan-400 font-bold" : "text-slate-600"}>EN</span>
              <span className="text-slate-800">|</span>
              <span className={language === Language.HINDI ? "text-orange-400 font-bold" : "text-slate-600"}>हिंदी</span>
              <span className="text-slate-800">|</span>
              <span className={language === Language.HINGLISH ? "text-purple-400 font-bold" : "text-slate-600"}>HI-EN</span>
            </button>
          </div>
          <div className="text-[9px] font-mono text-slate-600 uppercase tracking-widest">
            Mode: {language === Language.HINGLISH ? 'Hinglish (Latin)' : language === Language.HINDI ? 'Hi-IN (Native)' : 'En-US'}
          </div>
        </div>
      </header>

      {/* Main UI Container */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-10 md:space-y-16 px-4 py-6">

        <div className="h-8 flex items-center justify-center">
          {mode === AppMode.LISTENING && (
            <span className="text-cyan-400 tracking-widest animate-pulse font-mono text-sm md:text-base">
              LISTENING / सुन रहा हूँ...
            </span>
          )}
          {mode === AppMode.PROCESSING && (
            <span className="text-orange-400 tracking-widest animate-pulse font-mono text-sm md:text-base">
              PROCESSING / कार्य हो रहा है...
            </span>
          )}
          {mode === AppMode.SPEAKING && (
            <span className="text-cyan-400 tracking-widest font-mono text-sm md:text-base">
              RESPONDING...
            </span>
          )}
          {mode === AppMode.IDLE && (
            <span className="text-slate-600 tracking-widest font-mono text-xs md:text-sm">
              STANDBY
            </span>
          )}
        </div>

        {/* Central Reactor */}
        <ArcReactor
          isActive={mode !== AppMode.IDLE}
          onClick={toggleActivation}
          language={language === Language.HINDI ? 'hi' : 'en'}
        />

        {/* Transcript Display */}
        <div className="w-full max-w-lg text-center min-h-[60px] px-2 md:px-0">
          {transcript && (
            <div className="bg-slate-900/50 border-x border-cyan-500/30 p-3 md:p-4 relative backdrop-blur-sm">
              <div className="absolute top-0 left-0 w-2 h-2 border-t border-l border-cyan-500"></div>
              <div className="absolute top-0 right-0 w-2 h-2 border-t border-r border-cyan-500"></div>
              <div className="absolute bottom-0 left-0 w-2 h-2 border-b border-l border-cyan-500"></div>
              <div className="absolute bottom-0 right-0 w-2 h-2 border-b border-r border-cyan-500"></div>
              <p className="text-base md:text-xl text-white font-light tracking-wide font-sans">
                "{transcript}"
              </p>
            </div>
          )}
        </div>

        {/* Bottom Modules */}
        <div className="flex flex-col md:flex-row gap-8 w-full items-center md:items-start justify-center">
          <HistoryLog history={history} />
          <div className="flex flex-col space-y-6 w-full md:w-auto items-center md:items-start">
            <VolumeControl level={volume} />

            {/* Real System Status Panel */}
            {systemStatus && systemStatus.success && (
              <div className="border border-cyan-500/30 bg-slate-900/60 p-4 w-full md:w-64 text-[10px] font-mono rounded-sm backdrop-blur-sm">
                <style>{`
                  .battery-bar-width { width: ${systemStatus.battery?.percent != null ? systemStatus.battery.percent : 0}%; }
                  .cpu-bar-width { width: ${systemStatus.cpu ? Math.min(systemStatus.cpu.percent, 100) : 0}%; }
                `}</style>
                <div className="text-cyan-400 uppercase tracking-wider mb-3 pb-2 border-b border-cyan-500/20">
                  SYSTEM STATUS
                </div>

                {/* Battery */}
                {systemStatus.battery?.percent !== null && (
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-slate-400">BATTERY</span>
                    <div className="flex items-center gap-2">
                      <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full battery-bar-width ${systemStatus.battery.is_charging
                            ? 'bg-green-500 animate-pulse'
                            : systemStatus.battery.percent < 20
                              ? 'bg-red-500'
                              : 'bg-cyan-500'
                            }`}
                        ></div>
                      </div>
                      <span className={systemStatus.battery.percent < 20 ? 'text-red-400' : 'text-cyan-400'}>
                        {systemStatus.battery.percent}%
                      </span>
                    </div>
                  </div>
                )}

                {/* CPU */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">CPU</span>
                  <div className="flex items-center gap-2">
                    <div className="w-16 h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full cpu-bar-width ${systemStatus.cpu.percent > 80 ? 'bg-red-500' : 'bg-cyan-500'
                          }`}
                      ></div>
                    </div>
                    <span className={systemStatus.cpu.percent > 80 ? 'text-red-400' : 'text-cyan-400'}>
                      {systemStatus.cpu.percent.toFixed(0)}%
                    </span>
                  </div>
                </div>

                {/* Memory */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">MEMORY</span>
                  <span className="text-cyan-400">{formatBytes(systemStatus.memory.used)} / {formatBytes(systemStatus.memory.total)}</span>
                </div>

                {/* Volume */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">VOLUME</span>
                  <span className="text-cyan-400">{systemStatus.volume}%</span>
                </div>

                {/* Uptime */}
                <div className="flex justify-between items-center mb-2">
                  <span className="text-slate-400">UPTIME</span>
                  <span className="text-cyan-400">{formatUptime(systemStatus.uptime)}</span>
                </div>

                {/* Platform */}
                <div className="flex justify-between items-center pt-2 border-t border-slate-700/50">
                  <span className="text-slate-500">PLATFORM</span>
                  <span className="text-green-400 uppercase">{systemStatus.platform}</span>
                </div>
              </div>
            )}

            {/* Fallback Stats Panel */}
            {!systemStatus && (
              <div className="border border-slate-800 bg-slate-900/40 p-4 w-full md:w-64 text-[10px] font-mono grid grid-cols-2 gap-x-4 gap-y-2 rounded-sm backdrop-blur-sm">
                <div className="flex justify-between border-b border-slate-800/50 pb-1"><span>CPU</span><span className="text-cyan-600">--%</span></div>
                <div className="flex justify-between border-b border-slate-800/50 pb-1"><span>MEM</span><span className="text-cyan-600">--%</span></div>
                <div className="flex justify-between"><span>NET</span><span className="text-green-600 uppercase">Online</span></div>
                <div className="flex justify-between"><span>MIC</span><span className={mode !== AppMode.IDLE ? "text-red-500 animate-pulse font-bold" : "text-slate-600"}>{mode !== AppMode.IDLE ? "ACTIVE" : "OFFLINE"}</span></div>
              </div>
            )}
          </div>
        </div>

        {/* Advanced Tools Toggle */}
        <div className="w-full flex flex-col items-center gap-4">
          <button
            onClick={() => setShowAdvancedHelper(!showAdvancedHelper)}
            className="text-cyan-500/50 hover:text-cyan-400 text-[10px] tracking-[0.2em] uppercase border-b border-transparent hover:border-cyan-500/50 transition-all"
          >
            {showAdvancedHelper ? 'Hide Advanced Tools' : 'Show Advanced Tools'}
          </button>

          {showAdvancedHelper && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl animate-in fade-in slide-in-from-bottom-4 duration-500">
              <DesktopControls language={language === Language.HINDI ? 'hi' : 'en'} />
              <MediaTools language={language === Language.HINDI ? 'hi' : 'en'} />
            </div>
          )}
        </div>

      </main>

      {/* Permission Modal */}
      <PermissionModal
        isOpen={showPermissionModal}
        onClose={() => setShowPermissionModal(false)}
        language={language === Language.HINDI ? 'hi' : 'en'}
      />

      {/* Confirmation Modal for Dangerous Commands */}
      <ConfirmationModal
        isOpen={!!pendingConfirmation}
        confirmation={pendingConfirmation}
        onConfirm={handleConfirmAction}
        onCancel={handleCancelAction}
      />

      {/* Memory Viewer */}
      <MemoryViewer
        isOpen={showMemoryViewer}
        onClose={() => setShowMemoryViewer(false)}
      />

      {/* Automation Dashboard */}
      <AutomationDashboard
        isOpen={showAutomationDashboard}
        onClose={() => setShowAutomationDashboard(false)}
      />

      {/* Settings Modal */}
      <SettingsModal
        isOpen={showSettingsModal}
        onClose={() => setShowSettingsModal(false)}
        onSettingsUpdated={(updated) => {
          // If native language changed, update active state
          if (updated.language === 'en') setLanguage(Language.ENGLISH);
          else if (updated.language === 'hi') setLanguage(Language.HINDI);
          else if (updated.language === 'hinglish') setLanguage(Language.HINGLISH);
        }}
      />

      {/* Phase 4 Quick Access Buttons */}
      <div className="fixed bottom-4 right-4 z-30 flex gap-2">
        <button
          onClick={() => setShowMemoryViewer(true)}
          className="bg-slate-800/80 hover:bg-slate-700 border border-cyan-500/30 text-cyan-400 px-3 py-2 rounded-lg backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2 text-sm"
          title="View Memory & History"
        >
          <span>🧠</span>
          <span className="hidden md:inline">Memory</span>
        </button>
        <button
          onClick={() => setShowAutomationDashboard(true)}
          className="bg-slate-800/80 hover:bg-slate-700 border border-purple-500/30 text-purple-400 px-3 py-2 rounded-lg backdrop-blur-sm transition-all hover:scale-105 flex items-center gap-2 text-sm"
          title="Automation & Macros"
        >
          <span>⚡</span>
          <span className="hidden md:inline">Auto</span>
        </button>
      </div>

      {/* Footer / Branding */}
      <footer className="relative w-full flex flex-col items-center space-y-4 z-20 mt-auto py-10 bg-black/60 backdrop-blur-sm border-t border-slate-900">
        <div className="flex flex-wrap justify-center gap-6 text-[10px] md:text-xs font-mono tracking-widest">
          <a href="https://aryanahirwar.in" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">Website</a>
          <a href="https://github.com/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">GitHub</a>
          <a href="https://linkedin.com/in/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">LinkedIn</a>
          <a href="https://instagram.com/viphacker100" target="_blank" rel="noopener noreferrer" className="text-slate-500 hover:text-cyan-400 transition-colors uppercase border-b border-transparent hover:border-cyan-400 pb-1">Instagram</a>
        </div>
        <div className="text-slate-700 text-[8px] md:text-[9px] tracking-[0.4em] font-light uppercase text-center px-4 leading-loose">
          VIPHACKER100 OS V2.2.0 | DESIGNED & DEVELOPED BY <br className="md:hidden" />
          <span className="text-slate-500 font-bold border-b border-slate-800">VIPHACKER100 (ARYAN AHIRWAR)</span>
        </div>
      </footer>
    </div>
  );
};

export default App;
