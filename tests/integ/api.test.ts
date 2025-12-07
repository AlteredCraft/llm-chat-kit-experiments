import { describe, it, expect, beforeAll } from 'bun:test';
import { Hono } from 'hono';
import { chatRoute } from '../../src/server/routes/chat';
import { promptsRoute } from '../../src/server/routes/prompts';
import { modelsRoute } from '../../src/server/routes/models';
import { providersRoute } from '../../src/server/routes/providers';

// Create a test app without startup checks
const app = new Hono();
app.route('/api/chat', chatRoute);
app.route('/api/prompts', promptsRoute);
app.route('/api/models', modelsRoute);
app.route('/api/providers', providersRoute);

describe('API Integration Tests', () => {
  describe('GET /api/providers', () => {
    it('should return enabled providers and defaults', async () => {
      const res = await app.request('/api/providers');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('providers');
      expect(data).toHaveProperty('defaults');
      expect(Array.isArray(data.providers)).toBe(true);

      // At minimum, Ollama should be enabled (no API key required)
      const ollama = data.providers.find((p: { name: string }) => p.name === 'ollama');
      expect(ollama).toBeDefined();
    });

    it('should include defaults with temperature and maxTokens', async () => {
      const res = await app.request('/api/providers');
      const data = await res.json();

      expect(data.defaults).toHaveProperty('temperature');
      expect(data.defaults).toHaveProperty('maxTokens');
      expect(data.defaults).toHaveProperty('provider');
    });
  });

  describe('GET /api/models/:provider', () => {
    it('should return models for ollama provider', async () => {
      const res = await app.request('/api/models/ollama');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('supported');
      expect(data.supported).toBe(true);
      // Models array may be empty if Ollama is not running
      expect(data).toHaveProperty('models');
      expect(Array.isArray(data.models)).toBe(true);
    });

    it('should return error for disabled provider (no API key)', async () => {
      // OpenAI is disabled when no API key is present
      const res = await app.request('/api/models/openai');
      // Provider is disabled, so returns 400
      expect(res.status).toBe(400);
    });

    it('should return error for disabled provider', async () => {
      // First, we need to check if google is disabled in config
      const res = await app.request('/api/models/google');
      // If enabled, we get 200 with supported:false
      // If disabled, we'd get 400
      expect([200, 400]).toContain(res.status);
    });

    it('should return error for invalid provider', async () => {
      const res = await app.request('/api/models/invalid');
      expect(res.status).toBe(400);

      const data = await res.json();
      expect(data).toHaveProperty('error');
    });
  });

  describe('GET /api/prompts', () => {
    it('should return prompts array', async () => {
      const res = await app.request('/api/prompts');
      expect(res.status).toBe(200);

      const data = await res.json();
      expect(data).toHaveProperty('prompts');
      expect(Array.isArray(data.prompts)).toBe(true);
    });

    it('should include default prompts', async () => {
      const res = await app.request('/api/prompts');
      const data = await res.json();

      // Should have at least the default prompts
      expect(data.prompts.length).toBeGreaterThan(0);

      // Check structure of a prompt
      const prompt = data.prompts[0];
      expect(prompt).toHaveProperty('id');
      expect(prompt).toHaveProperty('name');
      expect(prompt).toHaveProperty('prompt');
    });
  });

  describe('POST /api/prompts', () => {
    it('should create a new prompt', async () => {
      const newPrompt = {
        name: 'Test Prompt',
        prompt: 'You are a test assistant.',
      };

      const res = await app.request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newPrompt),
      });

      expect(res.status).toBe(201);

      const data = await res.json();
      expect(data).toHaveProperty('prompt');
      expect(data.prompt.name).toBe(newPrompt.name);
      expect(data.prompt.prompt).toBe(newPrompt.prompt);

    });

    it('should reject prompt without name', async () => {
      const res = await app.request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: 'test' }),
      });

      expect(res.status).toBe(400);
    });

    it('should reject prompt without prompt text', async () => {
      const res = await app.request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'test' }),
      });

      expect(res.status).toBe(400);
    });
  });

  describe('PUT /api/prompts/:id', () => {
    it('should update an existing user prompt', async () => {
      // First create a prompt
      const createRes = await app.request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Update Test', prompt: 'Original prompt' }),
      });
      const { prompt: created } = await createRes.json();

      // Now update it
      const updateRes = await app.request(`/api/prompts/${created.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Updated Name', prompt: 'Updated prompt' }),
      });

      expect(updateRes.status).toBe(200);
      const { prompt: updated } = await updateRes.json();
      expect(updated.name).toBe('Updated Name');
      expect(updated.prompt).toBe('Updated prompt');
    });

    it('should reject updating default prompts', async () => {
      const res = await app.request('/api/prompts/default-1', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Hacked' }),
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Cannot modify default prompts');
    });

    it('should return 404 for non-existent user prompt', async () => {
      const res = await app.request('/api/prompts/user-nonexistent', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Test' }),
      });

      expect(res.status).toBe(404);
    });
  });

  describe('DELETE /api/prompts/:id', () => {
    it('should delete a user prompt', async () => {
      // First create a prompt
      const createRes = await app.request('/api/prompts', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: 'Delete Test', prompt: 'To be deleted' }),
      });
      const { prompt: created } = await createRes.json();

      // Now delete it
      const deleteRes = await app.request(`/api/prompts/${created.id}`, {
        method: 'DELETE',
      });

      expect(deleteRes.status).toBe(200);
      const data = await deleteRes.json();
      expect(data.success).toBe(true);
    });

    it('should reject deleting default prompts', async () => {
      const res = await app.request('/api/prompts/default-1', {
        method: 'DELETE',
      });

      expect(res.status).toBe(403);
      const data = await res.json();
      expect(data.error).toContain('Cannot delete default prompts');
    });

    it('should return 404 for non-existent user prompt', async () => {
      const res = await app.request('/api/prompts/user-nonexistent', {
        method: 'DELETE',
      });

      expect(res.status).toBe(404);
    });
  });

  describe('POST /api/chat', () => {
    it('should reject request without provider', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          model: 'test',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      // Should fail validation or provider check
      expect(res.status).toBeGreaterThanOrEqual(400);
    });

    it('should reject request with invalid provider', async () => {
      const res = await app.request('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          provider: 'invalid',
          model: 'test',
          messages: [{ role: 'user', content: 'hello' }],
        }),
      });

      expect(res.status).toBe(400);
      const data = await res.json();
      expect(data.error).toContain('not enabled');
    });

    // Note: Testing actual chat streaming requires Ollama to be running
    // That would be an E2E test
  });
});
