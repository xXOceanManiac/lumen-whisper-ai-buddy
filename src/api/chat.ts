import { Message } from "@/types";
import { validateOpenAIKeyFormat } from "@/utils/localStorage";
import { parseCalendarCommand, parseReminderText } from "./calendar";

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
    
    // Check if the last message might be a calendar command or reminder
    const lastMessage = messages[messages.length - 1];
    if (lastMessage.role === 'user') {
      const calendarCommand = parseCalendarCommand(lastMessage.content);
      
      // Check for reminder-specific requests
      if (calendarCommand.isCalendarCommand && calendarCommand.type === 'reminder') {
        console.log("🔔 Detected reminder request:", lastMessage.content);
        
        // Parse the reminder text
        const reminderData = parseReminderText(lastMessage.content);
        
        // If successfully parsed, create the reminder
        if (reminderData.success && reminderData.task && reminderData.dateTime) {
          try {
            // Format dates for display
            const formattedDate = reminderData.dateTime.toLocaleString([], {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
              hour: '2-digit',
              minute: '2-digit'
            });
            
            // Create a custom response instead of calling the OpenAI API
            return {
              content: `📅 Got it! I'll remind you to ${reminderData.task} on ${formattedDate}.`,
              calendarEvent: {
                summary: reminderData.task,
                description: "Auto-added by Lumen reminder",
                start: {
                  dateTime: reminderData.dateTime.toISOString(),
                },
                end: {
                  dateTime: reminderData.dateTime.toISOString(),
                },
                id: Date.now().toString(),
                title: reminderData.task
              }
            };
          } catch (err) {
            console.error("❌ Error creating reminder:", err);
          }
        } else if (reminderData.task) {
          // We understood the task but not the time
          return {
            content: `Just to confirm, when exactly would you like me to remind you to ${reminderData.task}?`
          };
        } else {
          // We couldn't parse the reminder at all
          return {
            content: "Just to confirm, when exactly would you like me to remind you and what is the reminder for?"
          };
        }
      } else if (calendarCommand.isCalendarCommand) {
        console.log(`📅 Detected calendar ${calendarCommand.type} command`);
        // Add this information to the request so the backend knows it's calendar-related
        formattedMessages.push({
          role: 'system',
          content: `This appears to be a calendar ${calendarCommand.type} request. Process it accordingly.`
        });
      }
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
      },
      stream: true // Add streaming option
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

    console.log("✅ API response stream received");
    
    // Enhanced helper function for proper text formatting with paragraph breaks
    const formatStreamedText = (currentContent: string, newChunk: string): string => {
      if (!newChunk.trim()) return currentContent;
      
      const lastChar = currentContent.slice(-1);
      const firstChar = newChunk.charAt(0);
      
      // Check if we should add a paragraph break
      // When previous content ends with sentence-ending punctuation and new chunk starts with capital letter
      if (/[.!?]$/.test(currentContent) && /^[A-Z]/.test(newChunk) && !currentContent.endsWith('\n\n')) {
        return currentContent + '\n\n' + newChunk;
      }
      
      // Check if we need a space between words
      // When last char is letter/number AND first char is letter/number AND current content doesn't end with space/punctuation
      const needsSpace = 
        /[a-zA-Z0-9]/.test(lastChar) && 
        /[a-zA-Z0-9]/.test(firstChar) && 
        !/[\s\.,!?;:]$/.test(currentContent);
      
      return currentContent + (needsSpace ? ' ' : '') + newChunk;
    };
    
    // Handle streaming response
    if (onChunk) {
      // Process the streaming response
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let completeContent = '';
      
      if (reader) {
        // Start reading the stream
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          // Decode the chunk
          const chunkText = decoder.decode(value, { stream: true });
          
          // Process each line in the chunk
          const lines = chunkText.split("\n");
          for (const line of lines) {
            if (line.startsWith('data:')) {
              // Extract the actual content after 'data:'
              const content = line.substring(5).trim();
              if (content === '[DONE]') {
                console.log("Stream completed with [DONE] marker");
              } else {
                // Apply enhanced formatting logic when adding new content
                completeContent = formatStreamedText(completeContent, content);
                onChunk(content); // Pass the chunk to the callback
              }
            }
            // We can ignore 'event: done' lines as we already check for '[DONE]'
          }
        }
        
        // Final cleanup of any remaining formatting issues
        completeContent = completeContent
          // Fix any double spaces
          .replace(/\s{2,}/g, ' ')
          // Fix comma spacing consistently
          .replace(/,([^\s"])/g, ', $1')
          // Add proper paragraph breaks after sentences
          .replace(/([.!?])([A-Z])/g, '$1\n\n$2');
        
        // Parse the complete content for calendar events
        let calendarEvent;
        try {
          if (completeContent.includes('"type":"calendar"') || completeContent.includes('"type": "calendar"')) {
            // Extract JSON object from the response
            const match = completeContent.match(/\{[\s\S]*?\}/);
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
        
        return { content: completeContent, calendarEvent };
      } else {
        console.error("❌ Response body is not readable");
        throw new Error("Response body is not readable");
      }
    } else {
      // Non-streaming fallback
      console.log("⚠️ No streaming handler provided, falling back to regular response");
      const data = await response.json();
      console.log("Chat API response:", data);
      
      // Extract the assistant message directly from data.content
      const assistantMessage = data?.content;
      
      if (!assistantMessage) {
        console.error("❌ No assistant message found in API response", data);
        throw new Error("Invalid response format from chat API");
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
    }
  } catch (error) {
    console.error("❌ Error calling chat API:", error);
    throw error;
  }
};
