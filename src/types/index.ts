
export interface Message {
  id: string;
  role: "user" | "assistant" | "system";
  content: string;
  timestamp: number;
  calendarEvent?: CalendarEvent;
}

export interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

export interface Settings {
  openaiApiKey: string;
  voiceActivation: boolean;
  voiceId: string;
  speechRate: number;
  googleCalendarConnected: boolean;
  elevenlabsApiKey?: string;
  useElevenlabs?: boolean;
  useWhisper?: boolean;
}

export interface CalendarEvent {
  id: string;
  summary: string;
  title?: string; // Added for compatibility with ChatBubble component
  description?: string;
  start: {
    dateTime: string;
    timeZone?: string;
  };
  end: {
    dateTime: string;
    timeZone?: string;
  };
  created?: string;
  updated?: string;
  status?: string;
}

export const defaultSettings: Settings = {
  openaiApiKey: "",
  voiceActivation: false,
  voiceId: "en-US-Standard-B",
  speechRate: 1,
  googleCalendarConnected: false,
  elevenlabsApiKey: "",
  useElevenlabs: false,
  useWhisper: false,
};
