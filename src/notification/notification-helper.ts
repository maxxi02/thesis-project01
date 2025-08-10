export class NotificationHelper {
  private static audioContext: AudioContext | null = null;
  private static notificationSound: HTMLAudioElement | null = null;
  private static isInitialized = false;
  private static userInteracted = false;
  private static debugMode = true; // Enable for debugging

  private static log(message: string, ...args: unknown[]) {
    if (this.debugMode) {
      console.log(`[NotificationHelper] ${message}`, ...args);
    }
  }

  private static error(message: string, ...args: unknown[]) {
    console.error(`[NotificationHelper] ${message}`, ...args);
  }

  // Call this when user first interacts with the page
  static registerUserInteraction() {
    this.log("User interaction registered");
    this.userInteracted = true;

    // Try to resume audio context if it exists
    if (this.audioContext?.state === "suspended") {
      this.log("Resuming suspended audio context");
      this.audioContext
        .resume()
        .then(() => {
          this.log("Audio context resumed successfully");
        })
        .catch((error) => {
          this.error("Failed to resume audio context:", error);
        });
    }
  }

  // Initialize audio context and preload sound
  static async initialize() {
    if (this.isInitialized) {
      this.log("Already initialized, skipping");
      return;
    }

    this.log("Initializing notification system");

    try {
      // Check if browser supports audio
      if (typeof window !== "undefined" && "AudioContext" in window) {
        this.audioContext = new (window.AudioContext ||
          (
            window as typeof window & {
              webkitAudioContext: typeof AudioContext;
            }
          ).webkitAudioContext)();
        this.log("Audio context created, state:", this.audioContext.state);
      }

      // Test multiple audio file formats for better compatibility
      const audioFormats = [
        "/audio/notification-bell.wav",
        "/audio/notification-bell.mp3",
        "/audio/notification-bell.ogg",
        "data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUegjaN0/PNeSsFJHfH8N2QQAoUXrTp66hVFApGn+DyvmUe",
      ];

      for (const audioSrc of audioFormats) {
        try {
          this.notificationSound = new Audio(audioSrc);
          this.notificationSound.volume = 0.5; // Set reasonable volume
          this.notificationSound.preload = "auto";

          // Wait for the audio to load
          await new Promise((resolve, reject) => {
            const timeout = setTimeout(
              () => reject(new Error("Audio load timeout")),
              5000
            );

            this.notificationSound!.addEventListener(
              "canplaythrough",
              () => {
                clearTimeout(timeout);
                this.log(`Audio loaded successfully: ${audioSrc}`);
                resolve(true);
              },
              { once: true }
            );

            this.notificationSound!.addEventListener(
              "error",
              (e) => {
                clearTimeout(timeout);
                reject(e);
              },
              { once: true }
            );

            this.notificationSound!.load();
          });

          break; // Successfully loaded, break out of loop
        } catch (error) {
          this.log(`Failed to load audio from ${audioSrc}:`, error);
          this.notificationSound = null;
          continue;
        }
      }

      if (!this.notificationSound) {
        this.log("All audio formats failed, will use Web Audio API fallback");
      }

      this.isInitialized = true;
      this.log("Notification system initialized successfully");
    } catch (error) {
      this.error("Notification system initialization failed:", error);
    }
  }

  // Test function to verify audio is working
  static async testSound() {
    this.log("Testing sound...");

    if (!this.userInteracted) {
      this.error("Cannot test sound: No user interaction registered");
      return false;
    }

    try {
      await this.triggerNotification({
        sound: true,
        vibration: false,
        respectAudioSettings: false, // Bypass settings for testing
        type: "assignment",
      });
      return true;
    } catch (error) {
      this.error("Sound test failed:", error);
      return false;
    }
  }

  // Trigger notification with sound and/or vibration
  static async triggerNotification(options: {
    sound?: boolean;
    vibration?: boolean;
    respectAudioSettings?: boolean;
    type?: "assignment" | "status" | "completion";
  }) {
    this.log("Trigger notification called with options:", options);

    try {
      const {
        sound = true,
        vibration = true,
        respectAudioSettings = true,
        type = "assignment",
      } = options;

      // Check if we should respect browser mute settings
      if (respectAudioSettings) {
        const isBrowserMuted =
          window.localStorage.getItem("notificationSoundDisabled") === "true";
        if (isBrowserMuted) {
          this.log("Sound disabled in browser settings");
          return;
        }
      }

      // Check user interaction requirement
      if (sound && !this.userInteracted) {
        this.error("Cannot play sound: No user interaction registered");
        return;
      }

      // Play sound if requested and supported
      if (sound) {
        this.log("Attempting to play notification sound");
        await this.playNotificationSound(type);
      }

      // Trigger vibration if requested and supported
      if (vibration && "vibrate" in navigator) {
        this.log("Triggering vibration");
        this.triggerVibration(type);
      }
    } catch (error) {
      this.error("Error triggering notification:", error);
    }
  }

  private static async playNotificationSound(
    type: "assignment" | "status" | "completion"
  ) {
    if (!this.userInteracted) {
      this.error("Cannot play sound: No user interaction");
      return;
    }

    this.log(`Playing ${type} notification sound`);

    try {
      // Try to play the preloaded sound first
      if (this.notificationSound) {
        this.log("Using preloaded HTML5 audio");
        this.notificationSound.currentTime = 0;

        const playPromise = this.notificationSound.play();

        if (playPromise !== undefined) {
          await playPromise.catch((error) => {
            this.error("HTML5 audio playback failed:", error);
            // Fallback to Web Audio API if HTML5 audio fails
            this.log("Falling back to Web Audio API");
            this.playFallbackSound(type);
          });
        }
        return;
      }

      // Fallback to Web Audio API if preload failed
      this.log("No preloaded audio, using Web Audio API fallback");
      this.playFallbackSound(type);
    } catch (error) {
      this.error("Error playing notification sound:", error);
    }
  }

  private static playFallbackSound(
    type: "assignment" | "status" | "completion"
  ) {
    if (!this.audioContext || !this.userInteracted) {
      this.error(
        "Cannot play fallback sound: Missing audio context or user interaction"
      );
      return;
    }

    this.log(`Playing Web Audio API fallback for ${type}`);

    try {
      const oscillator = this.audioContext.createOscillator();
      const gainNode = this.audioContext.createGain();

      oscillator.type = "sine";

      // Different frequencies for different notification types
      const frequency =
        type === "assignment" ? 800 : type === "status" ? 600 : 1000;
      oscillator.frequency.value = frequency;

      gainNode.gain.value = 0.1;

      oscillator.connect(gainNode);
      gainNode.connect(this.audioContext.destination);

      oscillator.start();
      oscillator.stop(this.audioContext.currentTime + 0.3);

      this.log(`Web Audio API sound played at ${frequency}Hz`);
    } catch (error) {
      this.error("Error playing fallback sound:", error);
    }
  }

  private static triggerVibration(
    type: "assignment" | "status" | "completion"
  ) {
    if (!("vibrate" in navigator)) {
      this.log("Vibration not supported");
      return;
    }

    try {
      const pattern =
        type === "assignment"
          ? [200, 100, 200]
          : type === "status"
          ? [200]
          : [200, 100, 200, 100, 200]; // completion pattern

      navigator.vibrate(pattern);
      this.log(`Vibration triggered with pattern: [${pattern.join(", ")}]`);
    } catch (error) {
      this.error("Error triggering vibration:", error);
    }
  }

  // Utility method to check system status
  static getStatus() {
    return {
      isInitialized: this.isInitialized,
      userInteracted: this.userInteracted,
      hasAudioContext: !!this.audioContext,
      audioContextState: this.audioContext?.state,
      hasNotificationSound: !!this.notificationSound,
      notificationSoundReady: this.notificationSound?.readyState === 4,
      isSoundDisabled:
        window.localStorage.getItem("notificationSoundDisabled") === "true",
      supportsVibration: "vibrate" in navigator,
    };
  }
}
