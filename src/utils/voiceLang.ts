import { Language } from '../types';

export type VoiceSpeakLang = 'en' | 'hi' | 'hinglish';

/** Map UI Language enum or backend codes to STT/TTS locale + speak profile */
export function resolveVoiceLang(lang: Language | VoiceSpeakLang | string): {
  recognitionLang: string;
  speakLang: VoiceSpeakLang;
} {
  const raw = String(lang);
  if (raw === Language.HINGLISH || raw === 'hi-EN' || raw === 'hinglish') {
    return { recognitionLang: 'en-IN', speakLang: 'hinglish' };
  }
  if (raw === Language.HINDI || raw === 'hi-IN' || raw === 'hi') {
    return { recognitionLang: 'hi-IN', speakLang: 'hi' };
  }
  if (raw === Language.ENGLISH || raw === 'en-US' || raw === 'en') {
    return { recognitionLang: 'en-US', speakLang: 'en' };
  }
  return { recognitionLang: 'en-US', speakLang: 'en' };
}
