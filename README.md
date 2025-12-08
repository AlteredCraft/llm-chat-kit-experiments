# LLM Chat Kit

A lightweight, reusable LLM chat interface for research projects.

## Quick Start

```bash
# Install dependencies
bun install

# Copy environment template and add your API keys
cp .env.example .env

# Run tests
bun run test           # Run all tests with coverage
bun run test:unit      # Unit tests only
bun run test:integ     # Integration tests only
bun run test:watch     # Watch mode for development

# Start development servers (requires 2 terminals)
# Terminal 1: Start backend server
bun run dev:server

# Terminal 2: Start frontend dev server
bun run dev

# OR use helper scripts (single terminal)
./restart-dev.sh    # Restart both servers (idempotent)
./status-dev.sh      # Check server status
```

Open http://localhost:5173 in your browser (Vite dev server).

## Configuration

### Providers

Edit `config/providers.config.js` to enable/disable providers and set defaults.

#### Adding a New Provider

To add a new AI provider supported by the [Vercel AI SDK](https://sdk.vercel.ai/):

1. **Install the provider package**:
   ```bash
   bun add @ai-sdk/[provider-name]
   ```

2. **Update server provider imports** in `src/server/lib/providers.ts`:
   ```typescript
   import { [providerName] } from '@ai-sdk/[provider-name]';
   ```

3. **Add provider to type definition** in `src/server/lib/providers.ts`:
   ```typescript
   export type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama' | '[new-provider]';
   ```

4. **Add provider case in getModel function** in `src/server/lib/providers.ts`:
   ```typescript
   case '[new-provider]':
     return [providerName](modelId);
   ```

5. **Configure provider in config** in `config/providers.config.js`:
   ```javascript
   [new-provider]: {
     keyName: '[NEW_PROVIDER]_API_KEY',
     docsUrl: 'https://docs.provider.com/models',
     models: ['model-1', 'model-2', 'model-3']
   }
   ```

6. **Add API key to .env**:
   ```
   # New Provider
   NEW_PROVIDER_API_KEY=
   ```

7. **Update tests** in `tests/unit/startup.test.ts` to include the new provider in test cases.

The provider will automatically appear in the UI once configured with a valid API key.

### System Prompts

- Default prompts: `config/prompts.default.json` (tracked in git)
- User prompts: `data/prompts.user.json` (gitignored, created at runtime)

### API Keys

Add your API keys to `.env`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GEMINI_API_KEY=...
```

Ollama runs locally and doesn't need an API key.

## License

MIT
