import { GazeDetector, GazeViolationDetector, GazeData } from './gazeDetector';
import { AudioDetector, AudioViolationDetector, AudioData } from './audioDetector';
import { SystemMonitor, SystemViolationDetector, SystemData } from './systemMonitor';
import { KeystrokeMonitor, KeystrokeViolationDetector, KeystrokeData } from './keystrokeMonitor';
import { AudioRecorder } from './audioRecorder';
import { supabase, ViolationType } from '../utils/supabase';

export interface ViolationEvent {
  type: ViolationType;
  severity: number;
  description: string;
  timestamp: number;
  snapshot?: string;
  audioLevel?: number;
  audioRecording?: string; // Base64 encoded audio
  audioDuration?: number;
}

export interface ProctoringConfig {
  attemptId: string;
  violationThreshold: number;
  audioSensitivity?: number;
  gazeSensitivity?: number;
  faceMissingTimeout?: number;
  onViolation: (violation: ViolationEvent) => void;
  onExamEnd: (reason: string) => void;
}

export class ProctoringEngine {
  private gazeDetector: GazeDetector;
  private audioDetector: AudioDetector;
  private systemMonitor: SystemMonitor;
  private keystrokeMonitor: KeystrokeMonitor;
  private audioRecorder: AudioRecorder;

  private gazeViolationDetector: GazeViolationDetector;
  private audioViolationDetector: AudioViolationDetector;
  private systemViolationDetector: SystemViolationDetector;
  private keystrokeViolationDetector: KeystrokeViolationDetector;

  private config: ProctoringConfig;
  private violationCount: number = 0;
  private isActive: boolean = false;
  private videoElement: HTMLVideoElement | null = null;
  private canvasElement: HTMLCanvasElement | null = null;
  private audioStream: MediaStream | null = null;

  private logInterval: NodeJS.Timeout | null = null;

  constructor(config: ProctoringConfig) {
    this.config = config;

    this.gazeDetector = new GazeDetector();
    this.audioDetector = new AudioDetector();
    this.systemMonitor = new SystemMonitor();
    this.keystrokeMonitor = new KeystrokeMonitor();
    this.audioRecorder = new AudioRecorder();

    // Pass sensitivity settings to detectors
    this.gazeViolationDetector = new GazeViolationDetector(
      config.gazeSensitivity,
      config.faceMissingTimeout
    );
    this.audioViolationDetector = new AudioViolationDetector(
      config.audioSensitivity
    );
    this.systemViolationDetector = new SystemViolationDetector();
    this.keystrokeViolationDetector = new KeystrokeViolationDetector();
    
    console.log('Proctoring engine initialized with settings:', {
      audioSensitivity: config.audioSensitivity,
      gazeSensitivity: config.gazeSensitivity,
      faceMissingTimeout: config.faceMissingTimeout,
    });
  }

  async start(videoElement: HTMLVideoElement, canvasElement: HTMLCanvasElement) {
    this.videoElement = videoElement;
    this.canvasElement = canvasElement;
    this.isActive = true;

    try {
      // Initialize all detectors
      await this.gazeDetector.initialize(videoElement, this.handleGazeUpdate.bind(this));
      await this.audioDetector.initialize(this.handleAudioUpdate.bind(this));
      this.systemMonitor.initialize(this.handleSystemUpdate.bind(this));
      this.keystrokeMonitor.initialize(this.handleKeystrokeUpdate.bind(this));

      // Get audio stream for recording
      this.audioStream = await navigator.mediaDevices.getUserMedia({ audio: true });
      await this.audioRecorder.initialize(this.audioStream);

      // Start periodic logging
      this.startPeriodicLogging();

      console.log('Proctoring engine started successfully');
    } catch (error) {
      console.error('Failed to start proctoring engine:', error);
      throw error;
    }
  }

  private handleGazeUpdate(gazeData: GazeData) {
    if (!this.isActive) return;

    const violation = this.gazeViolationDetector.checkViolation(gazeData);
    if (violation.isViolation) {
      this.handleViolation(violation, violation.requiresSnapshot);
    }
  }

  private async handleAudioUpdate(audioData: AudioData) {
    if (!this.isActive) return;

    const violation = this.audioViolationDetector.checkViolation(audioData);
    if (violation.isViolation) {
      // Record audio snippet when audio violation is detected
      console.log('Audio violation detected - starting audio recording');
      const audioRecording = await this.audioRecorder.startRecording(3000, violation.audioLevel || 0);
      
      if (audioRecording) {
        // Convert to base64 for storage
        const base64Audio = await AudioRecorder.blobToBase64(audioRecording.blob);
        await this.handleViolation(
          violation, 
          violation.requiresSnapshot, 
          violation.audioLevel,
          base64Audio,
          audioRecording.duration
        );
      } else {
        // Fallback if recording fails
        await this.handleViolation(violation, violation.requiresSnapshot, violation.audioLevel);
      }
    }
  }

  private handleSystemUpdate(systemData: SystemData) {
    if (!this.isActive) return;

    const violation = this.systemViolationDetector.checkViolation(systemData);
    if (violation.isViolation) {
      this.handleViolation(violation);
    }
  }

  private handleKeystrokeUpdate(keystrokeData: KeystrokeData) {
    if (!this.isActive) return;

    const violation = this.keystrokeViolationDetector.checkViolation(keystrokeData);
    if (violation.isViolation) {
      this.handleViolation(violation);
    }
  }

