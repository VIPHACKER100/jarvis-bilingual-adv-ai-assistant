export class AudioSystem {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {}

    private init() {
        if (!this.audioContext) {
            try {
                const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
                if (AudioContextClass) {
                    this.audioContext = new AudioContextClass();
                    this.masterGain = this.audioContext.createGain();
                    this.masterGain.gain.value = 0.2;
                    this.masterGain.connect(this.audioContext.destination);
                }
            } catch (e) {
                console.warn("Audio Context failed to init");
            }
        }
    }

    private ensureContext() {
        this.init();
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    private playNote(freq: number, type: OscillatorType, duration: number, volume: number = 0.5) {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = type;
        osc.frequency.setValueAtTime(freq, this.audioContext.currentTime);
        
        gain.gain.setValueAtTime(volume, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + duration);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + duration);
    }

    public playBlip() {
        this.playNote(880, 'sine', 0.05, 0.3);
    }

    public playActivation() {
        this.playNote(440, 'sine', 0.2, 0.4);
        setTimeout(() => this.playNote(880, 'sine', 0.2, 0.3), 100);
    }

    public playDeactivation() {
        this.playNote(880, 'sine', 0.2, 0.3);
        setTimeout(() => this.playNote(440, 'sine', 0.2, 0.4), 100);
    }

    public playSelect() {
        this.playNote(1320, 'sine', 0.1, 0.4);
    }

    public playAlert() {
        this.playNote(440, 'sawtooth', 0.3, 0.3);
        setTimeout(() => this.playNote(330, 'sawtooth', 0.3, 0.3), 150);
    }

    public playScan() {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(880, this.audioContext.currentTime + 0.5);

        gain.gain.setValueAtTime(0.2, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0, this.audioContext.currentTime + 0.5);

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
}

export const sfx = new AudioSystem();
