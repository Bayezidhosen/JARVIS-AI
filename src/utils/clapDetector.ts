/**
 * Double Clap Detection Engine for JARVIS AI
 * Uses Web Audio API with a bandpass filter (1.5kHz - 5.5kHz) and transient peak analysis
 * to detect two distinct hand claps within a configurable interval (300ms - 800ms).
 * Features AudioWorklet processing with seamless Web Audio fallback.
 */

import { ClapWakeStatus } from '../types';

export interface ClapDetectorCallbacks {
  onStatusChange: (status: ClapWakeStatus) => void;
  onFirstClap: (timestamp: number) => void;
  onDoubleClap: (intervalMs: number) => void;
  onEnergyMeter?: (currentLevel: number, threshold: number) => void;
  onError: (errorMessage: string) => void;
}

export interface ClapDetectorOptions {
  sensitivity: 'low' | 'medium' | 'high';
  minIntervalMs?: number; // default 250ms
  maxIntervalMs?: number; // default 800ms
}

export class DoubleClapDetector {
  private audioContext: AudioContext | null = null;
  private mediaStream: MediaStream | null = null;
  private analyser: AnalyserNode | null = null;
  private filterNode: BiquadFilterNode | null = null;
  private workletNode: AudioWorkletNode | null = null;
  private scriptProcessor: ScriptProcessorNode | null = null;
  private timerId: any = null;

  private isRunning: boolean = false;
  private isPaused: boolean = false;
  private options: ClapDetectorOptions = {
    sensitivity: 'medium',
    minIntervalMs: 250,
    maxIntervalMs: 800,
  };

  private callbacks: ClapDetectorCallbacks | null = null;

  // Detection state
  private firstClapTime: number = 0;
  private lastClapDetectedTime: number = 0;
  private cooldownUntil: number = 0;
  private ambientNoiseLevel: number = 0.04;
  private resetTimeoutId: any = null;
  private permissionStatus: 'unknown' | 'granted' | 'denied' = 'unknown';

  public getPermissionStatus(): 'unknown' | 'granted' | 'denied' {
    return this.permissionStatus;
  }

  // Thresholds mapped to sensitivity
  public getThreshold(): number {
    switch (this.options.sensitivity) {
      case 'high':
        return 0.18; // picks up lighter or further claps
      case 'low':
        return 0.38; // requires loud, deliberate claps
      case 'medium':
      default:
        return 0.26; // balanced
    }
  }

  public updateOptions(newOptions: Partial<ClapDetectorOptions>) {
    this.options = { ...this.options, ...newOptions };
  }

  public isActive(): boolean {
    return this.isRunning;
  }

  /**
   * Temporarily pause detection while assistant is speaking or recording voice commands
   * to eliminate false positive triggers from speaker playback or user dictation.
   */
  public setPaused(paused: boolean) {
    this.isPaused = paused;
    if (paused) {
      this.firstClapTime = 0;
      if (this.resetTimeoutId) {
        clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = null;
      }
    }
  }

