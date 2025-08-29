export interface AudioSegment {
  text: string;
  startTime: number;
  endTime: number;
}

export class AudioGenerator {
  private synthesis: SpeechSynthesis;
  private currentUtterance: SpeechSynthesisUtterance | null = null;
  private isPlaying = false;
  private onPlayingChange?: (playing: boolean) => void;

  constructor() {
    this.synthesis = window.speechSynthesis;
  }

  setPlayingCallback(callback: (playing: boolean) => void) {
    this.onPlayingChange = callback;
  }

  async generateFullAudio(text: string): Promise<void> {
    return new Promise((resolve, reject) => {
      if (!this.synthesis) {
        reject(new Error('Speech synthesis not supported'));
        return;
      }

      // Stop any current playback
      this.stop();

      this.currentUtterance = new SpeechSynthesisUtterance(text);
      
      // Configure voice settings for better quality
      this.currentUtterance.rate = 0.8;
      this.currentUtterance.pitch = 1.0;
      this.currentUtterance.volume = 1.0;
      
      // Try to use a high-quality English voice
      const voices = this.synthesis.getVoices();
      const englishVoice = voices.find(voice => 
        voice.lang.startsWith('en') && 
        (voice.name.includes('Google') || voice.name.includes('Microsoft'))
      ) || voices.find(voice => voice.lang.startsWith('en'));
      
      if (englishVoice) {
        this.currentUtterance.voice = englishVoice;
      }

      this.currentUtterance.onstart = () => {
        this.isPlaying = true;
        this.onPlayingChange?.(true);
      };

      this.currentUtterance.onend = () => {
        this.isPlaying = false;
        this.onPlayingChange?.(false);
        resolve();
      };

      this.currentUtterance.onerror = (event) => {
        this.isPlaying = false;
        this.onPlayingChange?.(false);
        reject(new Error(`Speech synthesis error: ${event.error}`));
      };

      this.synthesis.speak(this.currentUtterance);
    });
  }

  play(text: string): Promise<void> {
    return this.generateFullAudio(text);
  }

  stop(): void {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.cancel();
      this.isPlaying = false;
      this.onPlayingChange?.(false);
    }
  }

  pause(): void {
    if (this.synthesis && this.isPlaying) {
      this.synthesis.pause();
    }
  }

  resume(): void {
    if (this.synthesis) {
      this.synthesis.resume();
    }
  }

  getPlayingState(): boolean {
    return this.isPlaying;
  }

  // Create audio segments for longer texts (for future use)
  createSegments(text: string, maxSegmentLength: number = 200): AudioSegment[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const segments: AudioSegment[] = [];
    let currentSegment = '';
    let startTime = 0;

    for (const sentence of sentences) {
      const trimmedSentence = sentence.trim();
      if (currentSegment.length + trimmedSentence.length > maxSegmentLength && currentSegment.length > 0) {
        // Estimate duration (roughly 150 words per minute)
        const wordCount = currentSegment.split(' ').length;
        const duration = (wordCount / 150) * 60;
        
        segments.push({
          text: currentSegment.trim(),
          startTime,
          endTime: startTime + duration
        });
        
        startTime += duration;
        currentSegment = trimmedSentence;
      } else {
        currentSegment += (currentSegment ? '. ' : '') + trimmedSentence;
      }
    }

    if (currentSegment.trim().length > 0) {
      const wordCount = currentSegment.split(' ').length;
      const duration = (wordCount / 150) * 60;
      
      segments.push({
        text: currentSegment.trim(),
        startTime,
        endTime: startTime + duration
      });
    }

    return segments;
  }
}

export const audioGenerator = new AudioGenerator();