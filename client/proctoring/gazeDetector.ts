import { FaceMesh, Results } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

export interface GazeData {
  direction: 'center' | 'left' | 'right' | 'up' | 'down';
  headAngle: number;
  confidence: number;
  faceDetected: boolean;
  faceCount: number;
  extremeAngle: boolean;
}

export class GazeDetector {
  private faceMesh: FaceMesh | null = null;
  private camera: Camera | null = null;
  private videoElement: HTMLVideoElement | null = null;
  private onGazeUpdate: ((data: GazeData) => void) | null = null;
  private lastFaceDetectedTime: number = Date.now();

  async initialize(videoElement: HTMLVideoElement, onGazeUpdate: (data: GazeData) => void) {
    this.videoElement = videoElement;
    this.onGazeUpdate = onGazeUpdate;

    // Initialize MediaPipe Face Mesh
    this.faceMesh = new FaceMesh({
      locateFile: (file) => {
        return `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${file}`;
      },
    });

    this.faceMesh.setOptions({
      maxNumFaces: 1,
      refineLandmarks: true,
      minDetectionConfidence: 0.5,
      minTrackingConfidence: 0.5,
    });

    this.faceMesh.onResults(this.onResults.bind(this));

    // Initialize camera
    this.camera = new Camera(videoElement, {
      onFrame: async () => {
        if (this.faceMesh && this.videoElement) {
          await this.faceMesh.send({ image: this.videoElement });
        }
      },
      width: 640,
      height: 480,
    });

    await this.camera.start();
  }

  private onResults(results: Results) {
    const faceCount = results.multiFaceLandmarks?.length || 0;
    
    if (faceCount === 0) {
      // No face detected
      if (this.onGazeUpdate) {
        this.onGazeUpdate({
          direction: 'center',
          headAngle: 0,
          confidence: 0,
          faceDetected: false,
          faceCount: 0,
          extremeAngle: false,
        });
      }
      return;
    }

    this.lastFaceDetectedTime = Date.now();
    const landmarks = results.multiFaceLandmarks[0];

    // Calculate gaze direction using key facial landmarks
    const gazeData = this.calculateGazeDirection(landmarks);
    gazeData.faceCount = faceCount;

    if (this.onGazeUpdate) {
      this.onGazeUpdate(gazeData);
    }
  }

  private calculateGazeDirection(landmarks: any[]): GazeData {
    // Key landmark indices for gaze detection
    const noseTip = landmarks[1]; // Nose tip
    const leftEye = landmarks[33]; // Left eye inner corner
    const rightEye = landmarks[263]; // Right eye inner corner
    const chin = landmarks[152]; // Chin
    const forehead = landmarks[10]; // Forehead

    // Calculate horizontal gaze (left/right)
    const eyeCenter = {
      x: (leftEye.x + rightEye.x) / 2,
      y: (leftEye.y + rightEye.y) / 2,
    };

    const horizontalOffset = noseTip.x - eyeCenter.x;
    const verticalOffset = noseTip.y - eyeCenter.y;

    // Calculate head angle
    const headAngle = Math.atan2(rightEye.y - leftEye.y, rightEye.x - leftEye.x) * (180 / Math.PI);
    const absHeadAngle = Math.abs(headAngle);

    // Determine gaze direction with thresholds
    let direction: 'center' | 'left' | 'right' | 'up' | 'down' = 'center';
    
    // Horizontal gaze detection
    if (horizontalOffset > 0.03) {
      direction = 'right';
    } else if (horizontalOffset < -0.03) {
      direction = 'left';
    }
    
    // Vertical gaze detection (prioritize over horizontal)
    // Allow looking down up to 45 degrees for rough sheet
    if (verticalOffset > 0.04 && absHeadAngle < 45) {
      direction = 'down'; // Looking down - allowed for rough sheet
    } else if (verticalOffset < -0.02) {
      direction = 'up';
    }

    // Check for extreme angles (beyond rough sheet usage)
    const extremeAngle = absHeadAngle > 50 || (verticalOffset > 0.08);

    // Calculate confidence based on face size and clarity
    const faceWidth = Math.abs(leftEye.x - rightEye.x);
    const confidence = Math.min(faceWidth * 5, 1.0);

    return {
      direction,
      headAngle: absHeadAngle,
      confidence,
      faceDetected: true,
      faceCount: 1,
      extremeAngle,
    };
  }

  stop() {
    if (this.camera) {
      this.camera.stop();
    }
    if (this.faceMesh) {
      this.faceMesh.close();
    }
  }
}

