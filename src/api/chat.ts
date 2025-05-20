
import { Message } from "@/types";

const API_BASE_URL = "https://lumen-backend-main.fly.dev";

export const callChatApi = async (
  messages: Message[],
  apiKey: string,
  googleId?: string,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; calendarEvent?: any }> => {
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Log the googleId value before creating the payload
    console.log("Chat API using googleId:", googleId);
    
    if (!googleId) {
      console.error("Missing googleId in callChatApi");
      throw new Error("Missing googleId for chat API call");
    }
    
    // Create the payload according to the required format
    const payload = {
      googleId: googleId,
      messages: formattedMessages,
      apiKey,
    };
    
    console.log("Sending payload to /api/chat:", {
      endpoint: `${API_BASE_URL}/api/chat`,
      googleId: payload.googleId,
      messagesCount: payload.messages.length,
      hasApiKey: !!payload.apiKey
    });

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(payload),
      credentials: 'include', // Required for session cookies
    });

    if (!response.ok) {
      console.error("API Error:", response.status, response.statusText);
      throw new Error(`Failed to get chat response: ${response.status}`);
    }

    const data = await response.json();
    console.log("Chat API response received:", {
      status: response.status,
      hasChoices: !!data.choices,
      firstChoice: data.choices && data.choices.length > 0 ? "exists" : "missing"
    });
    
    // Parse the response for calendar events
    let calendarEvent;
    try {
      const content = data.choices[0].message.content;
      if (content.includes('"type":"calendar"') || content.includes('"type": "calendar"')) {
        // Extract JSON object from the response
        const match = content.match(/\{[\s\S]*?\}/);
        if (match) {
          const jsonStr = match[0];
          const parsedEvent = JSON.parse(jsonStr);
          if (parsedEvent.type === 'calendar') {
            calendarEvent = parsedEvent;
          }
        }
      }
    } catch (error) {
      console.error("Error parsing calendar event:", error);
    }

    return { 
      content: data.choices[0].message.content,
      calendarEvent 
    };
  } catch (error) {
    console.error("Error calling chat API:", error);
    throw error;
  }
};
