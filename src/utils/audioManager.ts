export class AudioManager {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private isPaused = false;
  private onStateChange?: (state: { isPlaying: boolean; isPaused: boolean }) => void;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  setStateChangeCallback(callback: (state: { isPlaying: boolean; isPaused: boolean }) => void) {
    this.onStateChange = callback;
  }

  private updateState() {
    this.onStateChange?.({ isPlaying: this.isPlaying, isPaused: this.isPaused });
  }

  async playFullAudio(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current playback
      this.stop();

      // Clean and prepare text for better speech synthesis
      const cleanText = this.prepareTextForSpeech(text);
      
      this.currentUtterance = new SpeechSynthesisUtterance(cleanText);
      
      // Configure for optimal listening experience
      this.currentUtterance.rate = 0.85; // Slightly slower for learning
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;
      
      // Select the best available English voice
      this.selectBestVoice();

      this.currentUtterance.onstart = () => {
        this.isPlaying = true;
        this.isPaused = false;
        this.updateState();
      };

      this.currentUtterance.onend = () => {
        this.isPlaying = false;
        this.isPaused = false;
        this.updateState();
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.isPlaying = false;
        this.isPaused = false;
        this.updateState();
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.currentUtterance.onpause = () => {
        this.isPaused = true;
        this.updateState();
      };

      this.currentUtterance.onresume = () => {
        this.isPaused = false;
        this.updateState();
      };

      this.synthesis.speak(this.currentUtterance);
    });
  }

  private prepareTextForSpeech(text: string): string {
    return text
      // Add pauses after sentences
      .replace(/\./g, '. ')
      .replace(/\!/g, '! ')
      .replace(/\?/g, '? ')
      // Add longer pauses after paragraphs
      .replace(/\n\n/g, '. . . ')
      // Clean up extra spaces
      .replace(/\s+/g, ' ')
      .trim();
  }

  private selectBestVoice(): void {
    if (!this.currentUtterance) return;

    const voices = this.synthesis.getVoices();
    
    // Prefer high-quality English voices
    const preferredVoices = [
      'Google US English',
      'Microsoft Zira - English (United States)',
      'Alex',
      'Samantha'
    ];

    for (const voiceName of preferredVoices) {
      const voice = voices.find(v => v.name === voiceName);
      if (voice) {
        this.currentUtterance.voice = voice;
        return;
      }
    }

    // Fallback to any English voice
    const englishVoice = voices.find(voice => 
      voice.lang.startsWith('en') && voice.localService
    ) || voices.find(voice => voice.lang.startsWith('en'));
    
    if (englishVoice) {
      this.currentUtterance.voice = englishVoice;
    }
  }

  play(): void {
    if (this.isPaused && this.synthesis) {
      this.synthesis.resume();
    }
  }

  pause(): void {
    if (this.isPlaying && this.synthesis) {
      this.synthesis.pause();
    }
  }

  stop(): void {
    if (this.synthesis) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.isPaused = false;
      this.updateState();
    }
  }

  getState(): { isPlaying: boolean; isPaused: boolean } {
    return { isPlaying: this.isPlaying, isPaused: this.isPaused };
  }

  // Check if voices are loaded (they load asynchronously)
  waitForVoices(): Promise<void> {
    return new Promise((resolve) => {
      if (this.synthesis.getVoices().length > 0) {
        resolve();
        return;
      }

      const checkVoices = () => {
        if (this.synthesis.getVoices().length > 0) {
          resolve();
        } else {
          setTimeout(checkVoices, 100);
        }
      };

      this.synthesis.onvoiceschanged = () => {
        resolve();
      };

      checkVoices();
    });
  }
}

export const audioManager = new AudioManager();