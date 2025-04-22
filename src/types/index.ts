
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: number;
}

export interface Settings {
  openaiApiKey: string;
  elevenlabsApiKey?: string;
  useElevenlabs: boolean;
  useWhisper: boolean;
  voiceActivation: boolean;
  voiceId?: string;
}

export interface ChatHistory {
  messages: Message[];
  lastUpdated: number;
}

// API response types
export interface OpenAIResponse {
  id: string;
  object: string;
  created: number;
  model: string;
  choices: Array<{
    index: number;
    message: {
      role: string;
      content: string;
    };
    finish_reason: string;
  }>;
  usage: {
    prompt_tokens: number;
    completion_tokens: number;
    total_tokens: number;
  };
}
