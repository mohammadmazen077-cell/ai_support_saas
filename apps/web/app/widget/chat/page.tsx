'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getOrCreateCustomerConversation, getCustomerMessages, sendCustomerMessage } from '@/app/widget/actions';

interface Message {
    role: 'visitor' | 'assistant';
    content: string;
    created_at?: string;
    sender?: 'ai' | 'human';
}

type ConversationStatus = 'open' | 'waiting_for_human' | 'closed';

export default function WidgetChatPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('business_id');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [conversationStatus, setConversationStatus] = useState<ConversationStatus>('open');
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);
    const [agentTyping, setAgentTyping] = useState(false);

    const messagesEndRef = useRef<HTMLDivElement>(null);

    // Initialize Visitor ID
    useEffect(() => {
        if (typeof window !== 'undefined') {
            let storedId = localStorage.getItem('saas_support_visitor_id');
            if (!storedId) {
                storedId = crypto.randomUUID();
                localStorage.setItem('saas_support_visitor_id', storedId);
            }
            setVisitorId(storedId);
        }
    }, []);

    // Load conversation + messages (to get status for handoff UI)
    useEffect(() => {
        async function load() {
            if (!businessId || !visitorId) return;
            try {
                const [conv, history] = await Promise.all([
                    getOrCreateCustomerConversation(businessId, visitorId),
                    getCustomerMessages(businessId, visitorId),
                ]);
                const formatted = history.map((msg: { role: string; content: string; created_at?: string; sender?: string }) => ({
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at,
                    sender: msg.sender === 'human' ? 'human' : 'ai',
                }));
                setMessages(formatted);
                // If human has already replied, treat as open (hide "human will respond shortly")
                const hasHumanReply = formatted.some((m: { sender?: string }) => m.sender === 'human');
                // Only leave waiting_for_human when a human actually sent a message; never based on status alone
                setConversationStatus((prev) =>
                    hasHumanReply ? 'open' : prev === 'waiting_for_human' ? 'waiting_for_human' : ((conv as { status?: ConversationStatus })?.status ?? 'open')
                );
            } catch (error) {
                console.error('Failed to load', error);
            } finally {
                setIsLoading(false);
            }
        }
        load();
    }, [businessId, visitorId]);

    // Refetch messages when tab/window gains focus so human replies appear without full refresh
    useEffect(() => {
        if (!businessId || !visitorId) return;
        const refetch = async () => {
            try {
                const [conv, history] = await Promise.all([
                    getOrCreateCustomerConversation(businessId, visitorId),
                    getCustomerMessages(businessId, visitorId),
                ]);
                const formatted = history.map((msg: { role: string; content: string; created_at?: string; sender?: string }) => ({
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at,
                    sender: msg.sender === 'human' ? 'human' : 'ai',
                }));
                setMessages(formatted);
                const hasHumanReply = formatted.some((m: { sender?: string }) => m.sender === 'human');
                // Only leave waiting_for_human when a human actually sent a message; never based on status alone
                setConversationStatus((prev) =>
                    hasHumanReply ? 'open' : prev === 'waiting_for_human' ? 'waiting_for_human' : ((conv as { status?: ConversationStatus })?.status ?? 'open')
                );
                if (hasHumanReply) setAgentTyping(false);
            } catch {
                // ignore
            }
        };
        const onFocus = () => refetch();
        const onVisibility = () => {
            if (document.visibilityState === 'visible') refetch();
        };
        window.addEventListener('focus', onFocus);
        document.addEventListener('visibilitychange', onVisibility);
        return () => {
            window.removeEventListener('focus', onFocus);
            document.removeEventListener('visibilitychange', onVisibility);
        };
    }, [businessId, visitorId]);

    const prevHumanCountRef = useRef(0);
    useEffect(() => {
        if (conversationStatus === 'waiting_for_human') {
            prevHumanCountRef.current = messages.filter((m) => m.sender === 'human').length;
        }
    }, [conversationStatus]);

    // When waiting for human, poll frequently for agent_sending_at (typing) and new messages
    useEffect(() => {
        if (!businessId || !visitorId || conversationStatus !== 'waiting_for_human') return;
        const interval = setInterval(async () => {
            try {
                const [conv, history] = await Promise.all([
                    getOrCreateCustomerConversation(businessId, visitorId),
                    getCustomerMessages(businessId, visitorId),
                ]);
                const formatted = history.map((msg: { role: string; content: string; created_at?: string; sender?: string }) => ({
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at,
                    sender: msg.sender === 'human' ? 'human' : 'ai',
                }));
                const agentTypingAt = (conv as { agent_typing_at?: string | null })?.agent_typing_at;
                const agentSendingAt = (conv as { agent_sending_at?: string | null })?.agent_sending_at;
                const hasHumanReply = formatted.some((m: { sender?: string }) => m.sender === 'human');
                prevHumanCountRef.current = formatted.filter((m: { sender?: string }) => m.sender === 'human').length;

                // Show three-dot typing when agent is typing in reply input or briefly while sending
                if (agentTypingAt || agentSendingAt) setAgentTyping(true);
                else setAgentTyping(false);

                if (hasHumanReply) {
                    setMessages(formatted);
                    setConversationStatus('open');
                    setAgentTyping(false);
                }
            } catch {
                // ignore
            }
        }, 500);
        return () => clearInterval(interval);
    }, [businessId, visitorId, conversationStatus]);

    // Scroll to bottom when messages change, sending, or agent typing
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending, agentTyping]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !businessId || !visitorId || isSending) return;

        const content = inputValue.trim();
        setInputValue('');

        setMessages((prev) => [...prev, { role: 'visitor', content }]);
        setIsSending(true);

        try {
            const result = await sendCustomerMessage(businessId, visitorId, content);

            if (result.escalated) {
                setConversationStatus('waiting_for_human');
                if (result.content) {
                    setMessages((prev) => [...prev, { role: 'assistant', content: result.content!, sender: 'ai' }]);
                }
            } else if (result.waitingForHuman) {
                setConversationStatus('waiting_for_human');
            } else if (result.content) {
                setMessages((prev) => [...prev, { role: 'assistant', content: result.content!, sender: 'ai' }]);
            }
        } catch (error) {
            console.error('Failed to send message', error);
        } finally {
            setIsSending(false);
        }
    };

    const isWaitingForHuman = conversationStatus === 'waiting_for_human';

    if (!businessId) {
        return <div className="p-4 text-center text-red-500">Missing Business Configuration</div>;
    }

    if (isLoading) {
        return <div className="flex items-center justify-center h-screen bg-white"><div className="w-6 h-6 border-2 border-indigo-600 border-t-transparent rounded-full animate-spin"></div></div>;
    }

    return (
        <div className="flex flex-col h-screen bg-white">
            {/* Header */}
            <header className="p-4 bg-indigo-600 text-white shadow-sm flex-none">
                <h1 className="font-semibold text-lg">Customer Support</h1>
                <p className="text-xs text-indigo-100 opacity-90">We typically reply in a few seconds</p>
            </header>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-gray-50">
                {messages.length === 0 ? (
                    <div className="text-center text-gray-400 mt-8 text-sm">
                        <p>👋 Hi there! How can we help you today?</p>
                    </div>
                ) : (
                    messages.map((msg, idx) => {
                        const isVisitor = msg.role === 'visitor';
                        const label = isVisitor ? 'You' : msg.sender === 'human' ? 'Support Agent' : 'AI Support';
                        return (
                            <div key={idx} className={`flex ${isVisitor ? 'justify-end' : 'justify-start'}`}>
                                <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${isVisitor
                                        ? 'bg-indigo-600 text-white rounded-br-none'
                                        : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-none'
                                    }`}>
                                    {!isVisitor && (
                                        <span className="block text-xs font-medium text-gray-500 mb-1">{label}</span>
                                    )}
                                    {msg.content}
                                </div>
                            </div>
                        );
                    })
                )}
                {isWaitingForHuman && !agentTyping && (
                    <div className="flex justify-center">
                        <div className="rounded-2xl px-4 py-2.5 text-sm bg-amber-50 text-amber-800 border border-amber-200">
                            A human support agent will respond shortly.
                        </div>
                    </div>
                )}
                {agentTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1 items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                        </div>
                    </div>
                )}
                {isSending && !agentTyping && (
                    <div className="flex justify-start">
                        <div className="bg-white border border-gray-100 shadow-sm rounded-2xl rounded-bl-none px-4 py-3 flex space-x-1 items-center">
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:150ms]"></div>
                            <div className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce [animation-delay:300ms]"></div>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-3 bg-white border-t border-gray-100 flex-none">
                <form onSubmit={handleSubmit} className="flex gap-2">
                    <input
                        type="text"
                        value={inputValue}
                        onChange={(e) => setInputValue(e.target.value)}
                        placeholder="Type a message..."
                        className="flex-1 rounded-full border-gray-200 bg-gray-50 px-4 py-2 text-sm focus:border-indigo-500 focus:ring-indigo-500 focus:bg-white transition-all outline-none"
                    />
                    <button
                        type="submit"
                        disabled={!inputValue.trim() || isSending}
                        title={isWaitingForHuman ? 'An agent will reply; you can still send messages.' : undefined}
                        className="bg-indigo-600 text-white p-2 rounded-full hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                    >
                        <svg className="w-5 h-5 translate-x-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
                        </svg>
                    </button>
                </form>
                <div className="text-center mt-2">
                    <span className="text-[10px] text-gray-300">Powered by AI Support</span>
                </div>
            </div>
        </div>
    );
}
