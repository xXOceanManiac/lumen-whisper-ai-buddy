
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
    // Convert our Message format to OpenAI's format
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

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
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      throw new Error(errorData.error?.message || 'Failed to connect to OpenAI API');
    }

    const data = await response.json();
    const content = data.choices[0]?.message?.content || '';

    const assistantMessage: Message = {
      id: Date.now().toString(),
      role: 'assistant',
      content: content,
      timestamp: Date.now()
    };

    return { success: true, data: assistantMessage };
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
