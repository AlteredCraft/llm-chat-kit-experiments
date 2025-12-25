# LLM Chat Kit Experiments

An experimental project exploring **preemptive AI actions**. An AI autonomously modifies an application in real-time based on contextual signals, without explicit user commands.

## The Concept

![alt text](<docs/theme switch.gif>)

Traditional AI interactions are reactive: the user asks, the AI responds. But what if an AI could observe context and *proactively* suggest or make changes?

This project demonstrates that idea through a **dynamic theme system**:

- The app monitors environmental signals (time of day, and potentially weather, location, etc.)
- When conditions change, an LLM generates a new visual theme tailored to those conditions
- The assistant presents the theme with a contextual, conversational proposal
- The user can preview the changes live and decide to keep or dismiss them

It's a small example of a larger pattern: AI that anticipates needs and takes initiative while keeping humans in control. 

### What Makes This Interesting

1. **Context-aware generation** — The AI doesn't just respond to "make it dark mode." It notices it's evening and proposes a theme that fits the mood.

2. **Safe experimentation** — Changes are previewed live but not committed until the user approves. The AI is proactive but not presumptuous.

3. **Creative output** — The LLM generates complete CSS themes with typography choices, color harmonies, and Google Fonts. Not just parameter tweaks.

***Note***: I do acknowledge the "smoke and mirrors" nature of this demo. The AI is triggered via a 'cron' mechanism so it is not truly proactive, but this is more about the UX pattern and representing a perception of self initiative on the part of the AI.

---

## Running the App

### Prerequisites

- [Bun](https://bun.sh/) runtime
- At least one LLM provider API key (OpenAI, Anthropic, Google) or local Ollama

### Quick Start

```bash
# Install dependencies
bun install

# Copy environment template and add your API keys
cp .env.example .env

# Start development servers
./restart-dev.sh           # Start both frontend and backend
./restart-dev.sh --stop    # Stop all servers
./status-dev.sh            # Check server status

# Or manually (requires 2 terminals):
bun run dev:server         # Terminal 1: Backend
bun run dev                # Terminal 2: Frontend (Vite)
```

Open http://localhost:5173 in your browser.

### Testing

```bash
bun run test           # All tests with coverage
bun run test:unit      # Unit tests only
bun run test:integ     # Integration tests only
bun run test:watch     # Watch mode
```

---

## Configuration

### API Keys

Add your keys to `.env`:

```
OPENAI_API_KEY=sk-...
ANTHROPIC_API_KEY=sk-ant-...
GOOGLE_GENERATIVE_AI_API_KEY=...
```

Ollama runs locally and doesn't require a key.

### Providers

Edit `config/providers.config.js` to enable/disable providers and set defaults.

#### Adding a New Provider

To add a provider supported by the [Vercel AI SDK](https://sdk.vercel.ai/):

1. Install the package: `bun add @ai-sdk/[provider-name]`
2. Update imports in `src/server/lib/providers.ts`
3. Add to the `ProviderName` type
4. Add case in `getModel()` function
5. Configure in `config/providers.config.js`
6. Add API key to `.env`

### System Prompts

- Default prompts: `config/prompts.default.json` (tracked)
- User prompts: `data/prompts.user.json` (gitignored, created at runtime)

---

## Architecture

```
Browser (React + Vite)
    │
    │ HTTP/SSE
    ▼
Bun Server (Hono)
    │
    │ Vercel AI SDK
    ▼
LLM Providers (OpenAI, Anthropic, Google, Ollama)
```

The app uses a thin proxy pattern — the client stores conversation state locally, and the server acts as a pass-through to LLM providers with streaming via SSE.

---

## License

MIT
