# Agent Instructions
## Commands
- **Build**: `bun run build`
- **Dev**: `bun run dev` (client) & `bun run dev:server` (server)
- **Lint**: `bun x tsc --noEmit`
- **Test**: `bun test` (Target: 80% functions, 70% lines). Single: `bun test <file_path>`
## Code Style
- **Stack**: TypeScript, React, Hono, Vercel AI SDK. Thin proxy pattern.
- **Architecture**: Client-side state (localStorage). No server sessions.
- **Naming**: PascalCase for Components, camelCase for functions/vars.
- **Imports**: Relative paths. Standard TS/React conventions.
- **Typing**: Explicit types for API. Use Zod for validation.
- **Logic**: Use Dependency Injection for testability (e.g. `deps` objects).
- **Errors**: Catch/log in routes; return descriptive JSON + status codes.
- **Testing**: Unit (isolated logic via DI) vs Integration (API flow via Hono).
- **Conventions**: Avoid over-mocking. Test behavior over implementation.
- **Workflow**: Run all tests before finish. Report status with ✅/❌.
