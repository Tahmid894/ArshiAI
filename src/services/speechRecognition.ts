import { LanguageMode } from '../types/assistant';

// TypeScript declarations for Web Speech Recognition API
declare global {
  interface Window {
    SpeechRecognition?: any;
    webkitSpeechRecognition?: any;
  }
}

export interface SpeechRecognitionCallbacks {
  onStart?: () => void;
  onAudioStart?: () => void;
  onSoundStart?: () => void;
  onSpeechStart?: () => void;
  onInterimResult?: (text: string) => void;
  onFinalResult?: (text: string) => void;
  onSpeechEnd?: () => void;
  onAudioEnd?: () => void;
  onEnd?: () => void;
  onError?: (errorMessage: string, rawError: string) => void;
  onNoMatch?: () => void;
  onEvent?: (eventName: string, details?: any) => void;
}

export class ArshiSpeechRecognizer {
  private recognition: any = null;
  private isListening: boolean = false;
  private hasReceivedSpeech: boolean = false;
  private hasReceivedResult: boolean = false;
  private currentLanguage: LanguageMode = 'bn';
  private callbacks: SpeechRecognitionCallbacks = {};
  private activeStream: MediaStream | null = null;
  private intentionalStop: boolean = false;

  constructor() {
    this.initRecognition();
  }

