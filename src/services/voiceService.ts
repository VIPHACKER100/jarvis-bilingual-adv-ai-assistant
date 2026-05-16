import {
  Language,
  ISpeechRecognitionEvent,
  ISpeechRecognitionErrorEvent,
  SpeechRecognition,
} from '../types';
import { useJarvisStore } from '../store/jarvisStore';
import { resolveVoiceLang, type VoiceSpeakLang } from '../utils/voiceLang';

export type { VoiceSpeakLang } from '../utils/voiceLang';
export { resolveVoiceLang } from '../utils/voiceLang';

class VoiceService {
  private recognition: SpeechRecognition | null = null;
  private synthesis: SpeechSynthesis = typeof window !== 'undefined' ? window.speechSynthesis : (null as unknown as SpeechSynthesis);
  private isListening = false;
  private isSpeaking = false;
  private pendingSpeak = false;
  private restartTimer: ReturnType<typeof setTimeout> | null = null;
  private voicesReady = false;

  constructor() {
    if (typeof window === 'undefined') return;

    const SpeechRecognitionCtor =
      window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognitionCtor) {
      this.recognition = new SpeechRecognitionCtor();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
    } else {
      console.error('Speech Recognition API not supported in this browser.');
    }

    const loadVoices = () => {
      if (this.synthesis?.getVoices().length) {
        this.voicesReady = true;
      }
    };
    loadVoices();
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }

  public isSupported(): boolean {
    return this.recognition !== null;
  }

  public getIsSpeaking(): boolean {
    return this.isSpeaking;
  }

  public getIsListening(): boolean {
    return this.isListening;
  }

  public setLanguage(lang: Language | VoiceSpeakLang | string) {
    if (!this.recognition) return;
    this.recognition.lang = resolveVoiceLang(lang).recognitionLang;
  }

  public startListening(
    onResult: (transcript: string, isFinal: boolean) => void,
    onEnd: () => void,
    onError: (error: string) => void
  ) {
    if (!this.recognition) {
      onError('not-supported');
      return;
    }

    if (this.isSpeaking) {
      return;
    }

    if (this.isListening) {
      return;
    }

    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }

    this.recognition.onresult = (event: ISpeechRecognitionEvent) => {
      let transcript = '';
      for (let i = event.resultIndex; i < event.results.length; i++) {
        transcript += event.results[i][0].transcript;
      }
      const last = event.results[event.results.length - 1];
      const isFinal = last?.isFinal ?? false;
      onResult(transcript.trim(), isFinal);
    };

    this.recognition.onerror = (event: ISpeechRecognitionErrorEvent) => {
      if (event.error !== 'no-speech') {
        this.isListening = false;
        onError(event.error);
      }
    };

    this.recognition.onend = () => {
      this.isListening = false;
      onEnd();
    };

    this.recognition.onstart = () => {
      this.isListening = true;
    };

    try {
      this.recognition.start();
    } catch (e) {
      console.warn('Recognition start failed:', e);
      this.isListening = false;
      this.restartTimer = setTimeout(() => {
        this.restartTimer = null;
        try {
          this.recognition?.start();
        } catch {
          onError('start-failed');
        }
      }, 300);
    }
  }

  public stopListening() {
    if (this.restartTimer) {
      clearTimeout(this.restartTimer);
      this.restartTimer = null;
    }
    if (!this.recognition) return;
    try {
      if (this.isListening) {
        this.recognition.stop();
      }
    } catch (e) {
      console.warn('Error stopping recognition:', e);
      try {
        this.recognition.abort();
      } catch {
        /* ignore */
      }
    }
    this.isListening = false;
  }

  public speak(
    text: string,
    lang: VoiceSpeakLang | Language | string = 'en',
    onEnd?: () => void
  ) {
    if (!text?.trim() || !this.synthesis) {
      onEnd?.();
      return;
    }

    this.synthesis.cancel();
    this.pendingSpeak = false;
    this.isSpeaking = true;

    const { speakLang } = resolveVoiceLang(lang);
    const utterance = new SpeechSynthesisUtterance(text.trim());

    if (speakLang === 'hinglish') {
      utterance.lang = 'en-IN';
    } else if (speakLang === 'hi') {
      utterance.lang = 'hi-IN';
    } else {
      utterance.lang = 'en-US';
    }

    const finish = () => {
      this.isSpeaking = false;
      onEnd?.();
    };
    utterance.onend = finish;
    utterance.onerror = finish;

    const voices = this.synthesis.getVoices();
    if (voices.length === 0 && !this.voicesReady) {
      this.pendingSpeak = true;
      const trySpeak = () => {
        if (!this.pendingSpeak) return;
        this.pendingSpeak = false;
        this._selectAndSpeak(utterance, this.synthesis.getVoices(), speakLang);
      };
      const prev = window.speechSynthesis.onvoiceschanged;
      window.speechSynthesis.onvoiceschanged = () => {
        prev?.call(window.speechSynthesis, new Event('voiceschanged'));
        trySpeak();
      };
      setTimeout(trySpeak, 250);
      return;
    }

    this._selectAndSpeak(utterance, voices, speakLang);
  }

  private _selectAndSpeak(
    utterance: SpeechSynthesisUtterance,
    voices: SpeechSynthesisVoice[],
    speakLang: VoiceSpeakLang
  ) {
    const preferredVoices = voices.filter(
      (v) =>
        v.lang.startsWith(utterance.lang) &&
        (v.name.includes('Google') ||
          v.name.includes('Natural') ||
          v.name.includes('Premium') ||
          v.name.includes('Microsoft'))
    );

    const matchVoice =
      preferredVoices[0] ?? voices.find((v) => v.lang.startsWith(utterance.lang));

    if (matchVoice) {
      utterance.voice = matchVoice;
    }

    const personality = useJarvisStore.getState().systemStatus?.personality as
      | { voice_pitch?: number; voice_rate?: number }
      | undefined;

    if (personality?.voice_pitch != null && personality?.voice_rate != null) {
      utterance.pitch = personality.voice_pitch;
      utterance.rate = personality.voice_rate;
    } else if (speakLang === 'hinglish') {
      utterance.pitch = 0.85;
      utterance.rate = 0.9;
    } else if (speakLang === 'hi') {
      utterance.pitch = 1.0;
      utterance.rate = 0.92;
    } else {
      utterance.pitch = 1.0;
      utterance.rate = 0.95;
    }
    utterance.volume = 1.0;

    this.synthesis.speak(utterance);
  }
}

export const voiceService = new VoiceService();
