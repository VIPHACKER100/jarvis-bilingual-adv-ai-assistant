// Adding SpeechRecognition types to the global window object
declare global {
  interface Window {
    SpeechRecognition: any;
    webkitSpeechRecognition: any;
  }
}

export interface ISpeechRecognitionEvent {
  results: {
    [key: number]: {
      [key: number]: {
        transcript: string;
      };
      isFinal: boolean;
    };
    length: number;
  };
}

export interface ISpeechRecognitionErrorEvent {
  error: string;
}

export interface CommandResult {
  transcript: string;
  response: string;
  actionType: string;
  language: 'en' | 'hi';
  timestamp: number;
  isSystemMessage?: boolean;
}

export enum AppMode {
  IDLE = 'IDLE',
  LISTENING = 'LISTENING',
  PROCESSING = 'PROCESSING',
  SPEAKING = 'SPEAKING',
}

export enum Language {
  ENGLISH = 'en-US',
  HINDI = 'hi-IN',
}