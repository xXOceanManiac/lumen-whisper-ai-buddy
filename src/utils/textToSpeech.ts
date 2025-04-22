
let synth: SpeechSynthesis | null = null;
let voices: SpeechSynthesisVoice[] = [];

// Initialize speech synthesis
export const initTextToSpeech = (): boolean => {
  try {
    if ('speechSynthesis' in window) {
      synth = window.speechSynthesis;
      return true;
    }
    return false;
  } catch (error) {
    console.error('Speech synthesis not supported:', error);
    return false;
  }
};

// Get available voices
export const getVoices = (): SpeechSynthesisVoice[] => {
  if (!synth) {
    if (!initTextToSpeech()) return [];
  }

  const fetchVoices = () => {
    voices = synth!.getVoices();
    return voices;
  };

  if (synth!.onvoiceschanged !== undefined) {
    synth!.onvoiceschanged = fetchVoices;
  }

  return fetchVoices();
};

// Speak text
export const speak = (
  text: string,
  voiceName: string = '',
  onStart?: () => void,
  onEnd?: () => void,
  onError?: (error: Error) => void
): boolean => {
  if (!synth) {
    if (!initTextToSpeech()) return false;
  }

  try {
    // Cancel any ongoing speech
    synth!.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    
    // Set voice if specified
    if (voiceName) {
      const availableVoices = getVoices();
      const selectedVoice = availableVoices.find(
        voice => voice.name === voiceName
      );
      if (selectedVoice) utterance.voice = selectedVoice;
    }

    // Default to a female English voice if available
    if (!utterance.voice) {
      const availableVoices = getVoices();
      const femaleEnglishVoice = availableVoices.find(
        voice => voice.lang.includes('en') && voice.name.includes('Female')
      );
      if (femaleEnglishVoice) utterance.voice = femaleEnglishVoice;
    }

    // Set event handlers
    if (onStart) utterance.onstart = onStart;
    if (onEnd) utterance.onend = onEnd;
    if (onError) utterance.onerror = (event) => onError(new Error(`Speech synthesis error: ${event.error}`));

    // Speak
    synth!.speak(utterance);
    return true;
  } catch (error) {
    console.error('Error with speech synthesis:', error);
    if (onError) onError(error instanceof Error ? error : new Error(String(error)));
    return false;
  }
};

// Stop speaking
export const stopSpeaking = (): boolean => {
  if (!synth) return false;
  
  try {
    synth.cancel();
    return true;
  } catch (error) {
    console.error('Error stopping speech synthesis:', error);
    return false;
  }
};

// Check if browser supports speech synthesis
export const isSpeechSynthesisSupported = (): boolean => {
  return 'speechSynthesis' in window;
};
