export type SystemState = 'IDLE' | 'LISTENING' | 'PROCESSING' | 'SPEAKING';

export interface LogEntry {
  id: string;
  timestamp: Date;
  type: 'SYSTEM' | 'INPUT' | 'ACTION' | 'ERROR';
  message: string;
}

export type CommandAction = 
  | 'NAVIGATE'
  | 'YOUTUBE_SEARCH'
  | 'WHATSAPP_MESSAGE'
  | 'TIME_DATE'
  | 'VOLUME_CONTROL'
  | 'GOOGLE_SEARCH'
  | 'CALCULATOR'
  | 'SYSTEM_REPORT'
  | 'UNKNOWN';

export interface CommandResult {
  action: CommandAction;
  target?: string; // URL or identifier
  payload?: any; // Extra data like message content or volume direction
  description: string;
  response?: string; // Spoken response
}

export interface Contact {
  name: string;
  phone: string;
}

export interface ContactsMap {
  [key: string]: string;
}