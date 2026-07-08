import React, { useState, useEffect, useCallback, useRef } from 'react';
import { ArcReactor } from './components/ArcReactor';
import { StatusDisplay } from './components/StatusDisplay';
import { LogPanel } from './components/LogPanel';
import { VolumeVisualizer } from './components/VolumeVisualizer';
import { ContactManager } from './components/ContactManager';
import { useSpeechRecognition } from './hooks/useSpeechRecognition';
import { useTextToSpeech } from './hooks/useTextToSpeech';
import { processCommand } from './utils/commandHandler';
import { LogEntry, SystemState, ContactsMap } from './types';
import { COMMAND_CONSTANTS, CONTACTS as DEFAULT_CONTACTS } from './constants';
import { ShieldAlert, Globe, Wifi, Cpu, Database } from 'lucide-react';

export default function App() {
  const [systemState, setSystemState] = useState<SystemState>('IDLE');
  const [logs, setLogs] = useState<LogEntry[]>([]);
  const [volume, setVolume] = useState<number>(50);
  const [lastTranscript, setLastTranscript] = useState<string>('');
  
  // Contact Management State
  const [contacts, setContacts] = useState<ContactsMap>(() => {
    const saved = localStorage.getItem('JARVIS_CONTACTS');
    return saved ? JSON.parse(saved) : DEFAULT_CONTACTS;
  });
  const [isContactManagerOpen, setIsContactManagerOpen] = useState(false);

  // Persist contacts when they change
  useEffect(() => {
    localStorage.setItem('JARVIS_CONTACTS', JSON.stringify(contacts));
  }, [contacts]);
  
  const { speak, isSpeaking, stopSpeaking } = useTextToSpeech();
  
  const handleCommandResult = useCallback(async (transcript: string) => {
    setLastTranscript(transcript);
    addLog('INPUT', `Voice detected: "${transcript}"`);
    
    // Pass dynamic contacts to processor
    const result = processCommand(transcript, contacts);
    
    if (result.action === 'UNKNOWN') {
      addLog('SYSTEM', 'Processing natural language query...');
      try {
        const response = await fetch('/api/chat', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ prompt: transcript }),
        });
        
        if (!response.ok) {
          throw new Error('Network response was not ok');
        }
        
        const data = await response.json();
        
        if (data.error) {
          addLog('ERROR', data.error);
          speak(data.error);
        } else if (data.text) {
          addLog('SYSTEM', `J.A.R.V.I.S.: ${data.text}`);
          speak(data.text);
        }
      } catch (error) {
        addLog('ERROR', 'Connection to neural network failed.');
        speak('Connection to neural network failed.');
      }
      return;
    }

    addLog('ACTION', `Executing: ${result.description}`);
    
    // Execute Action
    switch (result.action) {
      case 'NAVIGATE':
      case 'YOUTUBE_SEARCH':
      case 'GOOGLE_SEARCH':
        speak(result.response || '');
        if (result.target) window.open(result.target, '_blank');
        break;
        
      case 'CALCULATOR':
      case 'SYSTEM_REPORT':
      case 'TIME_DATE':
        speak(result.response || '');
        break;
        
      case 'WHATSAPP_MESSAGE':
        setSystemState('PROCESSING');
        speak(`Initiating secure connection. Please scan QR code if required. Sending message to ${result.payload.name} in 15 seconds.`);
        addLog('SYSTEM', 'Opening WhatsApp Web...');
        window.open('https://web.whatsapp.com', '_blank');
        
        // Delayed sending
        setTimeout(() => {
          addLog('SYSTEM', `Redirecting to chat with ${result.payload.name}...`);
          window.open(result.target, '_blank');
          setSystemState('LISTENING');
          speak(`Message channel opened for ${result.payload.name}.`);
        }, 15000);
        break;
        
      case 'VOLUME_CONTROL':
        const change = result.payload === 'UP' ? 10 : -10;
        setVolume(prev => Math.min(100, Math.max(0, prev + change)));
        speak(result.response || '');
        break;
    }

  }, [speak, contacts]); // Add contacts dependency

  const { isListening, startListening, stopListening, error } = useSpeechRecognition(handleCommandResult);

  // Manage System State based on Listening
  useEffect(() => {
    if (systemState === 'PROCESSING') return; // Don't override processing state
    
    if (isListening) {
      setSystemState('LISTENING');
    } else {
      setSystemState('IDLE');
    }
  }, [isListening, systemState]);

  // Handle Speech Errors
  useEffect(() => {
    if (error) {
      if (error === 'not-allowed') {
        addLog('ERROR', 'ACCESS DENIED: Microphone permission is required.');
        speak("Access denied. Please enable microphone permissions to proceed.");
      } else if (error === 'no-speech') {
        // Ignore no-speech, just silence
        return;
      } else {
        addLog('ERROR', `System Error: ${error}`);
        speak("Sensors malfunction.");
      }
      stopListening();
    }
  }, [error, speak, stopListening]);

  const addLog = (type: LogEntry['type'], message: string) => {
    setLogs(prev => [{
      id: Date.now().toString() + Math.random(),
      timestamp: new Date(),
      type,
      message
    }, ...prev].slice(0, 50));
  };

  const toggleActivation = () => {
    if (systemState === 'IDLE') {
      speak("Systems initialized. J.A.R.V.I.S. online.");
      startListening();
      addLog('SYSTEM', 'System Activated. Listening for commands...');
    } else {
      stopListening();
      stopSpeaking();
      setSystemState('IDLE');
      addLog('SYSTEM', 'System Deactivated. Standby mode.');
    }
  };

  // Initial greeting log
  useEffect(() => {
    addLog('SYSTEM', 'Initializing J.A.R.V.I.S. Protocol...');
    addLog('SYSTEM', 'Waiting for user activation...');
  }, []);

  return (
    <div className="min-h-screen w-full bg-black text-cyan-400 relative overflow-hidden scanline flex flex-col items-center justify-center p-4">
      
      {/* Background Decor */}
      <div className="absolute inset-0 pointer-events-none opacity-20 bg-[radial-gradient(circle_at_center,_var(--tw-gradient-stops))] from-gray-800 via-black to-black"></div>
      <div className="absolute top-0 left-0 w-full h-full opacity-10" 
           style={{ backgroundImage: 'linear-gradient(rgba(0, 255, 255, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 255, 0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}>
      </div>

      {/* Header / Top Bar */}
      <div className="absolute top-0 left-0 w-full p-6 flex justify-between items-start z-20">
        <div className="flex flex-col gap-1">
          <h1 className="font-hud text-4xl font-bold tracking-widest text-cyan-500 hologram-text">J.A.R.V.I.S.</h1>
          <span className="font-tech text-xs tracking-[0.3em] text-cyan-700">JUST A RATHER VERY INTELLIGENT SYSTEM</span>
        </div>
        <div className="flex gap-4 text-xs font-tech text-cyan-600 items-start">
           <div className="flex flex-col gap-2 items-end">
             <div className="flex items-center gap-2">
               <Wifi className="w-4 h-4 animate-pulse" /> NET: ONLINE
             </div>
             <div className="flex items-center gap-2">
               <Cpu className="w-4 h-4" /> CPU: OPTIMAL
             </div>
             <button 
               onClick={() => setIsContactManagerOpen(true)}
               className="flex items-center gap-2 hover:text-cyan-400 cursor-pointer transition-colors group"
             >
               <Database className="w-4 h-4 group-hover:rotate-12 transition-transform" /> DB: CONTACTS
             </button>
           </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="relative z-10 w-full max-w-5xl grid grid-cols-1 md:grid-cols-3 gap-8 items-center">
        
        {/* Left Panel: Logs */}
        <div className="hidden md:flex flex-col h-96 justify-end">
           <div className="border-l-2 border-cyan-800 pl-4 h-full relative bg-black/40 backdrop-blur-sm rounded-r-xl border-t border-b border-r border-cyan-900/50 p-4">
              <h3 className="font-hud text-lg mb-4 text-cyan-600 flex items-center gap-2 border-b border-cyan-900 pb-2">
                <Globe className="w-4 h-4" /> SYSTEM LOGS
              </h3>
              <LogPanel logs={logs} />
           </div>
        </div>

        {/* Center: Arc Reactor & Status */}
        <div className="flex flex-col items-center justify-center gap-8">
          
          <StatusDisplay 
            state={systemState} 
            transcript={lastTranscript} 
          />

          <div className="relative group cursor-pointer" onClick={toggleActivation}>
            {/* Activation Button Wrapper */}
            <ArcReactor active={systemState === 'LISTENING' || systemState === 'PROCESSING'} />
            
            <div className="absolute -bottom-12 w-full text-center">
              <span className={`font-tech text-sm tracking-widest transition-colors duration-300 ${systemState === 'IDLE' ? 'text-cyan-500' : 'text-red-500'}`}>
                {systemState === 'IDLE' ? 'CLICK TO ACTIVATE' : 'SYSTEM ACTIVE'}
              </span>
            </div>
          </div>

        </div>

        {/* Right Panel: Volume & Modules */}
        <div className="hidden md:flex flex-col h-96 justify-start gap-6">
           {/* Volume Module */}
           <div className="border-r-2 border-cyan-800 pr-4 h-48 relative bg-black/40 backdrop-blur-sm rounded-l-xl border-t border-b border-l border-cyan-900/50 p-4 flex flex-col">
              <h3 className="font-hud text-lg mb-4 text-cyan-600 flex items-center gap-2 border-b border-cyan-900 pb-2 justify-end">
                AUDIO OUTPUT <ShieldAlert className="w-4 h-4" />
              </h3>
              <VolumeVisualizer volume={volume} />
           </div>

           {/* Active Tasks Placeholder */}
           <div className="border-r-2 border-cyan-800 pr-4 flex-1 relative bg-black/40 backdrop-blur-sm rounded-l-xl border-t border-b border-l border-cyan-900/50 p-4">
              <h3 className="font-hud text-lg mb-4 text-cyan-600 flex items-center gap-2 border-b border-cyan-900 pb-2 justify-end">
                ACTIVE MODULES
              </h3>
              <ul className="text-right font-tech text-sm space-y-2 text-cyan-700">
                <li className="flex justify-end items-center gap-2">Neural Network (Gemini) <span className="w-2 h-2 bg-blue-500 rounded-full animate-pulse shadow-[0_0_8px_rgba(59,130,246,0.8)]"></span></li>
                <li className="flex justify-end items-center gap-2">Web Navigation <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
                <li className="flex justify-end items-center gap-2">Secure Comm (WhatsApp) <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
                <li className="flex justify-end items-center gap-2">Media Control <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
                <li className="flex justify-end items-center gap-2">Temporal Awareness <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
                <li className="flex justify-end items-center gap-2">Global Search <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
                <li className="flex justify-end items-center gap-2">Computational Core <span className="w-2 h-2 bg-green-500 rounded-full"></span></li>
              </ul>
           </div>
        </div>

      </div>

      {/* Mobile Log Drawer (Bottom) */}
      <div className="md:hidden absolute bottom-0 left-0 w-full h-48 bg-black/80 backdrop-blur-md border-t border-cyan-800 p-4 overflow-hidden">
        <LogPanel logs={logs} />
      </div>

      {/* Contact Manager Modal */}
      <ContactManager 
        isOpen={isContactManagerOpen} 
        onClose={() => setIsContactManagerOpen(false)} 
        contacts={contacts}
        onSave={setContacts}
      />

    </div>
  );
}