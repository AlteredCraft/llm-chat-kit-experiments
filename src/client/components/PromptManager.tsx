import React, { useState } from 'react';
import { promptsApi, type Prompt } from '../services/api';
import './PromptManager.css';

interface PromptManagerProps {
    prompts: Prompt[];
    activePromptId: string;
    onPromptSelected: (promptId: string) => void;
    onPromptCreated: (prompt: Prompt) => void;
    onPromptUpdated: (prompt: Prompt) => void;
    onPromptDeleted: (promptId: string) => void;
}

export function PromptManager({
    prompts,
    activePromptId,
    onPromptSelected,
    onPromptCreated,
    onPromptUpdated,
    onPromptDeleted,
}: PromptManagerProps) {
    const [isCreating, setIsCreating] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [newName, setNewName] = useState('');
    const [newPrompt, setNewPrompt] = useState('');

    function isUserPrompt(prompt: Prompt): boolean {
        return prompt.id.startsWith('user-');
    }

    function startCreate() {
        setIsCreating(true);
        setNewName('');
        setNewPrompt('');
    }

    function cancelCreate() {
        setIsCreating(false);
        setNewName('');
        setNewPrompt('');
    }

    async function submitCreate() {
        if (!newName.trim() || !newPrompt.trim()) return;

        try {
            const result = await promptsApi.create(newName.trim(), newPrompt.trim());
            onPromptCreated(result.prompt);
            cancelCreate();
        } catch (error) {
            console.error('Failed to create prompt:', error);
        }
    }

    function startEdit(prompt: Prompt) {
        setEditingId(prompt.id);
        setNewName(prompt.name);
        setNewPrompt(prompt.prompt);
    }

    function cancelEdit() {
        setEditingId(null);
        setNewName('');
        setNewPrompt('');
    }

    async function submitEdit() {
        if (!editingId || !newName.trim() || !newPrompt.trim()) return;

        try {
            const result = await promptsApi.update(
                editingId,
                newName.trim(),
                newPrompt.trim()
            );
            onPromptUpdated(result.prompt);
            cancelEdit();
        } catch (error) {
            console.error('Failed to update prompt:', error);
        }
    }

    async function deletePrompt(promptId: string) {
        if (!confirm('Delete this prompt?')) return;

        try {
            await promptsApi.delete(promptId);
            onPromptDeleted(promptId);
        } catch (error) {
            console.error('Failed to delete prompt:', error);
        }
    }

    function renderForm(isEdit: boolean) {
        return (
            <div className="prompt-manager__form">
                <div className="prompt-manager__form-field">
                    <label>Name</label>
                    <input
                        type="text"
                        value={newName}
                        onChange={(e) => setNewName(e.target.value)}
                        placeholder="Prompt name"
                    />
                </div>
                <div className="prompt-manager__form-field">
                    <label>System Prompt</label>
                    <textarea
                        value={newPrompt}
                        onChange={(e) => setNewPrompt(e.target.value)}
                        placeholder="You are a helpful assistant..."
                    />
                </div>
                <div className="prompt-manager__form-actions">
                    <button
                        className="prompt-manager__cancel-btn"
                        onClick={isEdit ? cancelEdit : cancelCreate}
                    >
                        Cancel
                    </button>
                    <button onClick={isEdit ? submitEdit : submitCreate}>
                        {isEdit ? 'Save' : 'Create'}
                    </button>
                </div>
            </div>
        );
    }

    return (
        <div className="prompt-manager">
            <div className="prompt-manager__list">
                {prompts.map((prompt) =>
                    editingId === prompt.id ? (
                        <React.Fragment key={prompt.id}>{renderForm(true)}</React.Fragment>
                    ) : (
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
                            {isUserPrompt(prompt) && (
                                <div className="prompt-manager__actions">
                                    <button
                                        className="prompt-manager__icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            startEdit(prompt);
                                        }}
                                        title="Edit"
                                    >
                                        e
                                    </button>
                                    <button
                                        className="prompt-manager__icon-btn"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            deletePrompt(prompt.id);
                                        }}
                                        title="Delete"
                                    >
                                        x
                                    </button>
                                </div>
                            )}
                        </div>
                    )
                )}
            </div>

            {isCreating ? (
                renderForm(false)
            ) : (
                <button onClick={startCreate}>+ New Prompt</button>
            )}
        </div>
    );
}
