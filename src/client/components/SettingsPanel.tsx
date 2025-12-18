import React from 'react';
import type { Prompt } from '../services/api';
import type { Settings } from '../services/storage';
import type { ThemeSettings, GeneratedTheme } from '../types/theme';
import { ProviderSelect } from './ProviderSelect';
import { ParamControls } from './ParamControls';
import { PromptManager } from './PromptManager';
import { ThemePanel } from './ThemePanel';
import './SettingsPanel.css';

type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

interface SettingsPanelProps {
    settings: Settings;
    prompts: Prompt[];
    activePromptId: string;
    onClose: () => void;
    onSettingsChange: (updates: Partial<Settings>) => void;
    onPromptSelected: (promptId: string) => void;
    onPromptDeleted: (promptId: string) => void;
    onStartEditPrompt: (prompt: Prompt) => void;
    onStartCreatePrompt: () => void;
    // Theme props
    themeSettings: ThemeSettings;
    favoriteTheme: GeneratedTheme | null;
    activeTheme: GeneratedTheme | null;
    isGeneratingTheme: boolean;
    onThemeSettingsChange: (updates: Partial<ThemeSettings>) => void;
    onSurpriseMe: () => void;
    onRestoreFavorite: () => void;
    onResetTheme: () => void;
}

export function SettingsPanel({
    settings,
    prompts,
    activePromptId,
    onClose,
    onSettingsChange,
    onPromptSelected,
    onPromptDeleted,
    onStartEditPrompt,
    onStartCreatePrompt,
    themeSettings,
    favoriteTheme,
    activeTheme,
    isGeneratingTheme,
    onThemeSettingsChange,
    onSurpriseMe,
    onRestoreFavorite,
    onResetTheme,
}: SettingsPanelProps) {
    return (
        <div className="settings-panel">
            <div className="settings-panel__header">
                <span className="settings-panel__title">Settings</span>
                <button className="settings-panel__close-btn" onClick={onClose}>
                    ×
                </button>
            </div>

            <div className="settings-panel__content">
                <div className="settings-panel__section">
                    <div className="settings-panel__section-title">Provider</div>
                    <ProviderSelect
                        provider={(settings?.provider || 'ollama') as ProviderName}
                        model={settings?.model || ''}
                        onProviderChange={(provider) => onSettingsChange({ provider })}
                        onModelChange={(model) => onSettingsChange({ model })}
                    />
                </div>

                <div className="settings-panel__section">
                    <div className="settings-panel__section-title">Parameters</div>
                    <ParamControls
                        temperature={settings?.temperature || 0.7}
                        maxTokens={settings?.maxTokens || 2048}
                        onTemperatureChange={(temperature) => onSettingsChange({ temperature })}
                        onMaxTokensChange={(maxTokens) => onSettingsChange({ maxTokens })}
                    />
                </div>

                <div className="settings-panel__section">
                    <div className="settings-panel__section-title">System Prompt</div>
                    <PromptManager
                        prompts={prompts}
                        activePromptId={activePromptId}
                        onPromptSelected={onPromptSelected}
                        onPromptDeleted={onPromptDeleted}
                        onStartEditPrompt={onStartEditPrompt}
                        onStartCreatePrompt={onStartCreatePrompt}
                    />
                </div>

                <div className="settings-panel__section">
                    <div className="settings-panel__section-title">AI Theme</div>
                    <ThemePanel
                        settings={themeSettings}
                        favoriteTheme={favoriteTheme}
                        activeTheme={activeTheme}
                        isGenerating={isGeneratingTheme}
                        onSettingsChange={onThemeSettingsChange}
                        onSurpriseMe={onSurpriseMe}
                        onRestoreFavorite={onRestoreFavorite}
                        onResetTheme={onResetTheme}
                    />
                </div>
            </div>
        </div>
    );
}
