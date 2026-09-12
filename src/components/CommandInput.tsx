// ==========================================================================
// JARVIS v4.0 — COMP-2: CommandInput
// Text input with language toggle, mic button, and submit button
// ==========================================================================

import React, { useState, useRef, useEffect } from 'react';
import { Send, Languages, Mic, MicOff } from 'lucide-react';
import { validateCommand } from '../utils/validators';

type Language = 'en' | 'hi' | 'hinglish';

interface CommandInputProps {
  onSubmit: (command: string, language: Language) => void;
  disabled?: boolean;
  placeholder?: string;
  /** Controlled language — lifted so voice input shares the same locale */
  language?: Language;
  onLanguageChange?: (language: Language) => void;
  /** Mic toggle — omit to hide the voice button */
  mic?: {
    isListening: boolean;
    onToggle: () => void;
    disabled?: boolean;
  };
}

const LANGUAGE_LABELS: Record<Language, string> = {
  en: 'EN',
  hi: 'HI',
  hinglish: 'H+E',
};

const LANGUAGE_CYCLE: Language[] = ['en', 'hi', 'hinglish'];

export function CommandInput({
  onSubmit,
  disabled = false,
  placeholder = 'Type a command or ask me anything...',
  language: controlledLanguage,
  onLanguageChange,
  mic,
}: CommandInputProps) {
  const [internalLanguage, setInternalLanguage] = useState<Language>('en');
  const language = controlledLanguage ?? internalLanguage;
  const [text, setText] = useState('');
  const [error, setError] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!disabled) inputRef.current?.focus();
  }, [disabled]);

  const handleSubmit = () => {
    const validation = validateCommand(text);
    if (!validation.valid) {
      setError(validation.error ?? null);
      return;
    }
    setError(null);
    onSubmit(text.trim(), language);
    setText('');
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
    if (e.key === 'Escape') {
      setText('');
      setError(null);
    }
  };

  const cycleLanguage = () => {
    const next =
      LANGUAGE_CYCLE[
        (LANGUAGE_CYCLE.indexOf(language) + 1) % LANGUAGE_CYCLE.length
      ] ?? 'en';
    if (onLanguageChange) {
      onLanguageChange(next);
    } else {
      setInternalLanguage(next);
    }
  };

  return (
    <div className='flex flex-col gap-1.5'>
      <div className='flex items-center gap-2 glass-panel rounded-lg px-4 py-2 focus-within:border-cyan-400/50 transition-all duration-300'>
        <button
          onClick={cycleLanguage}
          disabled={disabled}
          title={`Language: ${language}`}
          aria-label={`Current language: ${language}. Click to change.`}
          className='flex items-center gap-1 px-2 py-1 text-xs font-mono font-bold uppercase rounded-md bg-cyan-900/40 text-cyan-300 border border-cyan-700/30 hover:bg-cyan-800/40 transition-all duration-200 disabled:opacity-40'
        >
          <Languages className='w-3 h-3' />
          {LANGUAGE_LABELS[language]}
        </button>

        <input
          ref={inputRef}
          type='text'
          value={text}
          onChange={e => {
            setText(e.target.value);
            setError(null);
          }}
          onKeyDown={handleKeyDown}
          disabled={disabled}
          placeholder={placeholder}
          maxLength={500}
          className='flex-1 bg-transparent border-none outline-none text-sm font-mono text-slate-200 placeholder-slate-500 disabled:opacity-40'
          aria-label='Command input'
        />

        <span className='text-[10px] text-slate-600 font-mono'>
          {text.length}/500
        </span>

        {mic && (
          <button
            onClick={mic.onToggle}
            disabled={mic.disabled ?? disabled}
            title={mic.isListening ? 'Stop listening' : 'Start voice command'}
            aria-label={
              mic.isListening ? 'Stop voice input' : 'Start voice input'
            }
            aria-pressed={mic.isListening}
            className={`glass-button !p-2 !rounded-lg transition-all duration-200 disabled:opacity-30 ${
              mic.isListening
                ? 'animate-pulse !border-cyan-400/60 !text-cyan-300'
                : ''
            }`}
          >
            {mic.isListening ? (
              <MicOff className='w-4 h-4' />
            ) : (
              <Mic className='w-4 h-4' />
            )}
          </button>
        )}

        <button
          onClick={handleSubmit}
          disabled={disabled || text.trim().length === 0}
          title='Send command'
          aria-label='Send command'
          className='glass-button !p-2 !rounded-lg disabled:opacity-30 disabled:cursor-not-allowed'
        >
          <Send className='w-4 h-4' />
        </button>
      </div>
      {error && (
        <span className='text-xs text-neon-error font-medium px-1'>
          {error}
        </span>
      )}
    </div>
  );
}
