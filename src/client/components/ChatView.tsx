import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, type Message } from '../services/api';
import { storage } from '../services/storage';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import './ChatView.css';

interface ValidationError {
    field: string;
    message: string;
}

function validateChatRequest(
    userContent: string,
    provider: string,
    model: string,
    systemPrompt: string
): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!userContent.trim()) {
        errors.push({ field: 'message', message: 'Please enter a message' });
    }

    if (!provider.trim()) {
        errors.push({ field: 'provider', message: 'Please select a provider' });
    }

    if (!model.trim()) {
        errors.push({ field: 'model', message: 'Please select a model' });
    }

    if (!systemPrompt.trim()) {
        errors.push({ field: 'systemPrompt', message: 'System prompt cannot be empty' });
    }

    return errors;
}

function getErrorMessage(error: unknown): string {
    if (error instanceof Error) {
        const message = error.message.toLowerCase();
        
        // Handle network/connection errors
        if (message.includes('failed to fetch') || 
            message.includes('networkerror') ||
            message.includes('type error') ||
            message.includes('connection refused') ||
            message.includes('err_connection_refused') ||
            message.includes('fetch error')) {
            return 'Unable to connect to the server. Please check your connection and try again.';
        }
        
        // Handle HTTP status errors
        if (message.includes('404') || message.includes('not found')) {
            return 'The requested model or provider was not found. Please check your settings.';
        }
        if (message.includes('500') || message.includes('internal server error')) {
            return 'Server error occurred. Please try again later.';
        }
        if (message.includes('timeout')) {
            return 'Request timed out. Please try again.';
        }
        
        // Fallback for other errors - clean up technical jargon
        return message.replace(/^[a-z]+error:/i, '').trim() || 'An unexpected error occurred. Please try again.';
    }
    return 'An unexpected error occurred. Please try again.';
}

interface ChatViewProps {
    provider: string;
    model: string;
    temperature: number;
    maxTokens: number;
    systemPrompt: string;
    systemPromptName: string;
    onToggleSettings: () => void;
}

export function ChatView({
    provider,
    model,
    temperature,
    maxTokens,
    systemPrompt,
    systemPromptName,
    onToggleSettings,
}: ChatViewProps) {
    const [messages, setMessages] = useState<Message[]>([]);
    const [isStreaming, setIsStreaming] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const messagesContainerRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const saved = storage.getConversation();
        if (saved) {
            setMessages(saved.messages.map(m => ({
                ...m,
                timestamp: m.timestamp || Date.now()
            })));
        }
    }, []);

    const scrollToBottom = useCallback(() => {
        requestAnimationFrame(() => {
            if (messagesContainerRef.current) {
                messagesContainerRef.current.scrollTop =
                    messagesContainerRef.current.scrollHeight;
            }
        });
    }, []);

    const saveConversation = useCallback((msgs: Message[]) => {
        storage.saveConversation({
            messages: msgs,
            updatedAt: Date.now(),
        });
    }, []);

    const handleSendMessage = useCallback(
        async (userContent: string) => {
            // Clear any previous errors
            setError(null);

            // Client-side validation
            const validationErrors = validateChatRequest(userContent, provider, model, systemPrompt);
            if (validationErrors.length > 0) {
                const errorMessage = validationErrors.map(err => err.message).join('. ');
                setError(errorMessage);
                return;
            }

            // Add user message
            const userMessage: Message = {
                role: 'user',
                content: userContent,
                timestamp: Date.now(),
            };

            // Add empty assistant message for streaming (with slightly different timestamp)
            const assistantMessage: Message = {
                role: 'assistant',
                content: '',
                timestamp: Date.now() + 1,
                model,
                systemPromptName,
            };

            const newMessages = [...messages, userMessage, assistantMessage];
            setMessages(newMessages);
            setIsStreaming(true);
            scrollToBottom();
            saveConversation(newMessages);

            try {
                // Build messages array with system prompt
                const apiMessages = [
                    { role: 'system' as const, content: systemPrompt },
                    ...newMessages.slice(0, -1).map((m) => ({
                        role: m.role,
                        content: m.content,
                    })),
                ];

                await chatApi.streamChat(
                    {
                        provider,
                        model,
                        messages: apiMessages,
                        temperature,
                        maxTokens,
                    },
                    (chunk) => {
                        setMessages((prev) => {
                            const updated = [...prev];
                            const lastIndex = updated.length - 1;
                            updated[lastIndex] = {
                                ...updated[lastIndex],
                                content: updated[lastIndex].content + chunk,
                            };
                            return updated;
                        });
                        scrollToBottom();
                    }
                );
            } catch (error) {
                const userFriendlyMessage = getErrorMessage(error);
                setError(userFriendlyMessage);
                
                // Remove the empty assistant message since the request failed
                setMessages((prev) => {
                    const updated = prev.slice(0, -1); // Remove the empty assistant message
                    return updated;
                });
            } finally {
                setIsStreaming(false);
                setMessages((prev) => {
                    saveConversation(prev);
                    return prev;
                });
            }
        },
        [messages, provider, model, temperature, maxTokens, systemPrompt, systemPromptName, scrollToBottom, saveConversation]
    );

    const clearConversation = useCallback(() => {
        setMessages([]);
        storage.clearConversation();
    }, []);

    return (
        <div className="chat-view">
            <div className="chat-view__header">
                <span className="chat-view__title">Chat</span>
                <div className="chat-view__actions">
                    <button onClick={clearConversation}>Clear</button>
                    <button onClick={onToggleSettings}>Settings</button>
                </div>
            </div>

            <div className="chat-view__messages" ref={messagesContainerRef}>
                {messages.length === 0 ? (
                    <div className="chat-view__empty">Start a conversation</div>
                ) : (
                     messages.map((m, i) => (
                         <ChatMessage key={`${m.role}-${m.timestamp}-${i}`} role={m.role as 'user' | 'assistant'} content={m.content} model={m.model} systemPromptName={m.systemPromptName} />
                     ))
                )}
                {isStreaming && (
                    <div className="chat-view__streaming-indicator">
                        <div className="chat-view__streaming-dots">
                            <span className="chat-view__dot" />
                            <span className="chat-view__dot" />
                            <span className="chat-view__dot" />
                        </div>
                        <span>AI is thinking...</span>
                    </div>
                )}
            </div>

            {error && (
                <div className="chat-view__error">
                    <span className="chat-view__error-icon">⚠️</span>
                    {error}
                    <button 
                        className="chat-view__error-close" 
                        onClick={() => setError(null)}
                        aria-label="Dismiss error"
                    >
                        ×
                    </button>
                </div>
            )}
            
            <div className="chat-view__input-area">
                <ChatInput 
                    disabled={isStreaming || !model.trim()} 
                    noModelSelected={!model.trim()}
                    isLoading={isStreaming}
                    onSendMessage={handleSendMessage} 
                />
            </div>
        </div>
    );
}
