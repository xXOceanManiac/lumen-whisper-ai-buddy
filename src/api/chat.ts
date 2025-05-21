
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
    // Trim and validate API key
    const trimmedApiKey = apiKey ? apiKey.trim() : '';
    
    if (!trimmedApiKey) {
      console.error("❌ Missing or empty API key in callChatApi");
      throw new Error("A valid OpenAI API key is required");
    }
    
    if (!validateOpenAIKeyFormat(trimmedApiKey)) {
      console.error("❌ Invalid API key format:", trimmedApiKey.substring(0, 7) + "...", "length:", trimmedApiKey.length);
      throw new Error("Invalid API key format. OpenAI keys should start with 'sk-' and be at least 48 characters long.");
    }
    
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Check if googleId exists
    if (!googleId) {
      console.error("❌ Missing googleId in callChatApi");
      throw new Error("googleId is required for chat API calls");
    }
    
    // Log the detailed request payload
    console.log("📩 Sending to /api/chat:", {
      googleId,
      apiKeyPrefix: trimmedApiKey.substring(0, 7) + "...",
      apiKeySuffix: "..." + trimmedApiKey.slice(-4),
      apiKeyLength: trimmedApiKey.length,
      messageCount: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content.substring(0, 50) + "...",
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content.substring(0, 50) + "..."
    });
    
    // Create the payload according to the required format
    const payload = {
      googleId,
      messages: formattedMessages,
      apiKey: trimmedApiKey,
      apiKeyMetadata: {
        prefix: trimmedApiKey.substring(0, 7),
        suffix: trimmedApiKey.slice(-4),
        length: trimmedApiKey.length
      }
    };

    console.log(`🔄 API request to ${API_BASE_URL}/api/chat initiated`);

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: 'include', // Required for session cookies
    });

    console.log(`📡 Chat API response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`Failed to get chat response: ${response.status} ${errorText}`);
    }

    console.log("✅ API response received successfully");
    const data = await response.json();
    console.log("OpenAI raw response:", data);
    
    // Safely extract the assistant message with proper error handling
    const assistantMessage = data?.choices?.[0]?.message?.content;
    
    if (!assistantMessage) {
      console.error("❌ No assistant message found in OpenAI response", data);
      throw new Error("Invalid response format from OpenAI API");
    }
    
    // Parse the response for calendar events
    let calendarEvent;
    try {
      if (assistantMessage.includes('"type":"calendar"') || assistantMessage.includes('"type": "calendar"')) {
        // Extract JSON object from the response
        const match = assistantMessage.match(/\{[\s\S]*?\}/);
        if (match) {
          const jsonStr = match[0];
          const parsedEvent = JSON.parse(jsonStr);
          if (parsedEvent.type === 'calendar') {
            calendarEvent = parsedEvent;
            console.log("📅 Calendar event detected:", parsedEvent.title);
          }
        }
      }
    } catch (error) {
      console.error("Error parsing calendar event:", error);
      // Continue without calendar event if parsing fails
    }

    return { 
      content: assistantMessage,
      calendarEvent 
    };
  } catch (error) {
    console.error("❌ Error calling chat API:", error);
    throw error;
  }
};