  private async handleViolation(
    violation: {
      type?: string;
      severity?: number;
      description?: string;
    },
    requiresSnapshot: boolean = false,
    audioLevel?: number,
    audioRecording?: string,
    audioDuration?: number
  ) {
    if (!violation.type || !violation.severity || !violation.description) return;

    this.violationCount++;
    console.log(`Violation ${this.violationCount}/${this.config.violationThreshold}:`, violation);

    // Capture snapshot only if required (saves space and processing)
    let snapshot: string | undefined;
    if (requiresSnapshot) {
      console.log('Capturing snapshot for violation:', violation.type);
      snapshot = await this.captureSnapshot();
    }

    const violationEvent: ViolationEvent = {
      type: violation.type as ViolationType,
      severity: violation.severity,
      description: violation.description,
      timestamp: Date.now(),
      snapshot,
      audioLevel, // Include audio level if present
      audioRecording, // Include audio recording if present
      audioDuration, // Include audio duration if present
    };

    // Save violation to database
    try {
      await this.saveViolation(violationEvent);
      console.log('Violation saved to database');
    } catch (error) {
      console.error('Failed to save violation:', error);
    }

    // Update attempt violation count
    try {
      const { error: updateError } = await supabase
        .from('exam_attempts')
        .update({ violation_count: this.violationCount })
        .eq('id', this.config.attemptId);
      
      if (updateError) {
        console.error('Failed to update violation count:', updateError);
      } else {
        console.log('Violation count updated in database:', this.violationCount);
      }
    } catch (error) {
      console.error('Error updating violation count:', error);
    }

    // Notify callback - let UI handle threshold checking
    this.config.onViolation(violationEvent);
    
    // Note: Threshold checking is done in the UI's handleViolation callback
    // This ensures proper state management and prevents double-triggering
  }

  private async captureSnapshot(): Promise<string | undefined> {
    if (!this.videoElement || !this.canvasElement) return undefined;

    try {
      const context = this.canvasElement.getContext('2d');
      if (!context) return undefined;

      this.canvasElement.width = this.videoElement.videoWidth;
      this.canvasElement.height = this.videoElement.videoHeight;
      context.drawImage(this.videoElement, 0, 0);

      // Convert to base64 (compressed JPEG, quality 0.6 to save space)
      const base64Image = this.canvasElement.toDataURL('image/jpeg', 0.6);
      
      console.log('Snapshot captured, size:', Math.round(base64Image.length / 1024), 'KB');
      
      return base64Image;
    } catch (error) {
      console.error('Failed to capture snapshot:', error);
      return undefined;
    }
  }

  private async saveViolation(violation: ViolationEvent) {
    try {
      const violationData = {
        attempt_id: this.config.attemptId,
        violation_type: violation.type,
        severity: violation.severity,
        description: violation.description,
        snapshot_url: violation.snapshot || null, // Base64 image or null
        audio_recording: violation.audioRecording || null, // Base64 audio or null
        audio_duration: violation.audioDuration || null,
        audio_level: violation.audioLevel || null,
        metadata: violation.audioLevel ? { audioLevel: violation.audioLevel } : null,
        detected_at: new Date(violation.timestamp).toISOString(),
      };
      
      console.log('Saving violation to database:', {
        ...violationData,
        snapshot_url: violationData.snapshot_url ? `[${Math.round(violationData.snapshot_url.length / 1024)}KB image]` : null,
        audio_recording: violationData.audio_recording ? `[${Math.round(violationData.audio_recording.length / 1024)}KB audio]` : null,
      });
      
      const { data, error } = await supabase
        .from('violations')
        .insert(violationData)
        .select();
      
      if (error) {
        console.error('Database error saving violation:', error);
        throw error;
      }
      
      console.log('Violation saved successfully');
    } catch (error) {
      console.error('Failed to save violation:', error);
      throw error;
    }
  }

  private startPeriodicLogging() {
    // Log proctoring data every 5 seconds
    this.logInterval = setInterval(async () => {
      if (!this.isActive) return;

      const keystrokePattern = this.keystrokeMonitor.getKeystrokePattern();

      await supabase.from('proctoring_logs').insert({
        attempt_id: this.config.attemptId,
        keystroke_pattern: keystrokePattern,
        tab_active: true,
        window_focused: true,
        timestamp: new Date().toISOString(),
      });
    }, 5000);
  }

  private async endExam(reason: string) {
    console.log('Ending exam:', reason);
    this.isActive = false;

    // DON'T update database here - let the UI handle it
    // Just stop monitoring and notify the UI
    
    // Stop all detectors
    this.stop();

    // Notify callback so the UI can handle submission
    this.config.onExamEnd(reason);
  }

  stop() {
    this.isActive = false;

    if (this.logInterval) {
      clearInterval(this.logInterval);
    }

    this.gazeDetector.stop();
    this.audioDetector.stop();
    this.systemMonitor.cleanup();
    this.keystrokeMonitor.cleanup();
    this.audioRecorder.cleanup();
    
    if (this.audioStream) {
      this.audioStream.getTracks().forEach(track => track.stop());
      this.audioStream = null;
    }
  }

  getViolationCount(): number {
    return this.violationCount;
  }

  getViolationThreshold(): number {
    return this.config.violationThreshold;
  }
}
