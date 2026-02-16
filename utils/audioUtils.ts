export class AudioSystem {
    private audioContext: AudioContext | null = null;
    private masterGain: GainNode | null = null;

    constructor() {
        this.init();
    }

    private init() {
        try {
            const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
            if (AudioContextClass) {
                this.audioContext = new AudioContextClass();
                this.masterGain = this.audioContext.createGain();
                this.masterGain.gain.value = 0.3; // Low volume for UI sounds
                this.masterGain.connect(this.audioContext.destination);
            }
        } catch (e) {
            console.warn("Audio Context not supported or failed to init");
        }
    }

    private ensureContext() {
        if (this.audioContext?.state === 'suspended') {
            this.audioContext.resume();
        }
    }

    // Sci-fi "Blip" - fast, high pitch
    public playBlip() {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sine';
        osc.frequency.setValueAtTime(800, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, this.audioContext.currentTime + 0.1);

        gain.gain.setValueAtTime(0.5, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.1);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.1);
    }

    // Low "Hum" or "Activate" sound
    public playActivation() {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc1 = this.audioContext.createOscillator();
        const osc2 = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc1.connect(gain);
        osc2.connect(gain);
        gain.connect(this.masterGain);

        osc1.type = 'sawtooth';
        osc1.frequency.setValueAtTime(100, this.audioContext.currentTime);
        osc1.frequency.linearRampToValueAtTime(300, this.audioContext.currentTime + 0.5);

        osc2.type = 'square';
        osc2.frequency.setValueAtTime(50, this.audioContext.currentTime);
        osc2.frequency.linearRampToValueAtTime(150, this.audioContext.currentTime + 0.5);

        gain.gain.setValueAtTime(0, this.audioContext.currentTime);
        gain.gain.linearRampToValueAtTime(0.3, this.audioContext.currentTime + 0.1);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 1.0);

        osc1.start();
        osc2.start();
        osc1.stop(this.audioContext.currentTime + 1.0);
        osc2.stop(this.audioContext.currentTime + 1.0);
    }

    // Deactivate - Power down sound
    public playDeactivation() {
        this.ensureContext();
        if (!this.audioContext || !this.masterGain) return;

        const osc = this.audioContext.createOscillator();
        const gain = this.audioContext.createGain();

        osc.connect(gain);
        gain.connect(this.masterGain);

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(300, this.audioContext.currentTime);
        osc.frequency.exponentialRampToValueAtTime(50, this.audioContext.currentTime + 0.5);

        gain.gain.setValueAtTime(0.3, this.audioContext.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, this.audioContext.currentTime + 0.5);

        osc.start();
        osc.stop(this.audioContext.currentTime + 0.5);
    }
}

export const sfx = new AudioSystem();