  public async start(
    callbacks: ClapDetectorCallbacks,
    options?: Partial<ClapDetectorOptions>
  ): Promise<boolean> {
    if (this.isRunning) {
      this.stop();
    }

    if (options) {
      this.updateOptions(options);
    }
    this.callbacks = callbacks;

    if (typeof window === 'undefined' || !navigator.mediaDevices?.getUserMedia) {
      this.permissionStatus = 'denied';
      callbacks.onError('Web Audio API or Microphone is not supported in this browser.');
      callbacks.onStatusChange('error');
      return false;
    }

    try {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      if (!AudioCtx) {
        callbacks.onError('AudioContext is not supported in this browser environment.');
        callbacks.onStatusChange('error');
        return false;
      }

      this.audioContext = new AudioCtx();
      if (this.audioContext.state === 'suspended') {
        await this.audioContext.resume();
      }

      // Request microphone input with raw characteristics
      // so sharp acoustic transients (1.5kHz - 5.5kHz) are crisp and unaltered
      this.mediaStream = await navigator.mediaDevices.getUserMedia({
        audio: {
          echoCancellation: false,
          noiseSuppression: false,
          autoGainControl: false,
        },
      });

      this.permissionStatus = 'granted';

      const source = this.audioContext.createMediaStreamSource(this.mediaStream);

      // Bandpass filter centered at 3000 Hz with Q=1.4
      // This filters out low rumblings (<1kHz), room fans, and speech vowel fundamentals
      this.filterNode = this.audioContext.createBiquadFilter();
      this.filterNode.type = 'bandpass';
      this.filterNode.frequency.setValueAtTime(3000, this.audioContext.currentTime);
      this.filterNode.Q.setValueAtTime(1.4, this.audioContext.currentTime);

      source.connect(this.filterNode);

      // Try AudioWorklet first for high-frequency temporal precision
      let workletInitialized = false;
      if (this.audioContext.audioWorklet) {
        try {
          const workletCode = `
            class ClapProcessor extends AudioWorkletProcessor {
              constructor() {
                super();
                this.lastMeterTime = 0;
              }
              process(inputs) {
                const input = inputs[0];
                if (!input || !input[0]) return true;
                const samples = input[0];
                let peak = 0;
                let sumSq = 0;
                for (let i = 0; i < samples.length; i++) {
                  const val = Math.abs(samples[i]);
                  if (val > peak) peak = val;
                  sumSq += val * val;
                }
                const rms = Math.sqrt(sumSq / samples.length);
                const now = currentTime * 1000;
                
                // Send meter update every ~40ms
                if (now - this.lastMeterTime > 40) {
                  this.lastMeterTime = now;
                  this.port.postMessage({ type: 'meter', peak, rms, time: now });
                }
                
                // Send fast transient impulse
                if (peak > 0.12) {
                  this.port.postMessage({ type: 'transient', peak, rms, time: now });
                }
                return true;
              }
            }
            registerProcessor('clap-transient-processor', ClapProcessor);
          `;
          const blob = new Blob([workletCode], { type: 'application/javascript' });
          const url = URL.createObjectURL(blob);
          await this.audioContext.audioWorklet.addModule(url);
          URL.revokeObjectURL(url);

          this.workletNode = new AudioWorkletNode(this.audioContext, 'clap-transient-processor');
          this.filterNode.connect(this.workletNode);
          this.workletNode.connect(this.audioContext.destination); // Required to keep worklet processing alive

          this.workletNode.port.onmessage = (event) => {
            const data = event.data;
            if (!this.isRunning || this.isPaused) return;

            const currentEnergy = Math.max(data.peak * 0.75, data.rms * 1.5);
            const threshold = this.getThreshold();

            if (this.callbacks?.onEnergyMeter) {
              this.callbacks.onEnergyMeter(currentEnergy, threshold);
            }

            // Adapt ambient noise floor slowly
            this.ambientNoiseLevel = this.ambientNoiseLevel * 0.96 + currentEnergy * 0.04;

            if (data.type === 'transient') {
              const now = performance.now();
              if (now < this.cooldownUntil) return;

              // Validate transient sharpness
              const isSharpTransient =
                currentEnergy > threshold &&
                currentEnergy > this.ambientNoiseLevel * 2.2 &&
                data.peak > data.rms * 1.5;

              if (isSharpTransient) {
                this.handleClapDetected(now);
              }
            }
          };

          workletInitialized = true;
        } catch (workletErr) {
          // Fall back gracefully to AnalyserNode & ScriptProcessor
          workletInitialized = false;
        }
      }

      // If worklet wasn't initialized or failed, use high-speed Analyser loop
      if (!workletInitialized) {
        this.analyser = this.audioContext.createAnalyser();
        this.analyser.fftSize = 512;
        this.analyser.smoothingTimeConstant = 0.15; // Fast transient response
        this.filterNode.connect(this.analyser);

        // High-precision analysis timer (15ms interval works in background tabs)
        this.timerId = setInterval(() => {
          this.analyzeFrame();
        }, 15);
      }

      this.isRunning = true;
      this.isPaused = false;
      this.firstClapTime = 0;
      this.cooldownUntil = 0;
      this.ambientNoiseLevel = 0.04;

      callbacks.onStatusChange('waiting');
      return true;
    } catch (err: any) {
      this.isRunning = false;
      let msg = 'Could not access microphone for Double Clap detection.';
      if (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError') {
        this.permissionStatus = 'denied';
        msg = 'Microphone permission was denied. Please allow microphone access in your browser to enable hands-free Double Clap wake-up.';
      } else if (err.name === 'NotFoundError') {
        msg = 'No microphone device was found on this system.';
      }
      callbacks.onError(msg);
      callbacks.onStatusChange('error');
      return false;
    }
  }

