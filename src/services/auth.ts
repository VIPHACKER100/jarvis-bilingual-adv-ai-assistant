// ==========================================================================
// JARVIS v4.0 — Auth Service (API key management via localStorage)
// ==========================================================================

const STORAGE_KEY = 'BACKEND_API_KEY';

export const authService = {
  /** Read the API key from localStorage */
  getApiKey(): string | null {
    try {
      return localStorage.getItem(STORAGE_KEY);
    } catch {
      return null;
    }
  },

  /** Write the API key to localStorage */
  setApiKey(key: string): void {
    try {
      localStorage.setItem(STORAGE_KEY, key);
    } catch {
      // Storage full or unavailable — silent fail
    }
  },

  /** Remove the API key from localStorage */
  clearApiKey(): void {
    try {
      localStorage.removeItem(STORAGE_KEY);
    } catch {
      // silent
    }
  },

  /** Returns true if an API key is stored */
  hasApiKey(): boolean {
    const key = this.getApiKey();
    return key !== null && key.length > 0;
  },

  /** Returns auth headers object (empty if no key) */
  getAuthHeaders(): Record<string, string> {
    const key = this.getApiKey();
    return key ? { 'X-API-Key': key } : {};
  },
};
