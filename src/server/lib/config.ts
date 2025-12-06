import { readFile, writeFile, exists, mkdir } from 'fs/promises';
import { join } from 'path';

const DATA_DIR = process.env.DATA_DIR || join(import.meta.dir, '../../../data');
const CONFIG_DIR = join(import.meta.dir, '../../../config');

// Ensure data directory exists
await mkdir(DATA_DIR, { recursive: true });


export interface Prompt {
  id: string;
  name: string;
  prompt: string;
  isDefault: boolean;
  createdAt?: string;
}

export async function getDefaultPrompts(): Promise<Prompt[]> {
  const filePath = join(CONFIG_DIR, 'prompts.default.json');
  try {
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function getUserPrompts(): Promise<Prompt[]> {
  const filePath = join(DATA_DIR, 'prompts.user.json');
  try {
    const fileExists = await exists(filePath);
    if (!fileExists) {
      return [];
    }
    const content = await readFile(filePath, 'utf-8');
    return JSON.parse(content);
  } catch {
    return [];
  }
}

export async function saveUserPrompts(prompts: Prompt[]): Promise<void> {
  const filePath = join(DATA_DIR, 'prompts.user.json');
  await writeFile(filePath, JSON.stringify(prompts, null, 2), 'utf-8');
}

export async function getAllPrompts(): Promise<Prompt[]> {
  const [defaultPrompts, userPrompts] = await Promise.all([
    getDefaultPrompts(),
    getUserPrompts(),
  ]);
  return [...defaultPrompts, ...userPrompts];
}
