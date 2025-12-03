export interface KeystrokeData {
  key: string;
  timestamp: number;
  timeSinceLast: number;
  isPaste: boolean;
}

export class KeystrokeMonitor {
  private onKeystrokeUpdate: ((data: KeystrokeData) => void) | null = null;
  private lastKeystrokeTime: number = Date.now();
  private keystrokeHistory: KeystrokeData[] = [];

  initialize(onKeystrokeUpdate: (data: KeystrokeData) => void) {
    this.onKeystrokeUpdate = onKeystrokeUpdate;

    // Monitor keystrokes
    document.addEventListener('keydown', this.handleKeydown.bind(this));
    document.addEventListener('paste', this.handlePaste.bind(this));
  }

  private handleKeydown(event: KeyboardEvent) {
    const now = Date.now();
    const timeSinceLast = now - this.lastKeystrokeTime;

    const keystrokeData: KeystrokeData = {
      key: event.key,
      timestamp: now,
      timeSinceLast,
      isPaste: false,
    };

    this.keystrokeHistory.push(keystrokeData);
    this.lastKeystrokeTime = now;

    if (this.onKeystrokeUpdate) {
      this.onKeystrokeUpdate(keystrokeData);
    }

    // Keep only recent history (last 100 keystrokes)
    if (this.keystrokeHistory.length > 100) {
      this.keystrokeHistory.shift();
    }
  }

  private handlePaste(event: ClipboardEvent) {
    event.preventDefault(); // Prevent paste

    const now = Date.now();
    const keystrokeData: KeystrokeData = {
      key: 'PASTE',
      timestamp: now,
      timeSinceLast: now - this.lastKeystrokeTime,
      isPaste: true,
    };

    this.keystrokeHistory.push(keystrokeData);

    if (this.onKeystrokeUpdate) {
      this.onKeystrokeUpdate(keystrokeData);
    }
  }

  getKeystrokePattern() {
    return {
      averageTimeBetweenKeys: this.calculateAverageTime(),
      totalKeystrokes: this.keystrokeHistory.length,
      pasteAttempts: this.keystrokeHistory.filter((k) => k.isPaste).length,
    };
  }

  private calculateAverageTime(): number {
    if (this.keystrokeHistory.length < 2) return 0;

    const sum = this.keystrokeHistory.reduce((acc, k) => acc + k.timeSinceLast, 0);
    return sum / this.keystrokeHistory.length;
  }

  cleanup() {
    document.removeEventListener('keydown', this.handleKeydown);
    document.removeEventListener('paste', this.handlePaste);
  }
}

// Keystroke violation detection logic
export class KeystrokeViolationDetector {
  checkViolation(keystrokeData: KeystrokeData): {
    isViolation: boolean;
    type?: string;
    severity?: number;
    description?: string;
  } {
    // Paste attempt
    if (keystrokeData.isPaste) {
      return {
        isViolation: true,
        type: 'copy_paste',
        severity: 0.9,
        description: 'Paste attempt detected',
      };
    }

    // Suspicious pause patterns (very long pause might indicate looking elsewhere)
    if (keystrokeData.timeSinceLast > 30000) {
      // 30 seconds
      return {
        isViolation: true,
        type: 'keystroke_anomaly',
        severity: 0.5,
        description: `Unusual pause in typing: ${Math.round(keystrokeData.timeSinceLast / 1000)} seconds`,
      };
    }

    return { isViolation: false };
  }
}
