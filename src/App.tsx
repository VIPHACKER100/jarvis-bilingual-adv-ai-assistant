import { useState, useEffect, useRef, FC } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Settings, Globe, Activity, X } from 'lucide-react';
import { ArcReactor } from './components/ArcReactor';
import { HistoryLog } from './components/HistoryLog';
import { VolumeControl } from './components/VolumeControl';
import { PermissionModal } from './components/PermissionModal';
import { ConfirmationModal } from './components/ConfirmationModal';
import { MemoryViewer } from './components/MemoryViewer';
import { AutomationDashboard } from './components/AutomationDashboard';
import { DesktopControls } from './components/DesktopControls';
import { MediaTools } from './components/MediaTools';
import { SettingsModal } from './components/SettingsModal';
import { SystemDiagnostics } from './components/SystemDiagnostics';
import { CommandResult, AppMode, Language } from './types';
import { voiceService } from './services/voiceService';
import { apiClient } from './services/apiClient';
import { VisionOverlay } from './components/VisionOverlay';
import { useJarvisBridge } from './hooks/useJarvisBridge';
import { useTheme } from './hooks/useTheme';
import { INITIAL_VOLUME } from './constants';
import { sfx } from './utils/audioUtils';

import { NotificationProvider, useNotifications } from './context/NotificationContext';
import { NotificationCenter } from './components/NotificationCenter';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { MobileDashboard } from './components/MobileDashboard';

const App: FC = () => {
  return (
    <NotificationProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/" element={<AppContent />} />
          <Route path="/mobile" element={<MobileDashboard />} />
        </Routes>
      </BrowserRouter>
    </NotificationProvider>
  );
};

