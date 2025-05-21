
import { Message } from '@/types';
import { validateOpenAIKeyFormat } from './localStorage';

export const callOpenAIChat = async (
  messages: Message[],
  apiKey: string,
): Promise<{ success: boolean; data?: Message; error?: string }> => {
  // Validate and trim API key
  const trimmedApiKey = apiKey ? apiKey.trim() : '';
  
  if (!trimmedApiKey) {
    console.error("❌ OpenAI API key is missing");
    return { 
      success: false, 
      error: 'OpenAI API key is required.' 
    };
  }

  try {
    console.log("🔄 Preparing OpenAI API call with", messages.length, "messages");
    
    // Log a safe version of the key (first 5 chars and last 4)
    if (trimmedApiKey) {
      console.log("🔑 Using OpenAI API key:", 
        trimmedApiKey.substring(0, 5) + "..." + trimmedApiKey.slice(-4), 
        "length:", trimmedApiKey.length);
    }
    
    // Validate API key format
    if (!validateOpenAIKeyFormat(trimmedApiKey)) {
      console.error("❌ Invalid API key format:", trimmedApiKey.slice(0, 5) + "...");
      return {
        success: false,
        error: 'Invalid API key format. OpenAI keys should start with "sk-" and be at least 30 characters long.'
      };
    }
    
    // Convert our Message format to OpenAI's format
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare request configuration for logging
    const requestConfig = {
      url: 'https://api.openai.com/v1/chat/completions',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedApiKey.substring(0, 5)}...${trimmedApiKey.slice(-4)}` // Masked for logging
      },
      body: {
        model: 'gpt-4o-mini',
        messages: openAIMessages.map(msg => ({
          role: msg.role,
          content: msg.content.length > 50 ? msg.content.substring(0, 50) + "..." : msg.content
        }))
      }
    };
    
    // Log request configuration (without full API key)
    console.log("📤 OpenAI API request configuration:", JSON.stringify(requestConfig, null, 2));

    // Call OpenAI's API with the user's API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${trimmedApiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages
      }),
      credentials: 'include' // Include credentials for all API calls
    });

    // Log response status
    console.log(`🔄 OpenAI API response status: ${response.status}`);

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || 'Failed to connect to OpenAI API';
      console.error(`❌ OpenAI API Error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log("✅ OpenAI API response received successfully");
    const data = await response.json();
    console.log("OpenAI raw response:", data);
    
    // Safely extract content with proper error handling
    const content = data?.choices?.[0]?.message?.content;
    
    if (!content) {
      console.error("❌ No content found in OpenAI response", data);
      throw new Error("Invalid response format from OpenAI API");
    }

    console.log("📥 Received OpenAI response:", {
      responseLength: content.length,
      previewContent: content.substring(0, 50) + "...",
    });

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      timestamp: Date.now()
    };

    return { success: true, data: assistantMessage };
  } catch (error) {
    console.error('❌ Error calling OpenAI API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
