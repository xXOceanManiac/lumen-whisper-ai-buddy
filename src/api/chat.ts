
import { Message } from "@/types";

const API_BASE_URL = "https://lumen-backend-30ab.onrender.com";

export const callChatApi = async (
  messages: Message[],
  apiKey: string,
  onChunk?: (chunk: string) => void
): Promise<{ content: string; calendarEvent?: any }> => {
  try {
    // Format messages for the API
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    const response = await fetch(`${API_BASE_URL}/api/chat`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: formattedMessages,
        apiKey,
      }),
    });

    if (!response.ok) {
      throw new Error("Failed to get chat response");
    }

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