const AppContent: FC = () => {
  // Initialize theme system — sets CSS variables from stored preference
  useTheme();

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
  const [currentSuggestion, setCurrentSuggestion] = useState<string | null>(null);

  const { addNotification } = useNotifications();

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

  // Handle connection changes
  useEffect(() => {
    if (isConnected) {
      addNotification({
        type: 'success',
        title: 'System Online',
        message: 'Neural bridge established with JARVIS backend.',
        duration: 4000
      });
    } else if (connectionStatus === 'disconnected') {
      addNotification({
        type: 'error',
        title: 'System Offline',
        message: 'Backend connection lost. Retrying...',
        duration: 0 // Stay until fixed
      });
    }
  }, [isConnected, connectionStatus, addNotification]);

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
            addNotification({
              type: 'error',
              title: 'Permission Denied',
              message: 'Microphone access is restricted. Check browser settings.',
              duration: 8000
            });
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

  // Vision state
  const [visionData, setVisionData] = useState<{ isOpen: boolean; content: string; metadata?: any }>({
    isOpen: false,
    content: ''
  });

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

      if (lastResponse.action_type === 'MACRO_STARTED' && lastResponse.success) {
        addNotification({
          type: 'system',
          title: 'Macro Sequence Triggered',
          message: `Executing [${lastResponse.macro_name}]`,
          duration: 3000
        });
        sfx.playBlip();
      }

      // Handle OCR/Vision responses
      if (lastResponse.command_key.includes('ocr') || lastResponse.command_key === 'get_selected_text') {
        if (lastResponse.success && lastResponse.response) {
          setVisionData({
            isOpen: true,
            content: lastResponse.response,
            metadata: lastResponse.data
          });
          sfx.playBlip(); // Reverting to playBlip to avoid type error
        }
      }

      // Handle proactive suggestions
      if (lastResponse.suggestion) {
        setCurrentSuggestion(lastResponse.suggestion);
        // Clear suggestion after 8 seconds if not replaced
        setTimeout(() => {
          setCurrentSuggestion(prev => prev === lastResponse.suggestion ? null : prev);
        }, 8000);
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

  const [settings, setSettings] = useState<any>(null);

  // Load backend settings on mount
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        const res = await apiClient.getSettings();
        if (res.success) setSettings(res.settings);
      } catch (e) {
        console.error("Failed to load settings in App:", e);
      }
    };
    fetchSettings();
  }, []);

  const handleCommandResult = async (text: string, isFinal: boolean) => {
    setTranscript(text);

    if (isFinal && !processingRef.current) {
      const lowerText = text.toLowerCase().trim();
      
      // Wake Word Logic
      if (settings?.wake_word_enabled) {
        const phrase = settings.wake_word_phrase?.toLowerCase() || 'jarvis';
        if (!lowerText.includes(phrase)) {
          // No wake word, just resume listening silently
          if (isActiveRef.current) startListening();
          return;
        }
        
        // Notification for wake word detection
        if (lowerText === phrase || lowerText === phrase + '.') {
           addNotification({
             type: 'system',
             title: 'Voice Activated',
             message: 'System is now listening for your command, sir.',
             duration: 2000
           });
           sfx.playBlip();
        }
        
        // Strip wake word for backend processing
        // But if it was ONLY the wake word, we should probably wait for more
        const cleanText = lowerText.replace(phrase, '').trim();
        if (!cleanText) {
          // Just heard wake word, don't send to backend yet, let the user speak
          if (isActiveRef.current) startListening();
          return;
        }
        
        // Full command with wake word, proceed
        text = cleanText;
      }

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


  return (
    <div className="relative min-h-screen w-full flex flex-col items-center justify-center p-4 md:p-8 overflow-hidden select-none">
      <NotificationCenter />
      
      {/* Linear Modern Background System */}
      <div className="linear-bg"></div>
      <div className="grid-overlay"></div>
      
      {/* Animated Ambient Blobs */}
      <div className="ambient-blob w-[800px] h-[800px] bg-accent/20 top-[-200px] left-1/2 -translate-x-1/2 blur-[150px]"></div>
      <div className="ambient-blob w-[600px] h-[600px] bg-purple-500/10 bottom-[-100px] right-[-100px] blur-[120px]" style={{ animationDelay: '-5s' }}></div>

      {/* Modern Header */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative z-20 w-full max-w-6xl flex justify-between items-center mb-8 px-4"
      >
        <div className="flex flex-col">
          <h1 className="text-3xl md:text-5xl font-bold tracking-tight gradient-text-linear">
            JARVIS <span className="accent-text-linear text-2xl md:text-4xl ml-2">v3.4.0</span>
          </h1>
          <p className="text-[10px] md:text-xs font-mono text-foreground-muted tracking-widest uppercase mt-2">
            Neural Interface // Active_Status: Online
          </p>
        </div>

        <div className="flex flex-col items-center md:items-end gap-3">
          <div className="flex items-center gap-4">
            {/* Connection Status */}
            <div className={`flex items-center gap-2 text-[10px] font-mono tracking-widest px-3 py-1.5 rounded-full border border-border-default bg-surface ${isConnected ? 'text-green-400' : 'text-red-400 animate-pulse'}`}>
              <span className={`w-1.5 h-1.5 rounded-full ${isConnected ? 'bg-green-400 shadow-[0_0_8px_rgba(74,222,128,0.5)]' : 'bg-red-400'}`}></span>
              <span>{isConnected ? 'Neural_Link: Active' : 'Neural_Link: Offline'}</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => { sfx.playSelect(); setShowSettingsModal(true); }}
                className="p-2 rounded-lg bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover transition-all group"
                title="System Settings"
              >
                <Settings className="w-4 h-4 text-foreground-muted group-hover:text-foreground group-hover:rotate-45 transition-transform" />
              </button>
              
              <button
                onClick={() => { sfx.playSelect(); toggleLanguage(); }}
                className="flex items-center gap-3 px-4 py-2 rounded-lg bg-surface border border-border-default hover:bg-surface-hover hover:border-border-hover transition-all group"
              >
                <div className="flex items-center gap-1.5 font-mono text-[10px] tracking-tighter">
                  <span className={language === Language.ENGLISH ? "text-accent font-bold" : "text-foreground-muted"}>EN</span>
                  <span className="text-border-default">/</span>
                  <span className={language === Language.HINDI ? "text-accent font-bold" : "text-foreground-muted"}>HI</span>
                  <span className="text-border-default">/</span>
                  <span className={language === Language.HINGLISH ? "text-accent font-bold" : "text-foreground-muted"}>HE</span>
                </div>
                <Globe className="w-3.5 h-3.5 text-foreground-muted group-hover:text-accent transition-colors" />
              </button>
            </div>
          </div>
          <div className="text-[9px] font-mono text-foreground-muted uppercase tracking-[0.2em] opacity-60">
            Node_Identifier: {language === Language.HINGLISH ? 'HI_EN_PARSER' : language === Language.HINDI ? 'NATIVE_HINDI_v2' : 'UNIVERSAL_ENGLISH'}
          </div>
        </div>
      </motion.header>

      {/* Main UI Container */}
      <main className="relative z-10 flex flex-col items-center w-full max-w-4xl space-y-10 md:space-y-16 px-4 py-6">

        <div className="flex flex-col items-center gap-1.5 transition-all duration-700">
          {mode === AppMode.LISTENING && (
            <div className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-accent animate-ping" />
              <span className="text-accent tracking-[0.4em] font-mono text-[10px] uppercase">Listening</span>
            </div>
          )}
          {mode === AppMode.SPEAKING && (
            <div className="flex items-center gap-2">
              <div className="flex gap-1">
                {[1, 2, 3].map(i => (
                  <motion.div 
                    key={i}
                    animate={{ height: [4, 12, 4] }}
                    transition={{ repeat: Infinity, duration: 0.6, delay: i * 0.1 }}
                    className="w-1 bg-accent rounded-full"
                  />
                ))}
              </div>
              <span className="text-accent tracking-[0.4em] font-mono text-[10px] uppercase">Responding</span>
            </div>
          )}
          {mode === AppMode.PROCESSING && (
            <span className="text-indigo-400 tracking-[0.4em] font-mono text-[10px] animate-pulse uppercase">
              Processing_Data...
            </span>
          )}
          {mode === AppMode.IDLE && (
            <span className="text-slate-500/70 tracking-[0.3em] font-mono text-xs md:text-sm">
              SYSTEM STANDBY
            </span>
          )}
        </div>

        {/* Central Reactor */}
        <ArcReactor
          isActive={mode !== AppMode.IDLE}
          onClick={toggleActivation}
          language={language === Language.HINDI ? 'hi' : 'en'}
        />

        {/* Smart Suggestion HUD */}
        {currentSuggestion && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 20 }}
            className="w-full max-w-xl z-30 px-4"
          >
            <div className="glass-panel p-4 border border-accent/20 bg-accent/5 backdrop-blur-2xl rounded-xl relative overflow-hidden group">
              <div className="flex items-start gap-4">
                <div className="w-8 h-8 rounded-lg bg-accent/10 flex items-center justify-center flex-shrink-0 border border-accent/20">
                  <Activity className="w-4 h-4 text-accent" />
                </div>
                <div className="flex-1">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[9px] font-mono text-accent tracking-[0.2em] uppercase font-bold">Neural_Inference // Suggestion</span>
                    <button 
                      onClick={() => setCurrentSuggestion(null)}
                      className="text-foreground-muted hover:text-foreground transition-colors p-1"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </div>
                  <p className="text-sm text-foreground/90 leading-relaxed font-medium">
                    {currentSuggestion}
                  </p>
                </div>
              </div>
              <div className="absolute bottom-0 left-0 h-0.5 bg-accent/10 w-full">
                <motion.div 
                  initial={{ width: "100%" }}
                  animate={{ width: "0%" }}
                  transition={{ duration: 8, ease: "linear" }}
                  className="h-full bg-accent"
                />
              </div>
            </div>
          </motion.div>
        )}

        {/* Transcript Display */}
        <div className="w-full max-w-2xl text-center min-h-[100px] px-4 md:px-0 z-20 flex items-center justify-center">
          <AnimatePresence mode="wait">
            {transcript && (
              <motion.div 
                key={transcript}
                initial={{ opacity: 0, scale: 0.98, filter: "blur(4px)" }}
                animate={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
                exit={{ opacity: 0, scale: 1.02, filter: "blur(4px)" }}
                className="relative px-8 py-6"
              >
                <div className="absolute top-0 left-0 w-4 h-4 border-t border-l border-accent/40" />
                <div className="absolute bottom-0 right-0 w-4 h-4 border-b border-r border-accent/40" />
                
                <p className="text-xl md:text-3xl text-foreground font-medium tracking-tight font-sans leading-tight">
                  {transcript}
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Bottom Modules */}
        <div className="flex flex-col md:flex-row gap-8 w-full items-center md:items-start justify-center">
          <HistoryLog history={history} />
          <div className="flex flex-col space-y-6 w-full md:w-auto items-center md:items-start">
            <VolumeControl level={volume} />

            {/* Real System Status Panel */}
            {systemStatus && systemStatus.success && (
              <SystemDiagnostics systemStatus={systemStatus} />
            )}

            {/* Fallback Stats Panel */}
            {!systemStatus && (
              <div className="glass-panel p-4 w-full md:w-64 text-[10px] sm:text-xs font-mono grid grid-cols-2 gap-x-4 gap-y-3 rounded-lg backdrop-blur-md hover:border-purple-500/40 transition-all">
                <div className="flex justify-between border-b border-slate-700/40 pb-1.5"><span className="text-slate-400">CPU</span><span className="text-cyan-400 font-bold">--%</span></div>
                <div className="flex justify-between border-b border-slate-700/40 pb-1.5"><span className="text-slate-400">MEM</span><span className="text-purple-400 font-bold">--%</span></div>
                <div className="flex justify-between"><span className="text-slate-400">NET</span><span className="text-green-400 uppercase font-bold drop-shadow-[0_0_5px_rgba(74,222,128,0.5)]">Online</span></div>
                <div className="flex justify-between"><span className="text-slate-400">MIC</span><span className={mode !== AppMode.IDLE ? "text-pink-500 animate-pulse font-bold drop-shadow-[0_0_5px_rgba(236,72,153,0.5)]" : "text-slate-600"}>{mode !== AppMode.IDLE ? "ACTIVE" : "OFFLINE"}</span></div>
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

      {/* Security Confirmation Modal */}
      <ConfirmationModal
        isOpen={!!pendingConfirmation}
        confirmation={pendingConfirmation}
        onConfirm={() => confirmCommand(true)}
        onCancel={() => confirmCommand(false)}
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
          setSettings(updated); // Sync local settings state
          // If native language changed, update active state
          if (updated.language === 'en') setLanguage(Language.ENGLISH);
          else if (updated.language === 'hi') setLanguage(Language.HINDI);
          else if (updated.language === 'hinglish') setLanguage(Language.HINGLISH);
        }}
      />

      {/* Phase 4 Quick Access Buttons */}
      <div className="fixed bottom-6 right-6 z-30 flex flex-col sm:flex-row gap-3">
        <button
          onClick={() => setShowMemoryViewer(true)}
          className="glass-panel text-cyan-400 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(6,182,212,0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide"
          title="View Memory & History"
        >
          <span className="text-lg">🧠</span>
          <span className="hidden md:inline">Neural Core</span>
        </button>
        <button
          onClick={() => setShowAutomationDashboard(true)}
          className="glass-panel text-purple-400 px-4 py-2.5 rounded-xl transition-all hover:-translate-y-1 hover:shadow-[0_0_20px_rgba(139,92,246,0.3)] flex items-center justify-center gap-2 text-sm font-medium tracking-wide"
          title="Automation & Macros"
        >
          <span className="text-lg">⚡</span>
          <span className="hidden md:inline">Automations</span>
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
          VIPHACKER100 OS V3.4.0 | DESIGNED & DEVELOPED BY <br className="md:hidden" />
          <span className="text-slate-500 font-bold border-b border-slate-800">VIPHACKER100 (ARYAN AHIRWAR)</span>
        </div>
      </footer>
      {/* JARVIS Vision Overlay */}
      <VisionOverlay 
        isOpen={visionData.isOpen}
        content={visionData.content}
        metadata={visionData.metadata}
        onClose={() => setVisionData(prev => ({ ...prev, isOpen: false }))}
      />
    </div>
  );
};

export default App;