// Gaze violation detection logic
export class GazeViolationDetector {
  private gazeHistory: { direction: string; timestamp: number }[] = [];
  private readonly SUSPICIOUS_DURATION = 2000; // 2 seconds
  private FACE_MISSING_TIMEOUT: number;
  private GAZE_SENSITIVITY: number;
  private lastFaceDetectedTime: number = Date.now();

  constructor(gazeSensitivity: number = 0.20, faceMissingTimeout: number = 5000) {
    this.GAZE_SENSITIVITY = gazeSensitivity;
    this.FACE_MISSING_TIMEOUT = faceMissingTimeout;
    console.log('GazeViolationDetector initialized:', {
      gazeSensitivity,
      faceMissingTimeout: faceMissingTimeout / 1000 + 's'
    });
  }

  checkViolation(gazeData: GazeData): {
    isViolation: boolean;
    type?: string;
    severity?: number;
    description?: string;
    requiresSnapshot?: boolean;
  } {
    const now = Date.now();

    // CRITICAL: Check for multiple faces (someone helping)
    if (gazeData.faceCount > 1) {
      return {
        isViolation: true,
        type: 'multiple_faces',
        severity: 1.0,
        description: `${gazeData.faceCount} faces detected - unauthorized person present`,
        requiresSnapshot: true, // ALWAYS capture snapshot for multiple faces
      };
    }

    // Check if face is missing
    if (!gazeData.faceDetected) {
      const timeSinceFace = now - this.lastFaceDetectedTime;
      if (timeSinceFace > this.FACE_MISSING_TIMEOUT) {
        // Reset after reporting to avoid spam
        this.lastFaceDetectedTime = now - this.FACE_MISSING_TIMEOUT + 3000;
        return {
          isViolation: true,
          type: 'face_missing',
          severity: 0.9,
          description: `Face not detected for ${Math.round(timeSinceFace / 1000)} seconds`,
          requiresSnapshot: true, // Capture snapshot (will show empty frame)
        };
      }
      return { isViolation: false };
    }

    this.lastFaceDetectedTime = now;

    // Check for extreme head angles (beyond rough sheet usage)
    if (gazeData.extremeAngle) {
      const recentExtreme = this.gazeHistory.find(
        (entry) => now - entry.timestamp < 3000 && entry.direction === 'extreme_angle_reported'
      );
      
      if (!recentExtreme) {
        this.gazeHistory.push({ direction: 'extreme_angle_reported', timestamp: now });
        return {
          isViolation: true,
          type: 'extreme_head_angle',
          severity: 0.85,
          description: `Extreme head angle detected (${Math.round(gazeData.headAngle)}°) - suspicious position`,
          requiresSnapshot: true, // Capture snapshot for extreme angles
        };
      }
    }

    // Add to history
    this.gazeHistory.push({
      direction: gazeData.direction,
      timestamp: now,
    });

    // Keep only recent history (last 10 seconds)
    this.gazeHistory = this.gazeHistory.filter((entry) => now - entry.timestamp < 10000);

    // Check for downward gaze (allowed for rough sheet)
    if (gazeData.direction === 'down' && gazeData.headAngle < 50) {
      return { isViolation: false }; // Allowed
    }

    // Check for sustained sideward or upward gaze (more sensitive)
    const recentGazes = this.gazeHistory.filter((entry) => now - entry.timestamp < this.SUSPICIOUS_DURATION);
    
    const suspiciousDirections = ['left', 'right', 'up'];
    const suspiciousCount = recentGazes.filter((entry) => suspiciousDirections.includes(entry.direction)).length;

    // Use sensitivity setting (0 = disabled, 1 = very sensitive)
    // Convert sensitivity to threshold: 0.20 = 3 detections, 0 = disabled
    const threshold = this.GAZE_SENSITIVITY === 0 ? 999 : Math.max(1, Math.floor(5 - (this.GAZE_SENSITIVITY * 10)));
    
    if (suspiciousCount > threshold && gazeData.direction !== 'center') {
      const direction = gazeData.direction;
      
      // Prevent duplicate violations within 3 seconds
      const recentViolation = this.gazeHistory.find(
        (entry) => now - entry.timestamp < 3000 && entry.direction === 'violation_reported'
      );
      
      if (recentViolation) {
        return { isViolation: false };
      }
      
      // Mark that we reported a violation
      this.gazeHistory.push({ direction: 'violation_reported', timestamp: now });
      
      return {
        isViolation: true,
        type: direction === 'up' ? 'gaze_upward' : 'gaze_sideward',
        severity: 0.7,
        description: `Looking ${direction} - keep eyes on screen`,
        requiresSnapshot: true, // Capture snapshot for gaze violations
      };
    }

    return { isViolation: false };
  }

  reset() {
    this.gazeHistory = [];
    this.lastFaceDetectedTime = Date.now();
  }
}
