export interface AudioData {
  noiseLevel: number;
  speechDetected: boolean;
  confidence: number;
}

export class AudioDetector {
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private microphone: MediaStreamAudioSourceNode | null = null;
  private dataArray: Uint8Array<ArrayBuffer> | null = null;
  private onAudioUpdate: ((data: AudioData) => void) | null = null;
  private animationFrameId: number | null = null;
  private stream: MediaStream | null = null;

  async initialize(onAudioUpdate: (data: AudioData) => void) {
    this.onAudioUpdate = onAudioUpdate;

    try {
      // Request microphone access
      this.stream = await navigator.mediaDevices.getUserMedia({ audio: true });

      // Create audio context
      this.audioContext = new AudioContext();
      this.analyser = this.audioContext.createAnalyser();
      this.analyser.fftSize = 2048;

      const bufferLength = this.analyser.frequencyBinCount;
      this.dataArray = new Uint8Array(bufferLength);

      // Connect microphone to analyser
      this.microphone = this.audioContext.createMediaStreamSource(this.stream);
      this.microphone.connect(this.analyser);

      // Start monitoring
      this.monitor();
    } catch (error) {
      console.error('Failed to initialize audio detector:', error);
      throw error;
    }
  }

  private monitor() {
    if (!this.analyser || !this.dataArray) return;

    this.analyser.getByteTimeDomainData(this.dataArray);

    // Calculate RMS (Root Mean Square) for noise level
    let sum = 0;
    for (let i = 0; i < this.dataArray.length; i++) {
      const normalized = (this.dataArray[i] - 128) / 128;
      sum += normalized * normalized;
    }
    const rms = Math.sqrt(sum / this.dataArray.length);
    const noiseLevel = rms;

    // Detect speech patterns (simplified)
    const speechDetected = this.detectSpeech(this.dataArray);

    // Log audio levels periodically (every 2 seconds) for debugging
    if (Date.now() % 2000 < 100) {
      console.log('Audio monitoring:', {
        noiseLevel: (noiseLevel * 100).toFixed(1) + '%',
        speechDetected,
        threshold: '15%'
      });
    }

    if (this.onAudioUpdate) {
      this.onAudioUpdate({
        noiseLevel,
        speechDetected,
        confidence: noiseLevel > 0.1 ? 0.8 : 0.3,
      });
    }

    this.animationFrameId = requestAnimationFrame(() => this.monitor());
  }

  private detectSpeech(dataArray: Uint8Array<ArrayBuffer>): boolean {
    // Simple speech detection based on frequency analysis
    // Count peaks in the waveform
    let peakCount = 0;
    let lastValue = dataArray[0];

    for (let i = 1; i < dataArray.length; i++) {
      const currentValue = dataArray[i];
      const diff = Math.abs(currentValue - lastValue);
      
      // Lowered threshold from 10 to 5 for better sensitivity
      if (diff > 5) {
        peakCount++;
      }
      lastValue = currentValue;
    }

    // Lowered threshold from 50 to 30 for better detection
    // Speech typically has more variation than background noise
    return peakCount > 30;
  }

  stop() {
    if (this.animationFrameId) {
      cancelAnimationFrame(this.animationFrameId);
    }
    if (this.microphone) {
      this.microphone.disconnect();
    }
    if (this.audioContext) {
      this.audioContext.close();
    }
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
    }
  }
}

// Audio violation detection logic
export class AudioViolationDetector {
  private audioHistory: { noiseLevel: number; speechDetected: boolean; timestamp: number }[] = [];
  private readonly SPEECH_DURATION_THRESHOLD = 2000; // 2 seconds
  private HIGH_NOISE_THRESHOLD: number;

  constructor(audioSensitivity: number = 0.15) {
    this.HIGH_NOISE_THRESHOLD = audioSensitivity;
    console.log('AudioViolationDetector initialized:', {
      audioSensitivity,
      threshold: (audioSensitivity * 100).toFixed(0) + '%'
    });
  }

  checkViolation(audioData: AudioData): {
    isViolation: boolean;
    type?: string;
    severity?: number;
    description?: string;
    requiresSnapshot?: boolean;
    audioLevel?: number;
  } {
    const now = Date.now();

    // If sensitivity is 0, disable audio detection completely
    if (this.HIGH_NOISE_THRESHOLD === 0) {
      return { isViolation: false };
    }

    // Add to history
    this.audioHistory.push({
      noiseLevel: audioData.noiseLevel,
      speechDetected: audioData.speechDetected,
      timestamp: now,
    });

    // Keep only recent history (last 10 seconds)
    this.audioHistory = this.audioHistory.filter((entry) => now - entry.timestamp < 10000);

    // Single cough or background noise - allowed
    if (audioData.noiseLevel > this.HIGH_NOISE_THRESHOLD && !audioData.speechDetected) {
      return { isViolation: false };
    }

    // Check for sustained speech (lowered threshold for better detection)
    const recentSpeech = this.audioHistory.filter(
      (entry) => now - entry.timestamp < this.SPEECH_DURATION_THRESHOLD && entry.speechDetected
    );

    // Lowered from 10 to 3 for better detection
    if (recentSpeech.length > 3) {
      // Prevent duplicate violations within 5 seconds
      const recentViolation = this.audioHistory.find(
        (entry) => now - entry.timestamp < 5000 && entry.noiseLevel === -1
      );
      
      if (recentViolation) {
        return { isViolation: false };
      }
      
      // Mark violation reported
      this.audioHistory.push({ noiseLevel: -1, speechDetected: false, timestamp: now });
      
      return {
        isViolation: true,
        type: 'audio_speech',
        severity: 0.8,
        description: 'Speech or talking detected - maintain silence',
        requiresSnapshot: true, // Capture snapshot with audio level
        audioLevel: audioData.noiseLevel,
      };
    }

    // Check for high noise levels using configured threshold
    const highNoiseCount = this.audioHistory.filter(
      (entry) => now - entry.timestamp < 2000 && entry.noiseLevel > this.HIGH_NOISE_THRESHOLD
    ).length;

    // Lowered from 8 to 5 for better detection
    if (highNoiseCount > 5) {
      // Prevent duplicate
      const recentViolation = this.audioHistory.find(
        (entry) => now - entry.timestamp < 5000 && entry.noiseLevel === -1
      );
      
      if (recentViolation) {
        return { isViolation: false };
      }
      
      this.audioHistory.push({ noiseLevel: -1, speechDetected: false, timestamp: now });
      
      return {
        isViolation: true,
        type: 'audio_external',
        severity: 0.7,
        description: 'Excessive noise detected - keep environment quiet',
        requiresSnapshot: true, // Capture snapshot with audio level
        audioLevel: audioData.noiseLevel,
      };
    }

    return { isViolation: false };
  }

  reset() {
    this.audioHistory = [];
  }
}