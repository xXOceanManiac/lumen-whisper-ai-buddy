
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
    
    // Advanced helper function to intelligently append chunks with proper spacing and prevent word splits
    const appendChunkWithSmartSpacing = (currentContent: string, newChunk: string): string => {
      // Trim the chunk to remove any whitespace artifacts
      const trimmedChunk = newChunk.trim();
      if (!trimmedChunk) return currentContent; // Skip empty chunks
      
      let result = currentContent;
      
      // If we have existing content
      if (result) {
        const lastChar = result.charAt(result.length - 1);
        const firstChar = trimmedChunk.charAt(0);
        
        // Fix comma spacing - ensure there's a space after comma
        if (lastChar === ',' && /\S/.test(firstChar) && firstChar !== '"' && firstChar !== "'") {
          return result + ' ' + trimmedChunk;
        }
        
        // Check for mid-word splits - if last char is letter and first char is letter/number with no space
        // and there are no indicators that this is a new sentence, this might be a mid-word split
        const isPossibleWordContinuation = 
          /[a-zA-Z]/.test(lastChar) && 
          /[a-zA-Z0-9]/.test(firstChar) && 
          !/[.!?]/.test(result.slice(-2)) && 
          !/\s$/.test(result);
        
        if (isPossibleWordContinuation) {
          // Don't add a space, likely a mid-word split
          return result + trimmedChunk;
        }
        
        // Check if this chunk might start a new paragraph (after sentence end)
        const isNewParagraph = 
          /[.!?]["']?\s*$/.test(result) && 
          /[A-Z]/.test(firstChar) &&
          trimmedChunk.length > 1;
        
        if (isNewParagraph && !result.endsWith("\n\n")) {
          // Add paragraph break
          return result + "\n\n" + trimmedChunk;
        }
        
        // Check if we need to add a space between words
        const needsSpace = 
          // Last char is a letter/number and next char is a letter/number
          (/[a-zA-Z0-9]/.test(lastChar) && /[a-zA-Z0-9]/.test(firstChar)) ||
          // Special handling for some scenarios (like "word. Another" needs a space)
          (lastChar === '.' && /[A-Z]/.test(firstChar));
        
        // Check if we need to remove a trailing space before punctuation
        const needsToRemoveSpace =
          result.endsWith(' ') && 
          ['.', ',', '!', '?', ':', ';', ')', ']', '}'].includes(firstChar);
        
        if (needsToRemoveSpace) {
          // Remove trailing space before adding punctuation
          result = result.slice(0, -1);
        } else if (needsSpace && !result.endsWith(' ') && !result.endsWith("\n")) {
          // Add a space between words when needed
          result += ' ';
        }
      }
      
      // Append the new chunk
      return result + trimmedChunk;
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
                // Apply improved smart spacing logic when adding new content
                completeContent = appendChunkWithSmartSpacing(completeContent, content);
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
          .replace(/,([^\s"])/g, ', $1');
        
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
