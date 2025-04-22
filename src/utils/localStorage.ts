
import { Settings, ChatHistory } from '../types';

const SETTINGS_KEY = 'lumen-settings';
const CHAT_HISTORY_KEY = 'lumen-chat-history';

// Default settings
export const defaultSettings: Settings = {
  openaiApiKey: '',
  elevenlabsApiKey: '',
  useElevenlabs: false,
  useWhisper: false,
  voiceActivation: true,
};

// Settings management
export const saveSettings = (settings: Settings): void => {
  localStorage.setItem(SETTINGS_KEY, JSON.stringify(settings));
};

export const getSettings = (): Settings => {
  const settings = localStorage.getItem(SETTINGS_KEY);
  return settings ? JSON.parse(settings) : defaultSettings;
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
