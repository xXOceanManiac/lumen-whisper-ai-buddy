
import { Message } from "@/types";
import { validateOpenAIKeyFormat } from "@/utils/localStorage";

const API_BASE_URL = "https://lumen-backend-main.fly.dev";

export const callChatApi = async (
  messages: Message[],
  apiKey: string,
  googleId?: string,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; calendarEvent?: any }> => {
  try {
    const trimmedApiKey = apiKey ? apiKey.trim() : '';

    if (!trimmedApiKey) {
      console.error("❌ Missing or empty API key in callChatApi");
      throw new Error("A valid OpenAI API key is required");
    }

    if (!validateOpenAIKeyFormat(trimmedApiKey)) {
      console.error("❌ Invalid API key format:", trimmedApiKey.substring(0, 7) + "...", "length:", trimmedApiKey.length);
      throw new Error("Invalid API key format. OpenAI keys should start with 'sk-' and be at least 48 characters long.");
    }

    if (!googleId) {
      console.error("❌ Missing googleId in callChatApi");
      throw new Error("googleId is required for chat API calls");
    }

    const formattedMessages = [
      {
        role: 'system',
        content: `You are a smart assistant with access to the user's Google Calendar. You can see upcoming events and add new ones. If the user asks about their schedule or requests an event, handle it naturally and confirm the details.`
      },
      ...messages.map(msg => ({
        role: msg.role,
        content: msg.content
      }))
    ];

    console.log("📩 Sending to /api/chat:", {
      googleId,
      apiKeyPrefix: trimmedApiKey.substring(0, 7) + "...",
      apiKeySuffix: "..." + trimmedApiKey.slice(-4),
      apiKeyLength: trimmedApiKey.length,
      messageCount: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content.substring(0, 50) + "...",
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content.substring(0, 50) + "..."
    });

    const payload = {
      googleId,
      messages: formattedMessages,
      apiKey: trimmedApiKey,
      apiKeyMetadata: {
        prefix: trimmedApiKey.substring(0, 7),
        suffix: trimmedApiKey.slice(-4),
        length: trimmedApiKey.length
      },
      stream: true
    };

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: 'include', // Ensure cookies are included for auth
    });

    if (!response.ok) {
      // Enhanced error handling
      let errorMessage = `Failed to get chat response: ${response.status}`;
      try {
        const contentType = response.headers.get('content-type');
        if (contentType && contentType.includes('application/json')) {
          const errorData = await response.json();
          errorMessage += ` - ${errorData.error || response.statusText}`;
        } else {
          errorMessage += ` - ${response.statusText}`;
        }
      } catch (e) {
        errorMessage += ` - ${response.statusText}`;
      }
      throw new Error(errorMessage);
    }

    const reader = response.body?.getReader();
    const decoder = new TextDecoder();
    let completeContent = '';

    if (reader && onChunk) {
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunkText = decoder.decode(value, { stream: true });
        const lines = chunkText.split("\n");

        for (const line of lines) {
          if (line.startsWith('data:')) {
            const content = line.substring(5).trim();
            if (content !== '[DONE]') {
              completeContent += content;
              onChunk(content);
            }
          }
        }
      }

      return { content: completeContent };
    } else {
      const data = await response.json();
      return { content: data?.content || '' };
    }
  } catch (error) {
    console.error("❌ Error calling chat API:", error);
    throw error;
  }
};
