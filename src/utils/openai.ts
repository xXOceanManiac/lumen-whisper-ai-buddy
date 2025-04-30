
import { Message } from '@/types';

export const callOpenAIChat = async (
  messages: Message[],
  apiKey: string,
): Promise<{ success: boolean; data?: Message; error?: string }> => {
  if (!apiKey) {
    return { 
      success: false, 
      error: 'OpenAI API key is required.' 
    };
  }

  try {
    // Convert our Message format to the format expected by the backend
    const formattedMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // Call our backend API instead of OpenAI directly
    const response = await fetch('https://lumen-backend-main.fly.dev/api/chat', {
      method: 'POST',
      credentials: 'include',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ 
        messages: formattedMessages,
        apiKey 
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to connect to chat API');
    }

    const data = await response.json();
    
    // Create a new message from the API response
    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: data.choices[0]?.message?.content || '',
      timestamp: Date.now()
    };

    return { success: true, data: assistantMessage };
  } catch (error) {
    console.error('Error calling chat API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
