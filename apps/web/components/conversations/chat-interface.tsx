'use client';

import { useState, useRef, useEffect, useOptimistic } from 'react';
import { addMessageAction } from '@/app/dashboard/conversations/actions';

interface Message {
    id: string;
    role: string;
    content: string;
    created_at: string;
}

interface ChatInterfaceProps {
    conversationId: string;
    initialMessages: Message[];
}
function TypewriterText({
    text,
    speed = 8,
}: {
    text: string;
    speed?: number;
}) {
    const [displayed, setDisplayed] = useState('');

    useEffect(() => {
        let i = 0;
        let interval: NodeJS.Timeout;

        setDisplayed('');

        const startTyping = () => {
            interval = setInterval(() => {
                i++;
                setDisplayed(text.slice(0, i));

                if (i >= text.length) {
                    clearInterval(interval);
                }
            }, speed);
        };

        // 👇 SMALL DELAY AFTER DOTS DISAPPEAR
        const timeout = setTimeout(startTyping, 250); // 150–250ms sweet spot

        return () => {
            clearTimeout(timeout);
            clearInterval(interval);
        };
    }, [text, speed]);


    return <span>{displayed}</span>;
}

export default function ChatInterface({ conversationId, initialMessages }: ChatInterfaceProps) {
    const [isPending, setIsPending] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const formRef = useRef<HTMLFormElement>(null);

    const [optimisticMessages, addOptimisticMessage] = useOptimistic(
        initialMessages,
        (state, newMessage: Message) => [...state, newMessage]
    );

    // Scroll to bottom on initial load and when messages change
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [optimisticMessages, isPending]);

    async function handleSubmit(formData: FormData) {
        const content = formData.get('content') as string;
        if (!content.trim()) return;

        const typingId = 'typing-' + Date.now();

        // Add optimistic user message immediately
        addOptimisticMessage({
            id: 'temp-' + Date.now(),
            role: 'user',
            content: content,
            created_at: new Date().toISOString(),
        });


        addOptimisticMessage({
            id: typingId,
            role: 'assistant',
            content: '__typing__',
            created_at: new Date().toISOString(),
        });


        setIsPending(true);
        // Optimistically clear form
        formRef.current?.reset();

        try {
            await addMessageAction(conversationId, content);
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]">
            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                {optimisticMessages.length > 0 ? (
                    optimisticMessages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800'
                                    }`}
                            >
                                <div className="text-xs opacity-70 mb-1 capitalize">{message.role}</div>
                                {message.content === '__typing__' ? (
                                    <div className="flex space-x-2 items-center h-6">
                                        <div className="w-4 h-4 bg-gray-700 rounded-full animate-bounce"></div>
                                        <div className="w-4 h-4 bg-gray-700 rounded-full animate-bounce [animation-delay:150ms]"></div>
                                        <div className="w-4 h-4 bg-gray-700 rounded-full animate-bounce [animation-delay:300ms]"></div>
                                    </div>
                                ) : (
                                    <p className="whitespace-pre-wrap">
                                        {message.role === 'assistant' ? (
                                            <TypewriterText text={message.content} />
                                        ) : (
                                            message.content
                                        )}
                                    </p>

                                )}

                                <div className="text-xs opacity-50 mt-2 text-right">
                                    {new Date(message.created_at).toLocaleTimeString([], {
                                        hour: 'numeric',
                                        minute: '2-digit',
                                    })}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            <form
                ref={formRef}
                action={handleSubmit}
                className="border-t border-gray-200 p-4 bg-white"
            >
                <div className="flex space-x-4">
                    <input
                        type="text"
                        name="content"
                        placeholder="Type your message..."
                        className="flex-1 rounded-lg border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 p-2 border disabled:bg-gray-100 disabled:text-gray-500"
                        required
                        autoComplete="off"
                        disabled={isPending}
                    />
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed min-w-[80px]"
                        disabled={isPending}
                    >
                        Send
                    </button>
                </div>
            </form>
        </div>
    );
}
