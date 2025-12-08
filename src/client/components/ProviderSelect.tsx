import React, { useState, useEffect, useCallback } from 'react';
import { modelsApi, providersApi, type ProviderInfo } from '../services/api';
import './ProviderSelect.css';

type ProviderName = 'openai' | 'anthropic' | 'google' | 'ollama';

interface ProviderSelectProps {
    provider: ProviderName;
    model: string;
    onProviderChange: (provider: ProviderName) => void;
    onModelChange: (model: string) => void;
}

export function ProviderSelect({
    provider,
    model,
    onProviderChange,
    onModelChange,
}: ProviderSelectProps) {
    const [providers, setProviders] = useState<ProviderInfo[]>([]);
    const [models, setModels] = useState<string[]>([]);
    const [loadingModels, setLoadingModels] = useState(false);
    const [loadingProviders, setLoadingProviders] = useState(true);
    const [modelError, setModelError] = useState<string | null>(null);
    const [docsUrl, setDocsUrl] = useState<string | null>(null);

    // Load providers on mount
    useEffect(() => {
        loadProviders();
    }, []);

    // Load models whenever provider changes
    useEffect(() => {
        loadModels(provider);
    }, [provider]);

    async function loadProviders() {
        try {
            const { providers: loadedProviders } = await providersApi.getProviders();
            setProviders(loadedProviders);

            // If current provider is not in enabled list, switch to first enabled
            const enabledNames = loadedProviders.map((p) => p.name);
            if (!enabledNames.includes(provider) && loadedProviders.length > 0) {
                onProviderChange(loadedProviders[0].name as ProviderName);
            } else {
                // Provider is valid, ensure models are loaded for initial sync
                loadModels(provider);
            }
        } catch (error) {
            console.error('Failed to load providers:', error);
        } finally {
            setLoadingProviders(false);
        }
    }

    async function loadModels(targetProvider: ProviderName) {
        setLoadingModels(true);
        setModelError(null);
        setModels([]);

        try {
            const result = await modelsApi.getModels(targetProvider);
            setDocsUrl(result.docsUrl || null);

            if (result.supported && result.models) {
                setModels(result.models);
                // Auto-select first model if current model is empty or not in list
                if (result.models.length > 0 && (!model || !result.models.includes(model))) {
                    onModelChange(result.models[0]);
                }
                if (result.error) {
                    setModelError(result.error);
                }
            }
        } catch (error) {
            setModelError(error instanceof Error ? error.message : 'Failed to load models');
        } finally {
            setLoadingModels(false);
        }
    }

    const handleProviderChange = useCallback((newProvider: ProviderName) => {
        // Clear model when switching providers
        onModelChange('');
        onProviderChange(newProvider);
        // Directly load models for new provider (don't rely solely on useEffect)
        loadModels(newProvider);
    }, [onProviderChange, onModelChange]);

    if (loadingProviders) {
        return <div className="provider-select__loading">Loading providers...</div>;
    }

    const enabledProviders = providers.map((p) => p.name as ProviderName);

    if (enabledProviders.length === 0) {
        return (
            <div className="provider-select__error">
                No providers available. Check your API keys in .env
            </div>
        );
    }

    return (
        <div className="provider-select">
            <div className="provider-select__field">
                <label htmlFor="provider">Provider</label>
                <select
                    id="provider"
                    value={provider}
                    onChange={(e) => handleProviderChange(e.target.value as ProviderName)}
                >
                    {enabledProviders.map((p) => (
                        <option key={p} value={p}>
                            {p.charAt(0).toUpperCase() + p.slice(1)}
                        </option>
                    ))}
                </select>
            </div>

            <div className="provider-select__field">
                <label htmlFor="model">Model</label>
                <select
                    id="model"
                    value={model}
                    onChange={(e) => onModelChange(e.target.value)}
                    disabled={loadingModels || models.length === 0}
                >
                    {models.map((m) => (
                        <option key={m} value={m}>
                            {m}
                        </option>
                    ))}
                    {models.length === 0 && !loadingModels && (
                        <option value="">No models available</option>
                    )}
                </select>
                {loadingModels && (
                    <div className="provider-select__loading">Loading models...</div>
                )}
                {modelError && (
                    <div className="provider-select__error">{modelError}</div>
                )}
                {docsUrl && (
                    <a
                        className="provider-select__docs-link"
                        href={docsUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        View available models
                    </a>
                )}
            </div>
        </div>
    );
}
