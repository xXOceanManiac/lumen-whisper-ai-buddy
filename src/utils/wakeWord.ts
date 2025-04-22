
import { startListening, stopListening } from './speechToText';

const WAKE_WORD = 'lumen';
let isWakeWordActive = false;
let wakeWordCallback: ((activated: boolean) => void) | null = null;

// Start listening for wake word
export const startWakeWordDetection = (
  onWakeWordDetected: () => void,
  onError: (error: Error) => void
): boolean => {
  if (isWakeWordActive) return true;

  isWakeWordActive = true;
  wakeWordCallback = (activated: boolean) => {
    if (activated) onWakeWordDetected();
  };

  return startListening(
    // Interim results handler
    (text: string) => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes(WAKE_WORD)) {
        stopListening();
        if (wakeWordCallback) wakeWordCallback(true);
        // Restart wake word detection after a short delay
        setTimeout(() => {
          startWakeWordDetection(onWakeWordDetected, onError);
        }, 5000); // Wait 5 seconds before listening for wake word again
      }
    },
    // Final results handler
    (text: string) => {
      const lowerText = text.toLowerCase();
      if (lowerText.includes(WAKE_WORD)) {
        stopListening();
        if (wakeWordCallback) wakeWordCallback(true);
        // Restart wake word detection after a short delay
        setTimeout(() => {
          startWakeWordDetection(onWakeWordDetected, onError);
        }, 5000); // Wait 5 seconds before listening for wake word again
      }
    },
    onError
  );
};

// Stop wake word detection
export const stopWakeWordDetection = (): boolean => {
  isWakeWordActive = false;
  wakeWordCallback = null;
  return stopListening();
};

// Check if wake word detection is active
export const isWakeWordDetectionActive = (): boolean => {
  return isWakeWordActive;
};
