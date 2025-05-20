
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

    // Check if googleId exists
    if (!googleId) {
      console.error("❌ Missing googleId in callChatApi");
      throw new Error("googleId is required for chat API calls");
    }
    
    // Log the detailed request payload
    console.log("📩 Sending to /api/chat:", {
      googleId,
      messageCount: formattedMessages.length,
      firstMessage: formattedMessages[0]?.content.substring(0, 50) + "...",
      lastMessage: formattedMessages[formattedMessages.length - 1]?.content.substring(0, 50) + "..."
    });
    
    // Create the payload according to the required format
    const payload = {
      googleId,
      messages: formattedMessages,
      apiKey,
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

    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ API Error (${response.status}):`, errorText);
      throw new Error(`Failed to get chat response: ${response.status} ${errorText}`);
    }

    console.log("✅ API response received successfully");
    const data = await response.json();
    
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
            console.log("📅 Calendar event detected:", parsedEvent.title);
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
    console.error("❌ Error calling chat API:", error);
    throw error;
  }
};
