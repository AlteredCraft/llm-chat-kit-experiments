export default {
  providers: {
    openai: {
      keyName: 'OPENAI_API_KEY',
      docsUrl: 'https://platform.openai.com/docs/models',
      models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo']
    },
    anthropic: {
      keyName: 'ANTHROPIC_API_KEY',
      docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      models: ['claude-sonnet-4-5', 'claude-haiku-4-5', 'claude-opus-4-5']
    },
google: {
      keyName: 'GOOGLE_GENERATIVE_AI_API_KEY',
      docsUrl: 'https://docs.anthropic.com/en/docs/about-claude/models',
      models: ['gemini-3-pro-preview', 'gemini-2.5-flash', 'gemini-2.5-flash-preview-09-2025', 'gemini-2.5-flash-lite-preview-09-2025']
    },
    ollama: {
      // No API key required - local server
      keyName: null,
      baseUrl: 'http://localhost:11434',
      docsUrl: 'https://ollama.com/library'
      // models fetched dynamically from Ollama API
    }
  },
  defaults: {
    temperature: 0.7,
    maxTokens: 2048
  }
};

