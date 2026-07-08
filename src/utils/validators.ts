// ==========================================================================
// JARVIS v4.0 — Client-side validators (mirroring backend rules)
// ==========================================================================

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

/**
 * Validate a command text. Min 1, max 500 chars.
 */
export function validateCommand(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Command must be 1–500 characters' };
  }
  if (text.length > 500) {
    return { valid: false, error: 'Command must be 1–500 characters' };
  }
  return { valid: true };
}

/**
 * Validate a chat query. Min 1, max 2000 chars.
 */
export function validateQuery(text: string): ValidationResult {
  if (!text || text.trim().length === 0) {
    return { valid: false, error: 'Query must be 1–2000 characters' };
  }
  if (text.length > 2000) {
    return { valid: false, error: 'Query must be 1–2000 characters' };
  }
  return { valid: true };
}

/**
 * Validate that a language code is supported.
 */
export function validateLanguage(lang: string): lang is 'en' | 'hi' | 'hinglish' {
  return ['en', 'hi', 'hinglish'].includes(lang);
}

/**
 * Validate confirmation timeout (seconds). Must be >= 5 and <= 300.
 */
export function validateConfirmationTimeout(seconds: number): boolean {
  return Number.isInteger(seconds) && seconds >= 5 && seconds <= 300;
}

/**
 * Validate wake word phrase. Max 50 chars.
 */
export function validateWakeWord(text: string): boolean {
  return text.length <= 50;
}
