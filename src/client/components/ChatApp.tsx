import React, { useState, useEffect, useCallback } from 'react';
import { storage, type Settings } from '../services/storage';
import { promptsApi, providersApi, type Prompt } from '../services/api';
import { ChatView } from './ChatView';
import { SettingsPanel } from './SettingsPanel';
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

    useEffect(() => {
        loadDefaults();
        loadPrompts();
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

    return (
        <div className="chat-app">
            <div className="chat-app__main">
                <ChatView
                    provider={settings.provider}
                    model={settings.model}
                    temperature={settings.temperature}
                    maxTokens={settings.maxTokens}
                    systemPrompt={activePrompt?.prompt || 'You are a helpful assistant.'}
                    onToggleSettings={() => setSettingsOpen((prev) => !prev)}
                />
            </div>

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
                    onPromptCreated={handlePromptCreated}
                    onPromptUpdated={handlePromptUpdated}
                    onPromptDeleted={handlePromptDeleted}
                />
            </div>
        </div>
    );
}
