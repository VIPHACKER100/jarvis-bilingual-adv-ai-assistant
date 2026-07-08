import { ContactsMap } from './types';

export const COMMAND_CONSTANTS = {
  WAKE_WORD: 'JARVIS',
};

// Mock contacts for WhatsApp feature
// In a real app, this would likely come from a database or user settings
export const CONTACTS: ContactsMap = {
  "MOM": "1234567890", 
  "DAD": "0987654321",
  "OFFICE": "1122334455",
  "BOSS": "5566778899",
  "JOHN DOE": "1234500000"
};

export const DEFAULT_SEARCH_ENGINE = "https://www.google.com/search?q=";
