
import { Settings, ChatHistory } from '../types';

const SETTINGS_KEY = 'lumen-settings';
const CHAT_HISTORY_KEY = 'lumen-chat-history';
const AUTH_REMEMBER_KEY = 'lumen-remember-auth';
const OPENAI_KEY_STORAGE_KEY = 'lumen-openai-key';

// Default settings
export const defaultSettings: Settings = {
  openaiApiKey: '',
  voiceActivation: true,
  voiceId: "en-US-Standard-B",
  speechRate: 1,
  googleCalendarConnected: false,
  elevenlabsApiKey: '',
  useElevenlabs: false,
  useWhisper: false,
};

// Settings management
export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): Settings => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : defaultSettings;
};

// Helper function to validate OpenAI API key format
export const validateOpenAIKeyFormat = (key: string): boolean => {
  const trimmedKey = key ? key.trim() : '';
  
  if (!trimmedKey) return false;
  
  // OpenAI keys must start with "sk-" (including newer sk-proj-* keys) and be at least 48 characters long
  // SK-Proj keys can be 164+ characters
  if (!trimmedKey.startsWith('sk-') || trimmedKey.length < 48) {
    console.error(`❌ Invalid API key format. Key must start with 'sk-' and be at least 48 characters (found ${trimmedKey.length} chars)`);
    return false;
  }
  
  return true;
};

// OpenAI API key storage (separate from settings for better security)
export const saveOpenAIKey = (key: string): void => {
  // Properly validate the key format
  const trimmedKey = key.trim();
  if (!validateOpenAIKeyFormat(trimmedKey)) {
    console.error("❌ Invalid OpenAI API key format. Key must start with 'sk-' and be at least 48 characters");
    return;
  }
  
  // Store the full, unmodified key
  localStorage.setItem(OPENAI_KEY_STORAGE_KEY, trimmedKey);
  console.log(`✅ Saved full OpenAI API key to localStorage (${trimmedKey.length} chars, starts with ${trimmedKey.substring(0, 7)})`);
};

export const getOpenAIKey = (): string | null => {
  const key = localStorage.getItem(OPENAI_KEY_STORAGE_KEY);
  if (key) {
    // Validate key format
    if (!validateOpenAIKeyFormat(key)) {
      console.error("❌ Retrieved invalid OpenAI API key format from localStorage");
      return null;
    }
    console.log(`✅ Retrieved full OpenAI API key from localStorage (${key.length} chars, starts with ${key.substring(0, 7)})`);
    return key;
  }
  return null;
};

// Chat history management
export const saveChatHistory = (history: ChatHistory): void => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify(history));
};

export const getChatHistory = (): ChatHistory => {
  const history = localStorage.getItem(CHAT_HISTORY_KEY);
  return history ? JSON.parse(history) : { messages: [], lastUpdated: Date.now() };
};

export const clearChatHistory = (): void => {
  localStorage.setItem(CHAT_HISTORY_KEY, JSON.stringify({ messages: [], lastUpdated: Date.now() }));
};

// Auth remember preferences
export const setRememberAuth = (remember: boolean): void => {
  localStorage.setItem(AUTH_REMEMBER_KEY, remember.toString());
};

export const getRememberAuth = (): boolean => {
  const remember = localStorage.getItem(AUTH_REMEMBER_KEY);
  return remember === 'true';
};