  public isSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
  }

  private initRecognition(): boolean {
    if (!this.isSupported()) return false;
    const SpeechRecognitionClass = window.SpeechRecognition || window.webkitSpeechRecognition;
    try {
      this.recognition = new SpeechRecognitionClass();
      this.recognition.continuous = false; // Android Chrome works best in non-continuous single-utterance mode
      this.recognition.interimResults = true;
      this.recognition.maxAlternatives = 1;
      return true;
    } catch (e) {
      console.error('Failed to instantiate SpeechRecognition:', e);
      return false;
    }
  }

  public getLanguageCode(lang: LanguageMode): string {
    switch (lang) {
      case 'bn':
        return 'bn-BD';
      case 'en':
        return 'en-US';
      case 'auto':
      default:
        return 'bn-BD'; // Default is Bengali as specified
    }
  }

  public async requestMicrophonePermission(): Promise<'granted' | 'denied' | 'unsupported'> {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      return 'unsupported';
    }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      // Keep track of stream or release tracks
      stream.getTracks().forEach((track) => track.stop());
      return 'granted';
    } catch (err: any) {
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        return 'denied';
      }
      return 'denied';
    }
  }

  public async startListening(
    language: LanguageMode,
    callbacks: SpeechRecognitionCallbacks
  ): Promise<boolean> {
    if (!this.isSupported()) {
      callbacks.onError?.(
        'এই browser-এ voice recognition available নয়। দয়া করে Google Chrome ব্যবহার করুন।',
        'unsupported'
      );
      return false;
    }

    // Abort any existing instance cleanly
    if (this.isListening) {
      this.stopListening();
      await new Promise((r) => setTimeout(r, 120));
    }

    this.callbacks = callbacks;
    this.currentLanguage = language;
    this.hasReceivedSpeech = false;
    this.hasReceivedResult = false;
    this.intentionalStop = false;

    // Verify microphone hardware permission first to prevent instant aborted error
    try {
      const micStatus = await this.requestMicrophonePermission();
      if (micStatus === 'denied') {
        callbacks.onError?.(
          'মাইক্রোফোন permission দেওয়া হয়নি। Chrome settings থেকে microphone Allow করুন।',
          'not-allowed'
        );
        return false;
      }
    } catch {
      // Continue if permission query fails
    }

    try {
      if (!this.recognition) {
        this.initRecognition();
      }

      const langCode = this.getLanguageCode(language);
      this.recognition.lang = langCode;

      // Event handlers
      this.recognition.onstart = () => {
        this.isListening = true;
        this.callbacks.onEvent?.('onstart', { lang: langCode });
        this.callbacks.onStart?.();
      };

      this.recognition.onaudiostart = () => {
        this.callbacks.onEvent?.('onaudiostart');
        this.callbacks.onAudioStart?.();
      };

      this.recognition.onsoundstart = () => {
        this.callbacks.onEvent?.('onsoundstart');
        this.callbacks.onSoundStart?.();
      };

      this.recognition.onspeechstart = () => {
        this.hasReceivedSpeech = true;
        this.callbacks.onEvent?.('onspeechstart');
        this.callbacks.onSpeechStart?.();
      };

      this.recognition.onresult = (event: any) => {
        let interimStr = '';
        let finalStr = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const res = event.results[i];
          const transcript = res[0].transcript;
          if (res.isFinal) {
            finalStr += transcript;
          } else {
            interimStr += transcript;
          }
        }

        this.callbacks.onEvent?.('onresult', { interim: interimStr, final: finalStr });

        if (interimStr) {
          this.callbacks.onInterimResult?.(interimStr);
        }

        if (finalStr) {
          this.hasReceivedResult = true;
          this.callbacks.onFinalResult?.(finalStr.trim());
        }
      };

      this.recognition.onspeechend = () => {
        this.callbacks.onEvent?.('onspeechend');
        this.callbacks.onSpeechEnd?.();
      };

      this.recognition.onaudioend = () => {
        this.callbacks.onEvent?.('onaudioend');
        this.callbacks.onAudioEnd?.();
      };

      this.recognition.onnomatch = () => {
        this.callbacks.onEvent?.('onnomatch');
        this.callbacks.onNoMatch?.();
      };

      this.recognition.onerror = (event: any) => {
        const errorType = event.error || 'unknown';
        this.callbacks.onEvent?.('onerror', { error: errorType, message: event.message });

        // If user explicitly pressed stop or abort, ignore error
        if (this.intentionalStop && (errorType === 'aborted' || errorType === 'no-speech')) {
          return;
        }

        let userFriendlyMsg = 'ভয়েস রিকগনিশনে সমস্যা হয়েছে। আবার চেষ্টা করুন।';

        switch (errorType) {
          case 'not-allowed':
          case 'permission-denied':
            userFriendlyMsg = 'মাইক্রোফোন permission দেওয়া হয়নি। Chrome settings থেকে microphone Allow করুন।';
            break;
          case 'no-speech':
            userFriendlyMsg = 'কোনো কথা শোনা যায়নি। আবার চেষ্টা করুন।';
            break;
          case 'audio-capture':
            userFriendlyMsg = 'মাইক্রোফোন ক্যাপচার করা যাচ্ছে না। ডিভাইস মাইক্রোফোন চেক করুন।';
            break;
          case 'network':
            userFriendlyMsg = 'ইন্টারনেট সংযোগ চেক করুন এবং পুনরায় চেষ্টা করুন।';
            break;
          case 'aborted':
            userFriendlyMsg = 'ভয়েস রিকগনিশন থামানো হয়েছে।';
            break;
          case 'service-not-allowed':
            userFriendlyMsg = 'ভয়েস সার্ভিস এই মুহূর্তে অনুমোদিত নয়। অন্য ব্রাউজারে চেষ্টা করুন।';
            break;
          case 'language-not-supported':
            userFriendlyMsg = `নির্বাচিত ভাষা (${langCode}) ডিভাইসে সমর্থিত নয়।`;
            break;
          default:
            userFriendlyMsg = `ভয়েস ত্রুটি: ${errorType}। পুনরায় চেষ্টা করুন।`;
            break;
        }

        this.callbacks.onError?.(userFriendlyMsg, errorType);
      };

      this.recognition.onend = () => {
        this.isListening = false;
        this.callbacks.onEvent?.('onend');
        this.callbacks.onEnd?.();
      };

      this.recognition.start();
      return true;
    } catch (err: any) {
      console.error('Recognition start exception:', err);
      this.isListening = false;
      this.callbacks.onError?.('ভয়েস সার্ভিস শুরু করা যায়নি। অনুগ্রহ করে আবার চেষ্টা করুন।', err?.message || 'start_failed');
      return false;
    }
  }

  public stopListening(): void {
    this.intentionalStop = true;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch {
        try {
          this.recognition.abort();
        } catch {
          // Ignore
        }
      }
    }
  }

  public abortListening(): void {
    this.intentionalStop = true;
    this.isListening = false;
    if (this.recognition) {
      try {
        this.recognition.abort();
      } catch {
        // Ignore
      }
    }
  }

  public getIsListening(): boolean {
    return this.isListening;
  }
}

export const speechRecognizer = new ArshiSpeechRecognizer();
