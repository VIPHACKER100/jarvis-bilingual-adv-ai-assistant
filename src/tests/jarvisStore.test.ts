import { describe, it, expect, beforeEach } from 'vitest';
import { useJarvisStore } from '../store/jarvisStore';
import { AppMode, Language } from '../types';

describe('jarvisStore', () => {
  beforeEach(() => {
    // Reset state before each test
    useJarvisStore.setState({
      mode: AppMode.IDLE,
      language: Language.ENGLISH,
      history: [],
      transcript: '',
      isConnected: false,
      showSettings: false,
      showMemory: false,
      showAutomation: false,
      showAdvanced: false,
      showPermission: false,
    });
  });

  it('should initialize with default state', () => {
    const state = useJarvisStore.getState();
    expect(state.mode).toBe(AppMode.IDLE);
    expect(state.language).toBe(Language.ENGLISH);
    expect(state.history).toEqual([]);
    expect(state.isConnected).toBe(false);
  });

  it('should set mode', () => {
    useJarvisStore.getState().setMode(AppMode.LISTENING);
    expect(useJarvisStore.getState().mode).toBe(AppMode.LISTENING);
  });

  it('should set language', () => {
    useJarvisStore.getState().setLanguage(Language.HINDI);
    expect(useJarvisStore.getState().language).toBe(Language.HINDI);
  });

  it('should add to history', () => {
    useJarvisStore.getState().addToHistory({ 
      transcript: 'Hello', 
      response: 'Hi', 
      actionType: 'greeting', 
      language: 'en', 
      timestamp: Date.now() 
    });
    expect(useJarvisStore.getState().history.length).toBe(1);
    expect(useJarvisStore.getState().history[0].transcript).toBe('Hello');
  });

  it('should set bridge connected status', () => {
    useJarvisStore.getState().setConnected(true);
    expect(useJarvisStore.getState().isConnected).toBe(true);
  });
  
  it('should toggle ui states', () => {
    useJarvisStore.getState().setShowSettings(true);
    expect(useJarvisStore.getState().showSettings).toBe(true);
    
    useJarvisStore.getState().setShowSettings(false);
    expect(useJarvisStore.getState().showSettings).toBe(false);
  });
});
