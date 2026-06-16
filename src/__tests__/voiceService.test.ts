import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { Language } from '../types';
import { resolveVoiceLang } from '../utils/voiceLang';

describe('resolveVoiceLang', () => {
  it('maps Hinglish UI language to en-IN recognition', () => {
    expect(resolveVoiceLang(Language.HINGLISH)).toEqual({
      recognitionLang: 'en-IN',
      speakLang: 'hinglish',
    });
  });

  it('maps Hindi UI language', () => {
    expect(resolveVoiceLang(Language.HINDI)).toEqual({
      recognitionLang: 'hi-IN',
      speakLang: 'hi',
    });
  });

  it('maps backend hinglish code', () => {
    expect(resolveVoiceLang('hinglish').speakLang).toBe('hinglish');
  });
});

describe('VoiceService', () => {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  let activeRecognition: any;

  let mockSynthesis: {
    speak: ReturnType<typeof vi.fn>;
    cancel: ReturnType<typeof vi.fn>;
    getVoices: ReturnType<typeof vi.fn>;
    onvoiceschanged: (() => void) | null;
  };

  beforeEach(() => {
    mockSynthesis = {
      speak: vi.fn(),
      cancel: vi.fn(),
      getVoices: vi.fn(() => [
        { name: 'Google US English', lang: 'en-US' },
        { name: 'Google हिन्दी', lang: 'hi-IN' },
      ]),
      onvoiceschanged: null,
    };

    class MockSpeechRecognition {
      continuous = false;
      interimResults = false;
      lang = '';
      maxAlternatives = 1;
      onresult: ((e: unknown) => void) | null = null;
      onend: (() => void) | null = null;
      onerror: ((e: { error: string }) => void) | null = null;
      onstart: (() => void) | null = null;
      start = vi.fn(() => {
        activeRecognition = this;
        this.onstart?.();
      });
      stop = vi.fn();
      abort = vi.fn();
    }

    class MockUtterance {
      text: string;
      lang = '';
      pitch = 1;
      rate = 1;
      volume = 1;
      voice: SpeechSynthesisVoice | null = null;
      onend: ((ev: Event) => void) | null = null;
      onerror: ((ev: Event) => void) | null = null;
      constructor(text: string) {
        this.text = text;
      }
    }

    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('SpeechSynthesisUtterance', MockUtterance);
    vi.stubGlobal('speechSynthesis', mockSynthesis);
    window.speechSynthesis = mockSynthesis as unknown as SpeechSynthesis;
    activeRecognition = null;
    vi.resetModules();
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.resetModules();
  });

  it('sets recognition language from UI Language enum', async () => {
    let instanceLang = '';
    class MockSpeechRecognition {
      lang = '';
      continuous = false;
      interimResults = false;
      maxAlternatives = 1;
      onresult = null;
      onend = null;
      onerror = null;
      onstart = null;
      start = vi.fn(() => {
        instanceLang = this.lang;
      });
      stop = vi.fn();
      abort = vi.fn();
    }
    vi.stubGlobal('SpeechRecognition', MockSpeechRecognition);
    vi.stubGlobal('webkitSpeechRecognition', MockSpeechRecognition);
    vi.resetModules();
    const { voiceService } = await import('../services/voiceService');
    voiceService.setLanguage(Language.HINDI);
    voiceService.startListening(vi.fn(), vi.fn(), vi.fn());
    expect(instanceLang).toBe('hi-IN');
  });

  it('aggregates final transcript from multiple results', async () => {
    const { voiceService } = await import('../services/voiceService');
    const onResult = vi.fn();
    const onEnd = vi.fn();

    voiceService.startListening(onResult, onEnd, vi.fn());

    const event = {
      resultIndex: 0,
      results: {
        length: 2,
        0: { 0: { transcript: 'what ' }, isFinal: true, length: 1 },
        1: { 0: { transcript: 'time is it' }, isFinal: true, length: 1 },
      },
    };
    activeRecognition.onresult?.(event);
    expect(onResult).toHaveBeenCalledWith('what time is it', true);
  });

  it('speaks with cancel and onEnd callback', async () => {
    const { voiceService } = await import('../services/voiceService');
    const onEnd = vi.fn();
    let captured: any = null;
    mockSynthesis.speak.mockImplementation((u: Record<string, unknown>) => {
      captured = u;
      (u.onend as ((e: Event) => void) | undefined)?.(new Event('end'));
    });

    voiceService.speak('Hello Sir', 'en', onEnd);
    expect(mockSynthesis.cancel).toHaveBeenCalled();
    expect(mockSynthesis.speak).toHaveBeenCalled();
    expect(captured?.lang).toBe('en-US');
    expect(onEnd).toHaveBeenCalled();
    expect(voiceService.getIsSpeaking()).toBe(false);
  });

  it('skips empty speak', async () => {
    const { voiceService } = await import('../services/voiceService');
    const onEnd = vi.fn();
    voiceService.speak('   ', 'en', onEnd);
    expect(mockSynthesis.speak).not.toHaveBeenCalled();
    expect(onEnd).toHaveBeenCalled();
  });

  it('does not start listening while speaking', async () => {
    const { voiceService } = await import('../services/voiceService');
    mockSynthesis.speak.mockImplementation(() => {
      /* do not call onend — still speaking */
    });
    voiceService.speak('Long response', 'en');
    expect(voiceService.getIsSpeaking()).toBe(true);

    voiceService.startListening(vi.fn(), vi.fn(), vi.fn());
    expect(activeRecognition).toBeNull();
  });
});
