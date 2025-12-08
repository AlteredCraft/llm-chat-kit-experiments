import { describe, it, expect } from 'bun:test';
import { runStartupChecks, checkProviders, type StartupCheck } from '../../src/server/lib/startup';

describe('Startup Checks', () => {
  describe('runStartupChecks', () => {
    it('should error when .env file is missing', () => {
      const result = runStartupChecks({
        fileExists: () => false,
        env: {},
      });

      expect(result.canStart).toBe(false);
      const envCheck = result.checks.find((c) => c.name === '.env file');
      expect(envCheck?.status).toBe('error');
      expect(envCheck?.message).toContain('Missing .env file');
    });

    it('should pass when .env file exists', () => {
      const result = runStartupChecks({
        fileExists: (path) => path.endsWith('.env') || path.endsWith('index.html'),
        env: {},
      });

      const envCheck = result.checks.find((c) => c.name === '.env file');
      expect(envCheck?.status).toBe('ok');
    });

    it('should warn when client build is missing', () => {
      const result = runStartupChecks({
        fileExists: (path) => path.endsWith('.env'), // .env exists, client doesn't
        env: {},
      });

      const clientCheck = result.checks.find((c) => c.name === 'Client build');
      expect(clientCheck?.status).toBe('warn');
      expect(clientCheck?.message).toContain('Client not built');
    });

    it('should pass when client build exists', () => {
      const result = runStartupChecks({
        fileExists: () => true, // everything exists
        env: {},
      });

      const clientCheck = result.checks.find((c) => c.name === 'Client build');
      expect(clientCheck?.status).toBe('ok');
    });

    it('should list enabled providers', () => {
      const result = runStartupChecks({
        fileExists: () => true,
        env: {},
      });

      const providersCheck = result.checks.find((c) => c.name === 'Providers');
      expect(providersCheck?.status).toBe('ok');
      expect(providersCheck?.message).toContain('Enabled:');
    });
  });

  describe('checkProviders', () => {
    it('should not show provider when API key is missing', () => {
      const checks = checkProviders({});
      const openaiCheck = checks.find((c) => c.name === 'Openai');

      // OpenAI should not appear when key is missing
      expect(openaiCheck).toBeUndefined();
    });

    it('should show provider as configured when API key is present', () => {
      const checks = checkProviders({
        OPENAI_API_KEY: 'sk-test-key',
      });

      const openaiCheck = checks.find((c) => c.name === 'Openai');
      expect(openaiCheck).toBeDefined();
      expect(openaiCheck?.status).toBe('ok');
      expect(openaiCheck?.message).toContain('API key configured');
    });

    it('should show Ollama as available (no API key needed)', () => {
      const checks = checkProviders({});
      const ollamaCheck = checks.find((c) => c.name === 'Ollama');

      expect(ollamaCheck).toBeDefined();
      expect(ollamaCheck?.status).toBe('ok');
      expect(ollamaCheck?.message).toContain('Available at');
    });

    it('should show all providers when all keys are present', () => {
      const checks = checkProviders({
        OPENAI_API_KEY: 'sk-test',
        ANTHROPIC_API_KEY: 'sk-ant-test',
        GOOGLE_GENERATIVE_AI_API_KEY: 'AIza-test',
      });

      // Should have all 4 providers (3 with keys + Ollama)
      expect(checks.length).toBe(4);
      const warnings = checks.filter((c) => c.status === 'warn');
      expect(warnings.length).toBe(0);
    });
  });
});
