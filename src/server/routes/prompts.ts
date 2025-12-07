import { Hono } from 'hono';
import {
  getAllPrompts,
  getUserPrompts,
  saveUserPrompts,
  type Prompt,
} from '../lib/config';

export const promptsRoute = new Hono();

// Get all prompts (default + user)
promptsRoute.get('/', async (c) => {
  try {
    const prompts = await getAllPrompts();
    return c.json({ prompts });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Create a new user prompt
promptsRoute.post('/', async (c) => {
  try {
    const body = await c.req.json<{ name: string; prompt: string }>();
    const { name, prompt } = body;

    if (!name || !prompt) {
      return c.json({ error: 'Name and prompt are required' }, 400);
    }

    const userPrompts = await getUserPrompts();

    const newPrompt: Prompt = {
      id: `user-${Date.now()}`,
      name,
      prompt,
      createdAt: new Date().toISOString(),
    };

    userPrompts.push(newPrompt);
    await saveUserPrompts(userPrompts);

    return c.json({ prompt: newPrompt }, 201);
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Update a user prompt
promptsRoute.put('/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const body = await c.req.json<{ name?: string; prompt?: string }>();

    // Can only update user prompts (those starting with 'user-')
    if (!id.startsWith('user-')) {
      return c.json({ error: 'Cannot modify default prompts' }, 403);
    }

    const userPrompts = await getUserPrompts();
    const index = userPrompts.findIndex((p) => p.id === id);

    if (index === -1) {
      return c.json({ error: 'Prompt not found' }, 404);
    }

    if (body.name) userPrompts[index].name = body.name;
    if (body.prompt) userPrompts[index].prompt = body.prompt;

    await saveUserPrompts(userPrompts);

    return c.json({ prompt: userPrompts[index] });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});

// Delete a user prompt
promptsRoute.delete('/:id', async (c) => {
  try {
    const id = c.req.param('id');

    // Can only delete user prompts
    if (!id.startsWith('user-')) {
      return c.json({ error: 'Cannot delete default prompts' }, 403);
    }

    const userPrompts = await getUserPrompts();
    const filtered = userPrompts.filter((p) => p.id !== id);

    if (filtered.length === userPrompts.length) {
      return c.json({ error: 'Prompt not found' }, 404);
    }

    await saveUserPrompts(filtered);

    return c.json({ success: true });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Unknown error';
    return c.json({ error: message }, 500);
  }
});
