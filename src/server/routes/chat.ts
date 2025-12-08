import { Hono } from 'hono';
import { streamText } from 'ai';
import { getModel, isProviderEnabled, type ProviderName } from '../lib/providers';

export const chatRoute = new Hono();

interface ChatRequest {
  provider: ProviderName;
  model: string;
  messages: Array<{
    role: 'system' | 'user' | 'assistant';
    content: string;
  }>;
  temperature?: number;
  maxTokens?: number;
}

chatRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<ChatRequest>();
    const { provider, model, messages, temperature = 0.7, maxTokens = 2048 } = body;

    // Debug: Log the incoming request and filter empty messages
    console.log('Chat request:', { provider, model, messageCount: messages.length });
    
    // Filter out messages with empty content (except system messages)
    const filteredMessages = messages.filter(msg => 
      msg.role === 'system' || (msg.content && msg.content.trim().length > 0)
    );
    
    if (filteredMessages.length !== messages.length) {
      console.log('Filtered out empty messages:', messages.length - filteredMessages.length);
    }
    
    console.log('Messages:', JSON.stringify(filteredMessages, null, 2));

    // Validate provider
    if (!isProviderEnabled(provider)) {
      return c.json({ error: `Provider "${provider}" is not enabled` }, 400);
    }

    // Get the model instance
    const modelInstance = getModel(provider, model);

    // Stream the response
    const result = streamText({
      model: modelInstance,
      messages: filteredMessages,
      temperature,
      maxOutputTokens: maxTokens,
    });

    // Return as text stream response
    return result.toTextStreamResponse();
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    console.error('Chat error:', message);
    return c.json({ error: message }, 500);
  }
});
