
let recognition: SpeechRecognition | null = null;
let isListening = false;

// Initialize speech recognition
export const initSpeechRecognition = (): boolean => {
  try {
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (SpeechRecognition) {
      recognition = new SpeechRecognition();
      recognition.continuous = true;
      recognition.interimResults = true;
      recognition.lang = 'en-US';
      return true;
    }
    return false;
  } catch (error) {
    console.error('Speech recognition not supported:', error);
    return false;
  }
};

// Start listening
export const startListening = (
  onInterimResult: (text: string) => void,
  onFinalResult: (text: string) => void,
  onError: (error: Error) => void
): boolean => {
  if (!recognition) {
    if (!initSpeechRecognition()) return false;
  }

  if (isListening) return true;

  try {
    recognition!.onresult = (event) => {
      const resultIndex = event.resultIndex;
      const transcript = Array.from(event.results)
        .slice(resultIndex)
        .map(result => result[0].transcript)
        .join('');

      if (event.results[resultIndex].isFinal) {
        onFinalResult(transcript);
      } else {
        onInterimResult(transcript);
      }
    };

    recognition!.onerror = (event) => {
      onError(new Error(`Speech recognition error: ${event.error}`));
    };

    recognition!.start();
    isListening = true;
    return true;
  } catch (error) {
    console.error('Error starting speech recognition:', error);
    onError(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

// Stop listening
export const stopListening = (): boolean => {
  if (!recognition || !isListening) return false;
  
  try {
    recognition.stop();
    isListening = false;
    return true;
  } catch (error) {
    console.error('Error stopping speech recognition:', error);
    return false;
  }
};

// Check if browser supports speech recognition
export const isSpeechRecognitionSupported = (): boolean => {
  return !!(window.SpeechRecognition || window.webkitSpeechRecognition);
};
