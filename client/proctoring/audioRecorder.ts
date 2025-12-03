export interface AudioRecording {
  blob: Blob;
  duration: number;
  timestamp: number;
  audioLevel: number;
}

export class AudioRecorder {
  private mediaRecorder: MediaRecorder | null = null;
  private audioChunks: Blob[] = [];
  private stream: MediaStream | null = null;
  private isRecording = false;
  private recordingStartTime = 0;
  private recordingTimeout: NodeJS.Timeout | null = null;

  async initialize(stream: MediaStream) {
    this.stream = stream;
    
    try {
      // Check if MediaRecorder is supported
      if (!MediaRecorder.isTypeSupported('audio/webm')) {
        console.warn('audio/webm not supported, trying audio/mp4');
        if (!MediaRecorder.isTypeSupported('audio/mp4')) {
          throw new Error('No supported audio format found');
        }
      }

      console.log('AudioRecorder initialized successfully');
    } catch (error) {
      console.error('Failed to initialize audio recorder:', error);
      throw error;
    }
  }

  /**
   * Start recording audio snippet
   * @param duration Duration in milliseconds (default: 3000ms = 3 seconds)
   * @param audioLevel Current audio level for metadata
   */
  async startRecording(duration: number = 3000, audioLevel: number = 0): Promise<AudioRecording | null> {
    if (!this.stream) {
      console.error('AudioRecorder not initialized');
      return null;
    }

    if (this.isRecording) {
      console.warn('Already recording, stopping previous recording');
      await this.stopRecording();
    }

    return new Promise((resolve) => {
      try {
        this.audioChunks = [];
        this.recordingStartTime = Date.now();
        
        // Create MediaRecorder with the audio stream
        const mimeType = MediaRecorder.isTypeSupported('audio/webm') ? 'audio/webm' : 'audio/mp4';
        this.mediaRecorder = new MediaRecorder(this.stream!, {
          mimeType,
          audioBitsPerSecond: 128000, // 128 kbps
        });

        this.mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            this.audioChunks.push(event.data);
          }
        };

        this.mediaRecorder.onstop = () => {
          const blob = new Blob(this.audioChunks, { type: mimeType });
          const recordingDuration = Date.now() - this.recordingStartTime;
          
          const recording: AudioRecording = {
            blob,
            duration: recordingDuration,
            timestamp: this.recordingStartTime,
            audioLevel,
          };

          this.isRecording = false;
          this.audioChunks = [];
          
          console.log('Audio recording completed:', {
            duration: `${recordingDuration}ms`,
            size: `${(blob.size / 1024).toFixed(2)} KB`,
            audioLevel: `${(audioLevel * 100).toFixed(1)}%`,
          });

          resolve(recording);
        };

        this.mediaRecorder.onerror = (error) => {
          console.error('MediaRecorder error:', error);
          this.isRecording = false;
          resolve(null);
        };

        // Start recording
        this.mediaRecorder.start();
        this.isRecording = true;

        console.log(`Started audio recording for ${duration}ms`);

        // Auto-stop after duration
        this.recordingTimeout = setTimeout(() => {
          this.stopRecording();
        }, duration);

      } catch (error) {
        console.error('Failed to start recording:', error);
        resolve(null);
      }
    });
  }

  private stopRecording() {
    if (this.recordingTimeout) {
      clearTimeout(this.recordingTimeout);
      this.recordingTimeout = null;
    }

    if (this.mediaRecorder && this.isRecording) {
      this.mediaRecorder.stop();
    }
  }

  /**
   * Convert audio blob to base64 for storage
   */
  static async blobToBase64(blob: Blob): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => {
        const base64 = reader.result as string;
        // Remove data URL prefix (e.g., "data:audio/webm;base64,")
        const base64Data = base64.split(',')[1];
        resolve(base64Data);
      };
      reader.onerror = reject;
      reader.readAsDataURL(blob);
    });
  }

  /**
   * Convert base64 back to blob for playback
   */
  static base64ToBlob(base64: string, mimeType: string = 'audio/webm'): Blob {
    const byteCharacters = atob(base64);
    const byteNumbers = new Array(byteCharacters.length);
    
    for (let i = 0; i < byteCharacters.length; i++) {
      byteNumbers[i] = byteCharacters.charCodeAt(i);
    }
    
    const byteArray = new Uint8Array(byteNumbers);
    return new Blob([byteArray], { type: mimeType });
  }

  cleanup() {
    this.stopRecording();
    this.stream = null;
    this.mediaRecorder = null;
    this.audioChunks = [];
  }
}
