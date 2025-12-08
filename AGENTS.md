# Agent Instructions

## Commands
- **Build**: `bun run build` (Client & Server)
- **Dev**: `bun run dev` (Client only), `bun run dev:server` (Server only). **Both must run simultaneously** for full app functionality.
- **Test All**: `bun test` (Target: Functions >80%, Lines >70%)
- **Test Single**: `bun test tests/unit/startup.test.ts`
- **Test Unit**: `bun test:unit` (Isolated logic, mocked deps)
- **Test Integ**: `bun test:integ` (Hono API flow, no browser)
- **Lint**: `bun x tsc --noEmit` (Standard TS check)

## Code Style & Conventions
- **Stack**: TypeScript, React (Client), Hono (Server), Vercel AI SDK.
- **Architecture**: Thin proxy pattern. Client-side state (localStorage). No server sessions.
- **Dependency Injection**: Use DI for testability (e.g., `deps: StartupDeps` in `lib/startup.ts`).
- **Testing**:
  - **Unit**: Isolate business logic. Mock FS/Env via DI. Fast & deterministic.
  - **Integ**: Test request/response flow using Hono's `app.request()`. Verify HTTP status/JSON.
  - **Rules**: Avoid over-mocking. Test behavior, not implementation. 
- **Naming**: PascalCase for Components (`ChatApp`), camelCase for functions/vars.
- **Config**: Providers in `config/providers.config.js`, Prompts in `config/prompts.default.json`.
- **Formatting**: Standard TypeScript/React conventions.

## Testing

**IMPORTANT TEST REQUIREMENTS**: 
- Run all tests after completing changes to ensure nothing is broken.
  Report using ✅ or ❌ so it stands out.
- Code coveraage MUST be higher that 80%, it it is not pause and ask the user if we should add more tests or if they want to proceed anyway.
- ensure we don't over mock, we want valuable test that are testing our code not just mocks. Use DI where it makes sense.

Two-tier approach (see `TESTS_STRAT.md` for details):

- **Unit tests** (`tests/unit/`) - Isolated functions with dependency injection
- **Integration tests** (`tests/integ/`) - API endpoints via Hono's in-process test client (no browser)

Startup checks in `lib/startup.ts` accept optional `deps` parameter for testability:
```typescript
runStartupChecks({ env: {}, fileExists: () => false })
```
