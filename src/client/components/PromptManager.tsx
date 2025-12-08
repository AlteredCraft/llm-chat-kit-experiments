import React from 'react';
import { Edit, Plus, X } from 'lucide-react';
import { type Prompt } from '../services/api';
import './PromptManager.css';

interface PromptManagerProps {
    prompts: Prompt[];
    activePromptId: string;
    onPromptSelected: (promptId: string) => void;
    onPromptDeleted: (promptId: string) => void;
    onStartEditPrompt: (prompt: Prompt) => void;
    onStartCreatePrompt: () => void;
}

export function PromptManager({
    prompts,
    activePromptId,
    onPromptSelected,
    onPromptDeleted,
    onStartEditPrompt,
    onStartCreatePrompt,
}: PromptManagerProps) {
    function isUserPrompt(prompt: Prompt): boolean {
        return prompt.id.startsWith('user-');
    }

    async function deletePrompt(promptId: string) {
        if (!confirm('Delete this prompt?')) return;
        onPromptDeleted(promptId);
    }

    return (
        <div className="prompt-manager">
            <div className="prompt-manager__list">
                {prompts.map((prompt) => (
                    <div
                        key={prompt.id}
                        className={`prompt-manager__item ${prompt.id === activePromptId ? 'prompt-manager__item--active' : ''
                            }`}
                        onClick={() => onPromptSelected(prompt.id)}
                    >
                        <input
                            type="radio"
                            name="prompt"
                            checked={prompt.id === activePromptId}
                            readOnly
                        />
                        <div className="prompt-manager__info">
                            <div className="prompt-manager__name">{prompt.name}</div>
                        </div>
                        <div className="prompt-manager__actions">
                            <button
                                className="prompt-manager__icon-btn"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onStartEditPrompt(prompt);
                                }}
                                title="Edit"
                            >
                                <Edit size={16} />
                            </button>
                            {isUserPrompt(prompt) && (
                                <button
                                    className="prompt-manager__icon-btn"
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        deletePrompt(prompt.id);
                                    }}
                                    title="Delete"
                                >
                                    <X size={16} />
                                </button>
                            )}
                        </div>
                    </div>
                ))}
            </div>

            <button onClick={onStartCreatePrompt}>
                <Plus size={16} />
                New Prompt
            </button>
        </div>
    );
}