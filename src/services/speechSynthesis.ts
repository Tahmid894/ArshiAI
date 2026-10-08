import { SpeechSpeed } from '../types/assistant';

export interface TTSCallbacks {
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: any) => void;
}

export class ArshiSpeechSynthesizer {
  private synth: SpeechSynthesis | null = null;
  private voices: SpeechSynthesisVoice[] = [];
  private isSpeakingState: boolean = false;

  constructor() {
    if (typeof window !== 'undefined' && 'speechSynthesis' in window) {
      this.synth = window.speechSynthesis;
      this.loadVoices();
      if (this.synth.onvoiceschanged !== undefined) {
        this.synth.onvoiceschanged = () => this.loadVoices();
      }
    }
  }

  private loadVoices(): void {
    if (!this.synth) return;
    this.voices = this.synth.getVoices();
  }

  public getAvailableVoices(): SpeechSynthesisVoice[] {
    if (!this.voices || this.voices.length === 0) {
      this.loadVoices();
    }
    return this.voices;
  }

  public getBengaliVoices(): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    return all.filter((v) => v.lang.startsWith('bn'));
  }

  public getEnglishVoices(): SpeechSynthesisVoice[] {
    const all = this.getAvailableVoices();
    return all.filter((v) => v.lang.startsWith('en'));
  }

  public findBestVoice(lang: 'bn' | 'en' | 'auto', selectedVoiceURI?: string): SpeechSynthesisVoice | null {
    const all = this.getAvailableVoices();
    if (all.length === 0) return null;

    if (selectedVoiceURI) {
      const match = all.find((v) => v.voiceURI === selectedVoiceURI);
      if (match) return match;
    }

    if (lang === 'bn' || lang === 'auto') {
      const bnMatch = all.find((v) => v.lang === 'bn-BD' || v.lang === 'bn-IN' || v.lang.startsWith('bn'));
      if (bnMatch) return bnMatch;
    }

    if (lang === 'en') {
      const enMatch = all.find((v) => v.lang === 'en-US' || v.lang.startsWith('en'));
      if (enMatch) return enMatch;
    }

    // Default voice
    return all.find((v) => v.default) || all[0] || null;
  }

  public cleanTextForSpeech(text: string): string {
    if (!text) return '';
    return text
      .replace(/```[\s\S]*?```/g, 'কোড ব্লক বাদ দেওয়া হলো') // Don't read whole code blocks out loud
      .replace(/`([^`]+)`/g, '$1')
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')
      .replace(/[*_~#>]/g, '')
      .replace(/https?:\/\/\S+/g, 'ওয়েব লিঙ্ক')
      .replace(/\n+/g, ' ')
      .trim();
  }

  public speak(
    text: string,
    options: {
      speed?: SpeechSpeed;
      lang?: 'bn' | 'en' | 'auto';
      voiceURI?: string;
    } = {},
    callbacks?: TTSCallbacks
  ): void {
    if (!this.synth) {
      callbacks?.onError?.('SpeechSynthesis not supported');
      return;
    }

    // Cancel any previous ongoing speech
    this.stop();

    const cleanText = this.cleanTextForSpeech(text);
    if (!cleanText) {
      callbacks?.onEnd?.();
      return;
    }

    const utterance = new SpeechSynthesisUtterance(cleanText);
    const speed = options.speed ?? 1.0;
    utterance.rate = speed;
    utterance.pitch = 1.05; // Slightly warm/bright tone for friendly assistant

    const bestVoice = this.findBestVoice(options.lang || 'bn', options.voiceURI);
    if (bestVoice) {
      utterance.voice = bestVoice;
      utterance.lang = bestVoice.lang;
    } else {
      utterance.lang = options.lang === 'en' ? 'en-US' : 'bn-BD';
    }

    utterance.onstart = () => {
      this.isSpeakingState = true;
      callbacks?.onStart?.();
    };

    utterance.onend = () => {
      this.isSpeakingState = false;
      callbacks?.onEnd?.();
    };

    utterance.onerror = (e) => {
      this.isSpeakingState = false;
      // 'interrupted' is normal when user cancels/taps mic
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        callbacks?.onError?.(e);
      } else {
        callbacks?.onEnd?.();
      }
    };

    try {
      this.synth.speak(utterance);
    } catch (err) {
      this.isSpeakingState = false;
      callbacks?.onError?.(err);
    }
  }

  public stop(): void {
    if (this.synth) {
      try {
        this.synth.cancel();
      } catch {
        // Ignore
      }
    }
    this.isSpeakingState = false;
  }

  public isSpeaking(): boolean {
    return this.isSpeakingState || (!!this.synth && this.synth.speaking);
  }
}

export const speechSynthesizer = new ArshiSpeechSynthesizer();
