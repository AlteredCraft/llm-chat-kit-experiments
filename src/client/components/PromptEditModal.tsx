import React from 'react';
import { X } from 'lucide-react';
import { type Prompt } from '../services/api';
import './PromptEditModal.css';

interface PromptEditModalProps {
    prompt: Prompt | null;
    isOpen: boolean;
    onClose: () => void;
    onSave: (id: string, name: string, promptText: string) => void;
    isCreating?: boolean;
}

export function PromptEditModal({
    prompt,
    isOpen,
    onClose,
    onSave,
    isCreating = false,
}: PromptEditModalProps) {
    const [name, setName] = React.useState('');
    const [promptText, setPromptText] = React.useState('');
    const [isSaving, setIsSaving] = React.useState(false);

    React.useEffect(() => {
        if (isCreating) {
            setName('');
            setPromptText('');
        } else if (prompt) {
            setName(prompt.name);
            setPromptText(prompt.prompt);
        }
    }, [prompt, isCreating]);

    if (!isOpen || (!isCreating && !prompt)) {
        return null;
    }

    function isDefaultPrompt(prompt: Prompt): boolean {
        return !prompt.id.startsWith('user-');
    }

    async function handleSubmit(e: React.FormEvent) {
        e.preventDefault();
        if (!name.trim() || !promptText.trim()) return;

        setIsSaving(true);
        try {
            if (isCreating) {
                await onSave('', name.trim(), promptText.trim());
            } else {
                await onSave(prompt!.id, name.trim(), promptText.trim());
            }
            onClose();
        } catch (error) {
            console.error('Failed to save prompt:', error);
        } finally {
            setIsSaving(false);
        }
    }

    function handleKeyDown(e: React.KeyboardEvent) {
        if (e.key === 'Escape') {
            onClose();
        }
    }

    return (
        <div className="prompt-edit-modal" onKeyDown={handleKeyDown}>
            <div className="prompt-edit-modal__overlay" onClick={onClose} />
            <div className="prompt-edit-modal__content">
                <div className="prompt-edit-modal__header">
                    <h2>{isCreating ? 'Create New Prompt' : 'Edit Prompt'}</h2>
                    <button className="prompt-edit-modal__close" onClick={onClose}>
                        <X size={20} />
                    </button>
                </div>

                <form onSubmit={handleSubmit} className="prompt-edit-modal__form">
                    <div className="prompt-edit-modal__field">
                        <label htmlFor="prompt-name">Name</label>
                        <input
                            id="prompt-name"
                            type="text"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Prompt name"
                            required
                        />
                    </div>

                    <div className="prompt-edit-modal__field">
                        <label htmlFor="prompt-text">System Prompt</label>
                        <textarea
                            id="prompt-text"
                            value={promptText}
                            onChange={(e) => setPromptText(e.target.value)}
                            placeholder="You are a helpful assistant..."
                            rows={8}
                            required
                        />
                    </div>

                    {!isCreating && isDefaultPrompt(prompt!) && (
                        <div className="prompt-edit-modal__notice">
                            <p>
                                <strong>Note:</strong> This is a default prompt. 
                                Your changes will be saved as a new custom prompt.
                            </p>
                        </div>
                    )}

                    <div className="prompt-edit-modal__actions">
                        <button
                            type="button"
                            className="prompt-edit-modal__cancel"
                            onClick={onClose}
                            disabled={isSaving}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="prompt-edit-modal__save"
                            disabled={isSaving || !name.trim() || !promptText.trim()}
                        >
                            {isSaving ? 'Saving...' : (isCreating ? 'Create' : 'Save')}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}