import React, { useRef, useCallback } from 'react';
import './ChatInput.css';

interface ChatInputProps {
    disabled?: boolean;
    onSendMessage: (content: string) => void;
    noModelSelected?: boolean;
    isLoading?: boolean;
}

export function ChatInput({ disabled = false, noModelSelected = false, isLoading = false, onSendMessage }: ChatInputProps) {
    const textareaRef = useRef<HTMLTextAreaElement>(null);

    const submit = useCallback(() => {
        const textarea = textareaRef.current;
        if (!textarea) return;

        const value = textarea.value.trim();
        if (value && !disabled) {
            onSendMessage(value);
            textarea.value = '';
            textarea.style.height = 'auto';
        }
    }, [disabled, onSendMessage]);

    const handleKeyDown = useCallback(
        (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
            if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault();
                submit();
            }
        },
        [submit]
    );

    const handleInput = useCallback(() => {
        const textarea = textareaRef.current;
        if (textarea) {
            textarea.style.height = 'auto';
            textarea.style.height = `${textarea.scrollHeight}px`;
        }
    }, []);

    return (
        <div className="chat-input">
            <div className="chat-input__container">
                <textarea
                    ref={textareaRef}
                    placeholder={noModelSelected ? "Please select a model in settings..." : "Type a message..."}
                    disabled={disabled}
                    onKeyDown={handleKeyDown}
                    onInput={handleInput}
                    rows={1}
                />
                <button 
                    disabled={disabled} 
                    onClick={submit}
                    title={noModelSelected ? "Please select a model first" : "Send message"}
                    className={isLoading ? 'chat-input__button--loading' : ''}
                >
                    {isLoading ? (
                        <span className="chat-input__spinner">⟳</span>
                    ) : (
                        'Send'
                    )}
                </button>
            </div>
            <div className="chat-input__hint">
                Press Enter to send, Shift+Enter for new line
            </div>
        </div>
    );
}
