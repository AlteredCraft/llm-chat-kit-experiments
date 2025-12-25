import React, { useState, useEffect, useCallback } from 'react';
import { storage, type Settings } from '../services/storage';
import { promptsApi, providersApi, type Prompt } from '../services/api';
import {
  type ThemeSettings,
  type GeneratedTheme,
  defaultThemeSettings,
} from '../types/theme';
import { useThemeSignals, formatSignalsForApi } from '../hooks/useThemeSignals';
import { themeApi, applyTheme, resetTheme } from '../services/theme';
import { ChatView } from './ChatView';
import { SettingsPanel } from './SettingsPanel';
import { PromptEditModal } from './PromptEditModal';
import { ThemeProposal } from './ThemeProposal';
import './ChatApp.css';

const defaultSettings: Settings = {
    provider: 'ollama',
    model: '',
    temperature: 0.7,
    maxTokens: 2048,
    activePromptId: 'default',
};

export function ChatApp() {
    const [settingsOpen, setSettingsOpen] = useState(false);
    const [settings, setSettings] = useState<Settings>(() => {
        return storage.getSettings() || defaultSettings;
    });
    const [prompts, setPrompts] = useState<Prompt[]>([]);
    const [activePrompt, setActivePrompt] = useState<Prompt | null>(null);
    const [editingPrompt, setEditingPrompt] = useState<Prompt | null>(null);
    const [isCreatingPrompt, setIsCreatingPrompt] = useState(false);

    // Theme state
    const [themeSettings, setThemeSettings] = useState<ThemeSettings>(() => {
        return storage.getThemeSettings() || defaultThemeSettings;
    });
    const [proposedTheme, setProposedTheme] = useState<GeneratedTheme | null>(null);
    const [favoriteTheme, setFavoriteTheme] = useState<GeneratedTheme | null>(() => {
        return storage.getFavoriteTheme();
    });
    const [activeTheme, setActiveTheme] = useState<GeneratedTheme | null>(() => {
        return storage.getActiveTheme();
    });
    const [isGeneratingTheme, setIsGeneratingTheme] = useState(false);

    // Theme signals hook
    const { currentValues: signalValues, checkForChanges } = useThemeSignals(
        themeSettings.checkFrequency,
        themeSettings.autoGenerate
    );

    useEffect(() => {
        loadDefaults();
        loadPrompts();
    }, []);

    // Restore active theme on mount
    useEffect(() => {
        const savedTheme = storage.getActiveTheme();
        if (savedTheme) {
            applyTheme(savedTheme);
        }
    }, []);

    useEffect(() => {
        const keyHandler = (e: KeyboardEvent) => {
            // Ctrl/Cmd + , to toggle settings
            if ((e.ctrlKey || e.metaKey) && e.key === ',') {
                e.preventDefault();
                setSettingsOpen((prev) => !prev);
            }
            // Escape to close settings
            if (e.key === 'Escape' && settingsOpen) {
                setSettingsOpen(false);
            }
        };

        document.addEventListener('keydown', keyHandler);
        return () => document.removeEventListener('keydown', keyHandler);
    }, [settingsOpen]);

    async function loadDefaults() {
        try {
            const { defaults } = await providersApi.getProviders();
            const saved = storage.getSettings();
            if (!saved || !defaults.provider) {
                setSettings((prev) => ({
                    ...prev,
                    provider: defaults.provider || 'ollama',
                    model: '', // Clear model when provider changes to defaults
                    temperature: defaults.temperature,
                    maxTokens: defaults.maxTokens,
                }));
            }
        } catch (error) {
            console.error('Failed to load defaults:', error);
        }
    }

    async function loadPrompts() {
        try {
            const result = await promptsApi.getAll();
            setPrompts(result.prompts);

            const savedSettings = storage.getSettings();
            const active =
                result.prompts.find((p) => p.id === savedSettings?.activePromptId) ||
                result.prompts[0] ||
                null;
            setActivePrompt(active);
        } catch (error) {
            console.error('Failed to load prompts:', error);
        }
    }

    const handleSettingsChange = useCallback((updates: Partial<Settings>) => {
        setSettings((prev) => {
            const updated = { ...prev, ...updates };
            storage.saveSettings(updated);
            return updated;
        });
    }, []);

    const handlePromptSelected = useCallback(
        (promptId: string) => {
            const prompt = prompts.find((p) => p.id === promptId);
            if (prompt) {
                setActivePrompt(prompt);
                handleSettingsChange({ activePromptId: prompt.id });
            }
        },
        [prompts, handleSettingsChange]
    );

    const handlePromptCreated = useCallback((prompt: Prompt) => {
        setPrompts((prev) => [...prev, prompt]);
    }, []);

    const handlePromptUpdated = useCallback((prompt: Prompt) => {
        setPrompts((prev) => prev.map((p) => (p.id === prompt.id ? prompt : p)));
        setActivePrompt((prev) => (prev?.id === prompt.id ? prompt : prev));
    }, []);

    const handlePromptDuplicated = useCallback((prompt: Prompt) => {
        setPrompts((prev) => [...prev, prompt]);
        setActivePrompt(prompt);
        handleSettingsChange({ activePromptId: prompt.id });
    }, [handleSettingsChange]);

    const handleStartEditPrompt = useCallback((prompt: Prompt) => {
        setEditingPrompt(prompt);
        setIsCreatingPrompt(false);
    }, []);

    const handleStartCreatePrompt = useCallback(() => {
        setEditingPrompt(null);
        setIsCreatingPrompt(true);
    }, []);

    const handleClosePromptModal = useCallback(() => {
        setEditingPrompt(null);
        setIsCreatingPrompt(false);
    }, []);

    const handleSavePrompt = useCallback(async (id: string, name: string, promptText: string) => {
        if (isCreatingPrompt) {
            const result = await promptsApi.create(name, promptText);
            setPrompts((prev) => [...prev, result.prompt]);
        } else {
            const isUserPrompt = id.startsWith('user-');
            if (isUserPrompt) {
                const result = await promptsApi.update(id, name, promptText);
                setPrompts((prev) => prev.map((p) => (p.id === id ? result.prompt : p)));
                setActivePrompt((prev) => (prev?.id === id ? result.prompt : prev));
            } else {
                const result = await promptsApi.create(name, promptText);
                setPrompts((prev) => [...prev, result.prompt]);
                setActivePrompt(result.prompt);
                handleSettingsChange({ activePromptId: result.prompt.id });
            }
        }
        handleClosePromptModal();
    }, [isCreatingPrompt, handleSettingsChange, handleClosePromptModal]);

    const handlePromptDeleted = useCallback(
        (promptId: string) => {
            setPrompts((prev) => prev.filter((p) => p.id !== promptId));
            if (activePrompt?.id === promptId) {
                const fallback =
                    prompts.find((p) => p.id !== promptId) ||
                    null;
                setActivePrompt(fallback);
                if (fallback) {
                    handleSettingsChange({ activePromptId: fallback.id });
                }
            }
        },
        [activePrompt, prompts, handleSettingsChange]
    );

    // Theme handlers
    const handleThemeSettingsChange = useCallback((updates: Partial<ThemeSettings>) => {
        setThemeSettings((prev) => {
            const updated = { ...prev, ...updates };
            storage.saveThemeSettings(updated);
            return updated;
        });
    }, []);

    const generateTheme = useCallback(async () => {
        if (!settings.provider || !settings.model) {
            console.error('No provider/model configured for theme generation');
            return;
        }

        setIsGeneratingTheme(true);
        try {
            const response = await themeApi.generate({
                provider: settings.provider,
                model: settings.model,
                signals: formatSignalsForApi(signalValues),
                preferences: {
                    useGoogleFonts: themeSettings.useGoogleFonts,
                    preferDarkMode: themeSettings.preferDarkMode,
                },
                currentThemeCss: activeTheme?.css,
            });

            if (response.success && response.theme) {
                const newTheme: GeneratedTheme = {
                    id: `theme-${Date.now()}`,
                    name: response.theme.name,
                    css: response.theme.css,
                    fonts: response.theme.fonts,
                    generatedAt: new Date().toISOString(),
                    signals: signalValues,
                };
                setProposedTheme(newTheme);
            } else {
                console.error('Theme generation failed:', response.error);
            }
        } catch (error) {
            console.error('Theme generation error:', error);
        } finally {
            setIsGeneratingTheme(false);
        }
    }, [settings.provider, settings.model, signalValues, themeSettings, activeTheme]);

    const handleApplyTheme = useCallback((theme: GeneratedTheme, saveAsFavorite: boolean) => {
        applyTheme(theme);
        setActiveTheme(theme);
        storage.saveActiveTheme(theme);

        if (saveAsFavorite) {
            setFavoriteTheme(theme);
            storage.saveFavoriteTheme(theme);
        }

        setProposedTheme(null);
    }, []);

    const handleDismissTheme = useCallback(() => {
        setProposedTheme(null);
    }, []);

    const handleRestoreFavorite = useCallback(() => {
        if (favoriteTheme) {
            applyTheme(favoriteTheme);
            setActiveTheme(favoriteTheme);
            storage.saveActiveTheme(favoriteTheme);
        }
    }, [favoriteTheme]);

    const handleResetTheme = useCallback(() => {
        resetTheme();
        setActiveTheme(null);
        storage.clearActiveTheme();
    }, []);

    return (
        <div className="chat-app">
            <div className="chat-app__main">
                <ChatView
                    provider={settings.provider}
                    model={settings.model}
                    temperature={settings.temperature}
                    maxTokens={settings.maxTokens}
                    systemPrompt={activePrompt?.prompt || 'You are a helpful assistant.'}
                    systemPromptName={activePrompt?.name || 'Default'}
                    onToggleSettings={() => setSettingsOpen((prev) => !prev)}
                />
            </div>

            <footer className="chat-app__footer">
                <div className="chat-app__footer-content">
                    <span className="chat-app__footer-brand">LLM Chat Kit</span>
                    <span className="chat-app__footer-sep">·</span>
                    <span className="chat-app__footer-copy">© {new Date().getFullYear()}</span>
                    <span className="chat-app__footer-sep">·</span>
                    <a href="https://github.com" className="chat-app__footer-link" target="_blank" rel="noopener noreferrer">GitHub</a>
                </div>
            </footer>

            <div
                className={`chat-app__overlay ${settingsOpen ? 'chat-app__overlay--visible' : ''}`}
                onClick={() => setSettingsOpen(false)}
            />

            <div className={`chat-app__sidebar ${settingsOpen ? 'chat-app__sidebar--open' : ''}`}>
                <SettingsPanel
                    settings={settings}
                    prompts={prompts}
                    activePromptId={activePrompt?.id || ''}
                    onClose={() => setSettingsOpen(false)}
                    onSettingsChange={handleSettingsChange}
                    onPromptSelected={handlePromptSelected}
                    onPromptDeleted={handlePromptDeleted}
                    onStartEditPrompt={handleStartEditPrompt}
                    onStartCreatePrompt={handleStartCreatePrompt}
                    themeSettings={themeSettings}
                    favoriteTheme={favoriteTheme}
                    activeTheme={activeTheme}
                    isGeneratingTheme={isGeneratingTheme}
                    onThemeSettingsChange={handleThemeSettingsChange}
                    onSurpriseMe={generateTheme}
                    onRestoreFavorite={handleRestoreFavorite}
                    onResetTheme={handleResetTheme}
                />
            </div>

            <PromptEditModal
                prompt={editingPrompt}
                isOpen={!!editingPrompt || isCreatingPrompt}
                onClose={handleClosePromptModal}
                onSave={handleSavePrompt}
                isCreating={isCreatingPrompt}
            />

            {proposedTheme && (
                <ThemeProposal
                    theme={proposedTheme}
                    isOpen={!!proposedTheme}
                    onApply={handleApplyTheme}
                    onDismiss={handleDismissTheme}
                />
            )}
        </div>
    );
}
