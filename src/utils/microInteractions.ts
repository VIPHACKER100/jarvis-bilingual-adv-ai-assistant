/**
 * JARVIS HUD Micro-interactions Utility
 * Handles audio feedback and subtle UI haptics
 */

class MicroInteractions {
  private audioCtx: AudioContext | null = null;

  constructor() {
    // Audio context is initialized on first interaction to comply with browser policies
  }

  private initAudio() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  /**
   * Play a procedural HUD sound effect
   */
  private playNote(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.initAudio();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);
    
    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  /**
   * Short digital click/blip for button hovers
   */
  public playHoverBlip() {
    this.playNote(880, 'sine', 0.05, 0.05);
  }

  /**
   * Confirm/Select sound
   */
  public playSelect() {
    this.playNote(1320, 'sine', 0.1, 0.08);
    setTimeout(() => this.playNote(1760, 'sine', 0.1, 0.05), 50);
  }

  /**
   * Error/Alert sound
   */
  public playAlert() {
    this.playNote(440, 'sawtooth', 0.2, 0.05);
    setTimeout(() => this.playNote(330, 'sawtooth', 0.2, 0.05), 100);
  }

  /**
   * Data 'sweep' sound for scanning/loading
   */
  public playScan() {
    this.initAudio();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(440, this.audioCtx.currentTime);
    osc.frequency.exponentialRampToValueAtTime(880, this.audioCtx.currentTime + 0.5);

    gain.gain.setValueAtTime(0.05, this.audioCtx.currentTime);
    gain.gain.linearRampToValueAtTime(0, this.audioCtx.currentTime + 0.5);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + 0.5);
  }
}

export const hudAudio = new MicroInteractions();
