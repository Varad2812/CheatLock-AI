export interface SystemData {
  tabActive: boolean;
  windowFocused: boolean;
  mouseInWindow: boolean;
  timestamp: number;
}

export class SystemMonitor {
  private onSystemUpdate: ((data: SystemData) => void) | null = null;
  private tabActive: boolean = true;
  private windowFocused: boolean = true;
  private mouseInWindow: boolean = true;

  initialize(onSystemUpdate: (data: SystemData) => void) {
    this.onSystemUpdate = onSystemUpdate;

    // Monitor tab visibility
    document.addEventListener('visibilitychange', this.handleVisibilityChange.bind(this));

    // Monitor window focus
    window.addEventListener('blur', this.handleWindowBlur.bind(this));
    window.addEventListener('focus', this.handleWindowFocus.bind(this));

    // Monitor mouse leaving window
    document.addEventListener('mouseleave', this.handleMouseLeave.bind(this));
    document.addEventListener('mouseenter', this.handleMouseEnter.bind(this));

    // Prevent common cheating shortcuts
    this.preventCheatingShortcuts();

    // Initial state
    this.reportState();
  }

  private handleVisibilityChange() {
    this.tabActive = !document.hidden;
    this.reportState();
  }

  private handleWindowBlur() {
    this.windowFocused = false;
    this.reportState();
  }

  private handleWindowFocus() {
    this.windowFocused = true;
    this.reportState();
  }

  private handleMouseLeave() {
    this.mouseInWindow = false;
    this.reportState();
  }

  private handleMouseEnter() {
    this.mouseInWindow = true;
    this.reportState();
  }

  private reportState() {
    if (this.onSystemUpdate) {
      this.onSystemUpdate({
        tabActive: this.tabActive,
        windowFocused: this.windowFocused,
        mouseInWindow: this.mouseInWindow,
        timestamp: Date.now(),
      });
    }
  }

  private preventCheatingShortcuts() {
    // Prevent copy, paste, cut
    document.addEventListener('copy', (e) => e.preventDefault());
    document.addEventListener('paste', (e) => e.preventDefault());
    document.addEventListener('cut', (e) => e.preventDefault());

    // Prevent common shortcuts
    document.addEventListener('keydown', (e) => {
      // Prevent Ctrl+C, Ctrl+V, Ctrl+X, Ctrl+A
      if (e.ctrlKey || e.metaKey) {
        if (['c', 'v', 'x', 'a', 'f', 'p'].includes(e.key.toLowerCase())) {
          e.preventDefault();
        }
      }

      // Prevent F12, Ctrl+Shift+I (DevTools)
      if (e.key === 'F12' || (e.ctrlKey && e.shiftKey && e.key === 'I')) {
        e.preventDefault();
      }

      // Prevent Alt+Tab (attempt)
      if (e.altKey && e.key === 'Tab') {
        e.preventDefault();
      }
    });

    // Prevent right-click
    document.addEventListener('contextmenu', (e) => e.preventDefault());
  }

  cleanup() {
    document.removeEventListener('visibilitychange', this.handleVisibilityChange);
    window.removeEventListener('blur', this.handleWindowBlur);
    window.removeEventListener('focus', this.handleWindowFocus);
    document.removeEventListener('mouseleave', this.handleMouseLeave);
    document.removeEventListener('mouseenter', this.handleMouseEnter);
  }
}

// System violation detection logic
export class SystemViolationDetector {
  private violationHistory: { type: string; timestamp: number }[] = [];

  checkViolation(systemData: SystemData): {
    isViolation: boolean;
    type?: string;
    severity?: number;
    description?: string;
  } {
    const now = Date.now();

    // Check if we already reported a violation in the last 2 seconds (debounce)
    const recentViolation = this.violationHistory.find(
      (v) => now - v.timestamp < 2000 && (v.type === 'tab_switch' || v.type === 'window_blur')
    );
    
    if (recentViolation) {
      return { isViolation: false }; // Don't report duplicate
    }

    // Tab switch detection (priority - this usually also triggers window blur)
    if (!systemData.tabActive) {
      this.violationHistory.push({ type: 'tab_switch', timestamp: now });
      return {
        isViolation: true,
        type: 'tab_switch',
        severity: 0.9,
        description: 'Tab switched or hidden',
      };
    }

    // Window blur detection (only if tab is still active)
    if (!systemData.windowFocused && systemData.tabActive) {
      this.violationHistory.push({ type: 'window_blur', timestamp: now });
      return {
        isViolation: true,
        type: 'window_blur',
        severity: 0.8,
        description: 'Window lost focus',
      };
    }

    // Mouse leaving window (potential second screen)
    if (!systemData.mouseInWindow) {
      const recentMouseLeave = this.violationHistory.filter(
        (v) => v.type === 'mouse_leave' && now - v.timestamp < 5000
      );

      if (recentMouseLeave.length > 3) {
        return {
          isViolation: true,
          type: 'multiple_devices',
          severity: 0.7,
          description: 'Mouse frequently leaving window - possible second screen',
        };
      }

      this.violationHistory.push({ type: 'mouse_leave', timestamp: now });
    }

    // Clean old history
    this.violationHistory = this.violationHistory.filter((v) => now - v.timestamp < 60000);

    return { isViolation: false };
  }

  reset() {
    this.violationHistory = [];
  }
}