  private analyzeFrame = () => {
    if (!this.isRunning || this.isPaused || !this.analyser) return;

    const buffer = new Float32Array(this.analyser.fftSize);
    this.analyser.getFloatTimeDomainData(buffer);

    let sumOfSquares = 0;
    let peak = 0;
    for (let i = 0; i < buffer.length; i++) {
      const val = Math.abs(buffer[i]);
      if (val > peak) peak = val;
      sumOfSquares += val * val;
    }

    const rms = Math.sqrt(sumOfSquares / buffer.length);
    const currentEnergy = Math.max(peak * 0.75, rms * 1.5);
    const threshold = this.getThreshold();

    if (this.callbacks?.onEnergyMeter) {
      this.callbacks.onEnergyMeter(currentEnergy, threshold);
    }

    // Adapt ambient background noise floor
    this.ambientNoiseLevel = this.ambientNoiseLevel * 0.96 + currentEnergy * 0.04;

    const now = performance.now();
    if (now < this.cooldownUntil) {
      return;
    }

    // A clap transient must:
    // 1. Exceed absolute threshold
    // 2. Be at least 2.2x above ambient noise (filters steady loud background noise)
    // 3. Peak-to-RMS attack ratio > 1.5 (sharp attack curve, not continuous humming)
    const isTransient =
      currentEnergy > threshold &&
      currentEnergy > this.ambientNoiseLevel * 2.2 &&
      peak > rms * 1.5;

    if (isTransient) {
      this.handleClapDetected(now);
    }
  };

  private handleClapDetected(now: number) {
    const minGap = this.options.minIntervalMs || 250;
    const maxGap = this.options.maxIntervalMs || 800;

    // Reject re-triggers within the same clap event (< 180ms)
    if (now - this.lastClapDetectedTime < 180) {
      return;
    }

    this.lastClapDetectedTime = now;

    if (this.firstClapTime === 0) {
      // FIRST CLAP DETECTED
      this.firstClapTime = now;
      this.callbacks?.onFirstClap(now);
      this.callbacks?.onStatusChange('first_clap');

      if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = setTimeout(() => {
        if (this.firstClapTime === now && this.isRunning && !this.isPaused) {
          this.firstClapTime = 0;
          this.callbacks?.onStatusChange('waiting');
        }
      }, maxGap + 120);
    } else {
      // POTENTIAL SECOND CLAP
      const delta = now - this.firstClapTime;

      if (delta >= minGap && delta <= maxGap) {
        // SUCCESS: DOUBLE CLAP DETECTED!
        if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
        this.firstClapTime = 0;
        this.cooldownUntil = now + 1800; // 1.8s cooldown to prevent accidental trigger loops

        this.callbacks?.onStatusChange('detected');
        this.callbacks?.onDoubleClap(Math.round(delta));
      } else if (delta > maxGap) {
        // Interval expired: treat as new first clap
        this.firstClapTime = now;
        this.callbacks?.onFirstClap(now);
        this.callbacks?.onStatusChange('first_clap');

        if (this.resetTimeoutId) clearTimeout(this.resetTimeoutId);
        this.resetTimeoutId = setTimeout(() => {
          if (this.firstClapTime === now && this.isRunning && !this.isPaused) {
            this.firstClapTime = 0;
            this.callbacks?.onStatusChange('waiting');
          }
        }, maxGap + 120);
      }
    }
  }

  /**
   * Manual test trigger for testing or simulating double clap wake-up
   */
  public triggerTestWake() {
    this.callbacks?.onStatusChange('detected');
    this.callbacks?.onDoubleClap(450);
  }

  public stop() {
    this.isRunning = false;
    this.isPaused = false;
    this.firstClapTime = 0;

    if (this.resetTimeoutId) {
      clearTimeout(this.resetTimeoutId);
      this.resetTimeoutId = null;
    }

    if (this.timerId !== null) {
      clearInterval(this.timerId);
      this.timerId = null;
    }

    if (this.workletNode) {
      try {
        this.workletNode.disconnect();
      } catch (e) {}
      this.workletNode = null;
    }

    if (this.filterNode) {
      try {
        this.filterNode.disconnect();
      } catch (e) {}
      this.filterNode = null;
    }

    if (this.analyser) {
      try {
        this.analyser.disconnect();
      } catch (e) {}
      this.analyser = null;
    }

    if (this.scriptProcessor) {
      try {
        this.scriptProcessor.disconnect();
      } catch (e) {}
      this.scriptProcessor = null;
    }

    if (this.mediaStream) {
      this.mediaStream.getTracks().forEach((track) => track.stop());
      this.mediaStream = null;
    }

    if (this.audioContext) {
      try {
        this.audioContext.close();
      } catch (e) {}
      this.audioContext = null;
    }

    this.callbacks?.onStatusChange('disabled');
  }
}

export const doubleClapDetector = new DoubleClapDetector();
