'use client';

import { useState, useEffect, useRef } from 'react';
import { createClient } from '@/utils/supabase/client';
import { ConversationActions } from './conversation-actions';

interface Message {
    id: string;
    role: string;
    content: string;
    created_at: string;
    sender?: string;
}

interface ChatInterfaceProps {
    conversationId: string;
    visitorId: string;
    initialMessages: Message[];
    isClosed: boolean;
}

export function ChatInterface({
    conversationId,
    visitorId,
    initialMessages,
    isClosed
}: ChatInterfaceProps) {
    const [messages, setMessages] = useState<Message[]>(initialMessages);
    const [isCustomerTyping, setIsCustomerTyping] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const supabase = createClient();

    // Sync initial messages if they change
    useEffect(() => {
        setMessages(initialMessages);
    }, [initialMessages]);

    // Polling fallback to ensure messages appear if Realtime misses them
    useEffect(() => {
        const fetchMessages = async () => {
            const { data, error } = await supabase
                .from('customer_messages')
                .select('id, role, content, created_at, sender')
                .eq('conversation_id', conversationId)
                .order('created_at', { ascending: true });

            if (!error && data) {
                setMessages(prev => {
                    if (JSON.stringify(prev) !== JSON.stringify(data)) return data;
                    return prev;
                });
            }
        };

        const interval = setInterval(fetchMessages, 3000); // 3s polling
        return () => clearInterval(interval);
    }, [conversationId, supabase]);

    // Realtime Subscriptions
    useEffect(() => {
        const channel = supabase.channel(`conversation:${conversationId}`);

        channel
            // Listen for customer typing
            .on('broadcast', { event: 'customer:typing' }, (payload) => {
                setIsCustomerTyping(!!payload.payload?.isTyping);
            })
            // Listen for new messages
            .on(
                'postgres_changes',
                {
                    event: 'INSERT',
                    schema: 'public',
                    table: 'customer_messages',
                    filter: `conversation_id=eq.${conversationId}`
                },
                (payload) => {
                    const newMsg = payload.new as Message;
                    // Optimistic update prevention (if we already possess it? unlikely for ID mismatch but good practice)
                    setMessages((prev) => {
                        if (prev.some(m => m.id === newMsg.id)) return prev;
                        // Specific Requirement: Hide customer typing when customer message arrives
                        if (newMsg.role === 'visitor') {
                            setIsCustomerTyping(false);
                        }
                        return [...prev, newMsg];
                    });
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isCustomerTyping]);

    return (
        <div className="bg-white rounded-xl border border-gray-200 overflow-hidden flex flex-col h-[600px]">
            <div className="p-4 border-b border-gray-100 bg-gray-50 flex justify-between items-center">
                <h2 className="font-semibold text-gray-900">Messages</h2>
                {isCustomerTyping && (
                    <span className="text-xs text-indigo-600 font-medium animate-pulse">
                        Visitor is typing...
                    </span>
                )}
            </div>

            <div className="flex-1 p-4 space-y-4 overflow-y-auto">
                {messages.length === 0 ? (
                    <p className="text-sm text-gray-500">No messages yet.</p>
                ) : (
                    messages.map((msg) => {
                        const isVisitor = msg.role === 'visitor';
                        const supportLabel = msg.sender === 'human' ? 'Support Agent' : 'AI Support';
                        return (
                            <div
                                key={msg.id}
                                className={`flex ${isVisitor ? 'justify-start' : 'justify-end'}`}
                            >
                                <div
                                    className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${isVisitor
                                        ? 'bg-gray-100 text-gray-900'
                                        : 'bg-indigo-50 text-indigo-900 border border-indigo-100'
                                        }`}
                                >
                                    <span className="text-xs font-medium text-gray-500 block mb-0.5">
                                        {isVisitor ? 'Visitor' : supportLabel}
                                    </span>
                                    {msg.content}
                                    <span className="text-xs text-gray-400 block mt-1">
                                        {new Date(msg.created_at).toLocaleString()}
                                    </span>
                                </div>
                            </div>
                        );
                    })
                )}
                {isCustomerTyping && (
                    <div className="flex justify-start">
                        <div className="bg-gray-50 border border-gray-100 rounded-lg rounded-bl-none px-3 py-2 flex space-x-1 items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {!isClosed && (
                <div className="p-4 border-t border-gray-100 bg-gray-50 flex-none">
                    <ConversationActions conversationId={conversationId} />
                </div>
            )}
        </div>
    );
}
