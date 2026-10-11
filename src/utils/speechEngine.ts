/**
 * Voice Input & Speech Output Engine for JARVIS AI
 * Supports High-Quality Neural Bengali TTS (bn-BD), Gemini Neural TTS, and Browser Speech Synthesis.
 */

import {
  normalizeBanglaTextForSpeech,
  convertBanglishToBangla,
} from './banglaTextProcessor';

export interface SpeechRecognitionCallbacks {
  onStart: () => void;
  onResult: (transcript: string, isFinal: boolean) => void;
  onError: (error: string) => void;
  onEnd: () => void;
}

export interface SpeakOptions {
  voiceEngine?: 'gemini' | 'browser';
  geminiVoice?: 'Zephyr' | 'Puck' | 'Kore' | 'Fenrir' | 'Charon';
  banglaVoiceType?: 'neural-female' | 'neural-male' | 'neural-standard' | 'browser';
  browserVoiceName?: string;
  banglaVoiceName?: string;
  voiceLanguageMode?: 'auto' | 'bangla' | 'english';
  speechTextBn?: string;
  rate?: number;
  pitch?: number;
  volume?: number;
  fallbackToBrowser?: boolean;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (err: string) => void;
}

export class JarvisSpeechEngine {
  private recognition: any = null;
  private isListeningActive: boolean = false;
  private currentAudioElement: HTMLAudioElement | null = null;
  private synthUtterance: SpeechSynthesisUtterance | null = null;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private micStream: MediaStream | null = null;
  private ttsQuotaExhausted: boolean = false;

  public isSpeechRecognitionSupported(): boolean {
    if (typeof window === 'undefined') return false;
    return !!((window as any).SpeechRecognition || (window as any).webkitSpeechRecognition);
  }

