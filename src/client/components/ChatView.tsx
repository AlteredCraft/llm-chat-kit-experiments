import React, { useState, useEffect, useRef, useCallback } from 'react';
import { chatApi, type Message } from '../services/api';
import { storage } from '../services/storage';
import { ChatMessage } from './ChatMessage';
import { ChatInput } from './ChatInput';
import './ChatView.css';

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
                const message =
                    error instanceof Error ? error.message : 'Unknown error';
                setMessages((prev) => {
                    const updated = [...prev];
                    const lastIndex = updated.length - 1;
                    updated[lastIndex] = {
                        ...updated[lastIndex],
                        content: `Error: ${message}`,
                    };
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
                        <span className="chat-view__dot" />
                        Generating response...
                    </div>
                )}
            </div>

            <div className="chat-view__input-area">
                <ChatInput disabled={isStreaming} onSendMessage={handleSendMessage} />
            </div>
        </div>
    );
}
