const API_BASE = '/api';

export interface Message {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp?: number;
  model?: string;
  systemPromptName?: string;
}

export interface Prompt {
  id: string;
  name: string;
  prompt: string;
  createdAt?: string;
}

export interface ChatRequest {
  provider: string;
  model: string;
  messages: Array<{ role: string; content: string }>;
  temperature?: number;
  maxTokens?: number;
}

export interface ModelsResponse {
  supported: boolean;
  models?: string[];
  docsUrl?: string;
  error?: string;
}

export interface PromptsResponse {
  prompts: Prompt[];
}

export interface ProviderInfo {
  name: string;
  docsUrl?: string;
}

export interface ProvidersResponse {
  providers: ProviderInfo[];
  defaults: {
    provider: string | null;
    temperature: number;
    maxTokens: number;
  };
}

// Chat API
export const chatApi = {
  async streamChat(
    request: ChatRequest,
    onChunk: (text: string) => void
  ): Promise<void> {
    const response = await fetch(`${API_BASE}/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(request),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Chat request failed');
    }

    const reader = response.body?.getReader();
    if (!reader) throw new Error('No response body');

    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      // Plain text stream - just decode and send
      const chunk = decoder.decode(value, { stream: true });
      if (chunk) {
        onChunk(chunk);
      }
    }
  },
};

// Providers API
export const providersApi = {
  async getProviders(): Promise<ProvidersResponse> {
    const response = await fetch(`${API_BASE}/providers`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch providers');
    }
    return response.json();
  },
};

// Models API
export const modelsApi = {
  async getModels(provider: string): Promise<ModelsResponse> {
    const response = await fetch(`${API_BASE}/models/${provider}`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch models');
    }
    return response.json();
  },
};

// Prompts API
export const promptsApi = {
  async getAll(): Promise<PromptsResponse> {
    const response = await fetch(`${API_BASE}/prompts`);
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch prompts');
    }
    return response.json();
  },

  async create(
    name: string,
    prompt: string
  ): Promise<{ prompt: Prompt }> {
    const response = await fetch(`${API_BASE}/prompts`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to create prompt');
    }
    return response.json();
  },

  async update(
    id: string,
    name: string,
    prompt: string
  ): Promise<{ prompt: Prompt }> {
    const response = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name, prompt }),
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to update prompt');
    }
    return response.json();
  },

  async delete(id: string): Promise<void> {
    const response = await fetch(`${API_BASE}/prompts/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to delete prompt');
    }
  },
};
