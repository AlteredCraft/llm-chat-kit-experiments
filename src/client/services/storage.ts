import type { ThemeSettings, GeneratedTheme } from '../types/theme';

const STORAGE_KEYS = {
  SETTINGS: 'chat-ui-settings',
  CONVERSATION: 'chat-ui-conversation',
  THEME_SETTINGS: 'chat-ui-theme-settings',
  FAVORITE_THEME: 'chat-ui-favorite-theme',
  ACTIVE_THEME: 'chat-ui-active-theme',
} as const;

export interface Settings {
  provider: string;
  model: string;
  temperature: number;
  maxTokens: number;
  activePromptId: string;
}

export interface Conversation {
  messages: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp?: number;
    model?: string;
  }>;
  updatedAt: number;
}

function safeGetItem<T>(key: string): T | null {
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : null;
  } catch {
    return null;
  }
}

function safeSetItem(key: string, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Failed to save to localStorage:', error);
  }
}

export const storage = {
  // Settings
  getSettings(): Settings | null {
    return safeGetItem<Settings>(STORAGE_KEYS.SETTINGS);
  },

  saveSettings(settings: Settings): void {
    safeSetItem(STORAGE_KEYS.SETTINGS, settings);
  },

  // Conversation
  getConversation(): Conversation | null {
    return safeGetItem<Conversation>(STORAGE_KEYS.CONVERSATION);
  },

  saveConversation(conversation: Conversation): void {
    safeSetItem(STORAGE_KEYS.CONVERSATION, conversation);
  },

  clearConversation(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION);
    } catch (error) {
      console.error('Failed to clear conversation:', error);
    }
  },

  // Clear all
  clearAll(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.SETTINGS);
      localStorage.removeItem(STORAGE_KEYS.CONVERSATION);
    } catch (error) {
      console.error('Failed to clear storage:', error);
    }
  },

  // Theme Settings
  getThemeSettings(): ThemeSettings | null {
    return safeGetItem<ThemeSettings>(STORAGE_KEYS.THEME_SETTINGS);
  },

  saveThemeSettings(settings: ThemeSettings): void {
    safeSetItem(STORAGE_KEYS.THEME_SETTINGS, settings);
  },

  // Favorite Theme
  getFavoriteTheme(): GeneratedTheme | null {
    return safeGetItem<GeneratedTheme>(STORAGE_KEYS.FAVORITE_THEME);
  },

  saveFavoriteTheme(theme: GeneratedTheme): void {
    safeSetItem(STORAGE_KEYS.FAVORITE_THEME, theme);
  },

  clearFavoriteTheme(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.FAVORITE_THEME);
    } catch (error) {
      console.error('Failed to clear favorite theme:', error);
    }
  },

  // Active Theme (currently applied)
  getActiveTheme(): GeneratedTheme | null {
    return safeGetItem<GeneratedTheme>(STORAGE_KEYS.ACTIVE_THEME);
  },

  saveActiveTheme(theme: GeneratedTheme): void {
    safeSetItem(STORAGE_KEYS.ACTIVE_THEME, theme);
  },

  clearActiveTheme(): void {
    try {
      localStorage.removeItem(STORAGE_KEYS.ACTIVE_THEME);
    } catch (error) {
      console.error('Failed to clear active theme:', error);
    }
  },
};
