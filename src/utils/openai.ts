
import { Message } from '../types';

export const callOpenAIChat = async (
  messages: Message[],
  apiKey: string,
  onStreamChunk?: (chunk: string) => void
): Promise<{ success: boolean; data?: Message; error?: string }> => {
  if (!apiKey) {
    return { 
      success: false, 
      error: 'OpenAI API key is required. Please add it in the settings.' 
    };
  }

  try {
    // Convert our Message format to OpenAI's format
    const openAIMessages = messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));

    // For streaming implementation
    if (onStreamChunk) {
      const response = await fetch('https://api.openai.com/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${apiKey}`
        },
        body: JSON.stringify({
          model: 'gpt-4o-mini',
          messages: openAIMessages,
          stream: true
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error?.message || 'Failed to connect to OpenAI API');
      }

      const reader = response.body?.getReader();
      if (!reader) throw new Error('Unable to read response stream');

      let responseContent = '';
      const decoder = new TextDecoder('utf-8');

      // Process stream
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value);
        const lines = chunk.split('\n').filter(line => line.trim() !== '');

        for (const line of lines) {
          if (line.startsWith('data: ')) {
            const data = line.substring(6);
            if (data === '[DONE]') continue;

            try {
              const parsedData = JSON.parse(data);
              const content = parsedData.choices[0]?.delta?.content || '';
              if (content) {
                responseContent += content;
                onStreamChunk(content);
              }
            } catch (error) {
              console.error('Error parsing stream data:', error);
            }
          }
        }
      }

      const assistantMessage: Message = {
        id: Date.now().toString(),
        role: 'assistant',
        content: responseContent,
        timestamp: Date.now()
      };

      return { success: true, data: assistantMessage };
    } else {
      // Non-streaming implementation
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
    }
  } catch (error) {
    console.error('Error calling OpenAI API:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'An unknown error occurred'
    };
  }
};
