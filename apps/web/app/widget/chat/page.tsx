'use client';

import { useState, useEffect, useRef } from 'react';
import { useSearchParams } from 'next/navigation';
import { getCustomerMessages, sendCustomerMessage } from '@/app/widget/actions';

interface Message {
    role: 'visitor' | 'assistant';
    content: string;
    created_at?: string;
}

export default function WidgetChatPage() {
    const searchParams = useSearchParams();
    const businessId = searchParams.get('business_id');

    const [messages, setMessages] = useState<Message[]>([]);
    const [inputValue, setInputValue] = useState('');
    const [visitorId, setVisitorId] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isSending, setIsSending] = useState(false);

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

    // Load History
    useEffect(() => {
        async function loadHistory() {
            if (!businessId || !visitorId) return;
            try {
                const history = await getCustomerMessages(businessId, visitorId);
                // Convert DB messages to local format
                const formatted = history.map((msg: any) => ({
                    role: msg.role,
                    content: msg.content,
                    created_at: msg.created_at
                }));
                setMessages(formatted);
            } catch (error) {
                console.error("Failed to load history", error);
            } finally {
                setIsLoading(false);
            }
        }

        loadHistory();
    }, [businessId, visitorId]);

    // Scroll to bottom
    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages, isSending]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!inputValue.trim() || !businessId || !visitorId || isSending) return;

        const content = inputValue.trim();
        setInputValue('');

        // Optimistic Update
        setMessages(prev => [...prev, { role: 'visitor', content }]);
        setIsSending(true);

        try {
            const response = await sendCustomerMessage(businessId, visitorId, content);
            if (response) {
                setMessages(prev => [...prev, { role: 'assistant', content: response }]);
            }
        } catch (error) {
            console.error("Failed to send message", error);
            // Optionally show error to user
        } finally {
            setIsSending(false);
        }
    };

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
                    messages.map((msg, idx) => (
                        <div key={idx} className={`flex ${msg.role === 'visitor' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${msg.role === 'visitor'
                                    ? 'bg-indigo-600 text-white rounded-br-none'
                                    : 'bg-white text-gray-800 border border-gray-100 shadow-sm rounded-bl-none'
                                }`}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {isSending && (
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
