
import { Message } from '@/types';

export const callOpenAIChat = async (
  messages: Message[],
  apiKey: string,
): Promise<{ success: boolean; data?: Message; error?: string }> => {
  if (!apiKey) {
    console.error("❌ OpenAI API key is missing");
    return { 
      success: false, 
      error: 'OpenAI API key is required.' 
    };
  }

  try {
    console.log("🔄 Preparing OpenAI API call with", messages.length, "messages");
    console.log("🔑 Using OpenAI API key:", apiKey.slice(0, 5) + "...");
    
    // Convert our Message format to OpenAI's format
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Prepare for OpenAI API call
    console.log("📤 Calling OpenAI API with:", {
      model: 'gpt-4o-mini',
      messageCount: openAIMessages.length,
      apiKeyPresent: !!apiKey,
      apiKeyLength: apiKey ? apiKey.length : 0, // Log length only, not the key itself
      apiKeyPrefix: apiKey ? apiKey.slice(0, 5) + "..." : null
    });

    // Call OpenAI's API with the user's API key
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        model: 'gpt-4o-mini',
        messages: openAIMessages
      }),
      credentials: 'include' // Include credentials for all API calls
    });

    if (!response.ok) {
      const errorData = await response.json();
      const errorMessage = errorData.error?.message || 'Failed to connect to OpenAI API';
      console.error(`❌ OpenAI API Error (${response.status}):`, errorMessage);
      throw new Error(errorMessage);
    }

    console.log("✅ OpenAI API response received successfully");
    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

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