  public getAvailableBrowserVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    return window.speechSynthesis.getVoices();
  }

  public getBanglaVoices(): SpeechSynthesisVoice[] {
    if (typeof window === 'undefined' || !window.speechSynthesis) return [];
    const voices = window.speechSynthesis.getVoices();
    return voices.filter(
      (v) =>
        v.lang.toLowerCase().startsWith('bn') ||
        v.name.toLowerCase().includes('bangla') ||
        v.name.toLowerCase().includes('bengali')
    );
  }

  // Translates common Banglish assistant phrases to Bengali script for natural TTS pronunciation
  public convertBanglishToBangla(text: string): string {
    return convertBanglishToBangla(text);
  }

  // Initialize Microphone stream for live visualizer audio data
  public async getAudioAnalyser(): Promise<AnalyserNode | null> {
    if (this.analyser) return this.analyser;
    try {
      if (typeof window === 'undefined') return null;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) return null;

      this.audioContext = new AudioCtx();
      this.micStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const source = this.audioContext.createMediaStreamSource(this.micStream);
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 64;
      this.analyser.smoothingTimeConstant = 0.8;
      source.connect(this.analyser);
      return this.analyser;
    } catch (e) {
      return null;
    }
  }

  public startListening(
    callbacks: SpeechRecognitionCallbacks,
    languagePreference: 'auto' | 'bn-BD' | 'en-US' = 'auto'
  ) {
    if (!this.isSpeechRecognitionSupported()) {
      callbacks.onError('Web Speech API is not supported in this browser. Please use Chrome/Edge or text input.');
      return;
    }

    // Stop speaking immediately if JARVIS was speaking (Interrupt capability)
    this.stopSpeaking();

    try {
      const SpeechRecognition =
        (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition;
      this.recognition = new SpeechRecognition();
      this.recognition.continuous = false;
      this.recognition.interimResults = true;

      // Set recognition language
      if (languagePreference === 'bn-BD') {
        this.recognition.lang = 'bn-BD';
      } else if (languagePreference === 'en-US') {
        this.recognition.lang = 'en-US';
      } else {
        // Auto / default
        this.recognition.lang = navigator.language || 'en-US';
      }

      this.recognition.onstart = () => {
        this.isListeningActive = true;
        callbacks.onStart();
      };

      this.recognition.onresult = (event: any) => {
        let interimTranscript = '';
        let finalTranscript = '';

        for (let i = event.resultIndex; i < event.results.length; ++i) {
          const item = event.results[i];
          if (item.isFinal) {
            finalTranscript += item[0].transcript;
          } else {
            interimTranscript += item[0].transcript;
          }
        }

        if (finalTranscript.trim()) {
          callbacks.onResult(finalTranscript.trim(), true);
        } else if (interimTranscript.trim()) {
          callbacks.onResult(interimTranscript.trim(), false);
        }
      };

      this.recognition.onerror = (event: any) => {
        this.isListeningActive = false;
        let errorMessage = 'Microphone error';
        if (event.error === 'not-allowed') {
          errorMessage = 'Microphone permission was denied. Please allow microphone access in your browser settings.';
        } else if (event.error === 'no-speech') {
          errorMessage = 'No speech was detected. Please try again.';
        } else if (event.error === 'network') {
          errorMessage = 'Network error during speech recognition.';
        } else {
          errorMessage = `Speech error: ${event.error}`;
        }
        callbacks.onError(errorMessage);
      };

      this.recognition.onend = () => {
        this.isListeningActive = false;
        callbacks.onEnd();
      };

      this.recognition.start();
    } catch (err: any) {
      this.isListeningActive = false;
      callbacks.onError(err.message || 'Could not start microphone listening.');
    }
  }

  public stopListening() {
    this.isListeningActive = false;
    if (this.recognition) {
      try {
        this.recognition.stop();
      } catch (e) {
        // ignore if already stopped
      }
    }
  }

  public isListening(): boolean {
    return this.isListeningActive;
  }

  // Interruption: immediately cancel speaking
  public stopSpeaking() {
    if (this.currentAudioElement) {
      try {
        this.currentAudioElement.pause();
        this.currentAudioElement.currentTime = 0;
      } catch (e) {}
      this.currentAudioElement = null;
    }
    if (typeof window !== 'undefined' && window.speechSynthesis) {
      try {
        window.speechSynthesis.cancel();
      } catch (e) {}
    }
    this.synthUtterance = null;
  }

  /**
   * Primary Speech Output Method
   * Intelligently selects between Neural Bengali TTS, Gemini TTS, and Browser Speech Synthesis.
   */
  public async speakText(text: string, options: SpeakOptions = {}): Promise<void> {
    this.stopSpeaking();

    const {
      voiceEngine = 'gemini',
      geminiVoice = 'Zephyr',
      banglaVoiceType = 'neural-female',
      browserVoiceName = '',
      banglaVoiceName = '',
      voiceLanguageMode = 'auto',
      speechTextBn = '',
      rate = 1,
      pitch = 1,
      volume = 1,
      fallbackToBrowser = true,
      onStart,
      onEnd,
      onError,
    } = options;

    if (!text || !text.trim()) {
      onEnd?.();
      return;
    }

    // Determine target spoken text and whether target language is Bengali
    const hasBanglaCharacters = /[\u0980-\u09FF]/.test(text);
    const hasSpeechTextBn = !!(speechTextBn && speechTextBn.trim());
    const isBanglaTarget =
      voiceLanguageMode === 'bangla' ||
      hasBanglaCharacters ||
      (voiceLanguageMode === 'auto' && (hasBanglaCharacters || hasSpeechTextBn));

    let spokenText = text;
    if (isBanglaTarget) {
      if (hasSpeechTextBn) {
        spokenText = speechTextBn.trim();
      } else if (!hasBanglaCharacters) {
        spokenText = convertBanglishToBangla(text);
      }
      spokenText = normalizeBanglaTextForSpeech(spokenText);
    }

    // ==========================================
    // ROUTE 1: BENGALI NEURAL TTS (High Quality)
    // ==========================================
    if (isBanglaTarget && banglaVoiceType !== 'browser') {
      try {
        onStart?.();
        const res = await fetch('/api/tts/bangla', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            text: spokenText,
            voice: banglaVoiceType,
            rate,
            pitch,
          }),
        });

        const data = await res.json();

        if (data.audioBase64) {
          const audio = new Audio(`data:audio/mpeg;base64,${data.audioBase64}`);
          this.currentAudioElement = audio;

          // Apply speaking speed & volume
          let effectiveRate = Math.max(0.75, Math.min(1.5, rate));
          if (banglaVoiceType === 'neural-female') {
            effectiveRate *= 1.03;
          } else if (banglaVoiceType === 'neural-male') {
            effectiveRate *= 0.94;
          }

          audio.playbackRate = effectiveRate;
          audio.volume = Math.max(0, Math.min(1, volume));

          audio.onended = () => {
            this.currentAudioElement = null;
            onEnd?.();
          };

          audio.onerror = () => {
            if (fallbackToBrowser) {
              this.speakWithBrowserSynth(spokenText, {
                ...options,
                voiceLanguageMode: 'bangla',
              });
            } else {
              onEnd?.();
              onError?.('Bengali audio playback error.');
            }
          };

          await audio.play();
          return;
        } else if (fallbackToBrowser) {
          // Fall back to Browser Bengali Voice
          this.speakWithBrowserSynth(spokenText, {
            ...options,
            voiceLanguageMode: 'bangla',
          });
          return;
        }
      } catch (err) {
        console.warn('Bangla neural TTS network failure, falling back to browser:', err);
        if (fallbackToBrowser) {
          this.speakWithBrowserSynth(spokenText, {
            ...options,
            voiceLanguageMode: 'bangla',
          });
          return;
        } else {
          onEnd?.();
          onError?.('Could not play Bengali voice audio.');
          return;
        }
      }
    }

    // ==========================================
    // ROUTE 2: GEMINI NEURAL TTS (for English)
    // ==========================================
    if (!isBanglaTarget && voiceEngine === 'gemini' && !this.ttsQuotaExhausted) {
      try {
        onStart?.();
        const res = await fetch('/api/tts', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ text: spokenText, voice: geminiVoice }),
        });
        const data = await res.json();

        if (data.quotaExceeded) {
          this.ttsQuotaExhausted = true;
        }

        if (data.audioBase64) {
          const audio = new Audio(`data:${data.mimeType || 'audio/wav'};base64,${data.audioBase64}`);
          this.currentAudioElement = audio;
          audio.playbackRate = Math.max(0.75, Math.min(1.5, rate));
          audio.volume = Math.max(0, Math.min(1, volume));

          audio.onended = () => {
            this.currentAudioElement = null;
            onEnd?.();
          };

          audio.onerror = () => {
            this.speakWithBrowserSynth(spokenText, options);
          };

          await audio.play();
          return;
        } else {
          if (data.useFallback) {
            this.ttsQuotaExhausted = true;
          }
          this.speakWithBrowserSynth(spokenText, options);
          return;
        }
      } catch {
        this.ttsQuotaExhausted = true;
        this.speakWithBrowserSynth(spokenText, options);
        return;
      }
    }

    // ==========================================
    // ROUTE 3: BROWSER SPEECH SYNTHESIS
    // ==========================================
    this.speakWithBrowserSynth(spokenText, {
      ...options,
      voiceLanguageMode: isBanglaTarget ? 'bangla' : 'english',
    });
  }

  /**
   * Browser Speech Synthesis with robust Bengali & English voice mapping
   */
  public speakWithBrowserSynth(text: string, options: SpeakOptions) {
    if (typeof window === 'undefined' || !window.speechSynthesis) {
      options.onEnd?.();
      return;
    }

    const {
      browserVoiceName = '',
      banglaVoiceName = '',
      voiceLanguageMode = 'auto',
      rate = 1,
      pitch = 1,
      volume = 1,
      onStart,
      onEnd,
      onError,
    } = options;

    const hasBanglaCharacters = /[\u0980-\u09FF]/.test(text);
    const isBangla = voiceLanguageMode === 'bangla' || hasBanglaCharacters;

    let clean = text
      .replace(/```[\s\S]*?```/g, 'কোড ব্লক।')
      .replace(/[*#_~`\[\]()]/g, '')
      .trim();

    if (isBangla) {
      clean = normalizeBanglaTextForSpeech(clean);
    }

    const utterance = new SpeechSynthesisUtterance(clean);
    this.synthUtterance = utterance;

    utterance.rate = isBangla ? Math.min(rate, 0.95) : rate;
    utterance.pitch = pitch;
    utterance.volume = Math.max(0, Math.min(1, volume));

    const voices = window.speechSynthesis.getVoices();

    if (isBangla) {
      utterance.lang = 'bn-BD';
      let chosenVoice: SpeechSynthesisVoice | undefined;

      if (banglaVoiceName) {
        chosenVoice = voices.find((v) => v.name === banglaVoiceName);
      }
      if (!chosenVoice) {
        // Find best standard Bengali voice (prefer bn-BD over bn-IN)
        chosenVoice =
          voices.find((v) => v.lang.toLowerCase().replace('_', '-').startsWith('bn-bd')) ||
          voices.find(
            (v) =>
              v.lang.toLowerCase().startsWith('bn') ||
              v.name.toLowerCase().includes('bangla') ||
              v.name.toLowerCase().includes('bengali')
          );
      }
      if (chosenVoice) {
        utterance.voice = chosenVoice;
      }
    } else {
      utterance.lang = 'en-US';
      if (browserVoiceName) {
        const matched = voices.find((v) => v.name === browserVoiceName);
        if (matched) utterance.voice = matched;
      }
    }

    utterance.onstart = () => {
      onStart?.();
    };

    utterance.onend = () => {
      this.synthUtterance = null;
      onEnd?.();
    };

    utterance.onerror = (e) => {
      this.synthUtterance = null;
      onEnd?.();
      if (e.error !== 'interrupted' && e.error !== 'canceled') {
        onError?.(`Speech synthesis error: ${e.error}`);
      }
    };

    window.speechSynthesis.speak(utterance);
  }
}

export const jarvisSpeech = new JarvisSpeechEngine();
