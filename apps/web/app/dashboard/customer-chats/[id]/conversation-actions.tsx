'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/utils/supabase/client';
import { sendHumanReply, updateConversationStatus } from '../actions';

const TYPING_DEBOUNCE_MS = 300;

export function ConversationActions({ conversationId }: { conversationId: string }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
    const supabase = createClient();

    // Signal "agent is typing" via Realtime Broadcast
    const broadcastTyping = async (isTyping: boolean) => {
        const channel = supabase.channel(`conversation:${conversationId}`);
        await channel.subscribe(async (status) => {
            if (status === 'SUBSCRIBED') {
                await channel.send({
                    type: 'broadcast',
                    event: 'agent:typing',
                    payload: { isTyping },
                });
                // We don't need to keep the subscription open just for one-off sends if we want,
                // but usually it's better to keep one connection. 
                // However, for simplicity here, we rely on the fact that if we use the same topic, 
                // Supabase client might reuse the channel or we should manage subscription better.
                // A better pattern for repeated events is to hold the channel in a ref or effect.
            }
        });
    };

    // Better approach: Maintain a persistent channel subscription for the component lifecycle
    useEffect(() => {
        const channel = supabase.channel(`conversation:${conversationId}`);
        channel.subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, [conversationId, supabase]);

    const sendTypingSignal = async (isTyping: boolean) => {
        const channel = supabase.channel(`conversation:${conversationId}`);
        // We assume it's subscribed from the effect, but we can try sending.
        // If "SUBSCRIBED", it sends. If not, it might drop. 
        // For robustness, we check state or await subscribe if needed.
        // Because we subscribe in useEffect, let's just send.
        await channel.send({
            type: 'broadcast',
            event: 'agent:typing',
            payload: { isTyping },
        });
    };

    const handleTyping = (isTyping: boolean) => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }

        if (isTyping) {
            sendTypingSignal(true);
            // Auto-stop after delay if no more keystrokes
            typingTimeoutRef.current = setTimeout(() => {
                sendTypingSignal(false);
            }, 2000);
        } else {
            sendTypingSignal(false);
        }
    };

    // Clear typing when agent leaves this conversation (unmount)
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
            }
            // Attempt to send stop typing signal on unmount
            // Note: This might not always succeed if connection closes immediately
            sendTypingSignal(false);
        };
    }, [conversationId]);

    async function handleReply(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const content = replyContent.trim();
        if (!content || isPending) return;

        // Stop typing indicator immediately
        handleTyping(false);

        setIsPending(true);
        try {
            await sendHumanReply(conversationId, content);
            setReplyContent('');
            router.refresh();
        } finally {
            setIsPending(false);
        }
    }

    async function handleClose() {
        if (isPending) return;
        setIsPending(true);
        try {
            await updateConversationStatus(conversationId, 'closed');
            router.refresh();
        } finally {
            setIsPending(false);
        }
    }

    return (
        <div className="space-y-4">
            <form onSubmit={handleReply} className="flex gap-2">
                <input
                    type="text"
                    value={replyContent}
                    onChange={(e) => {
                        setReplyContent(e.target.value);
                        handleTyping(true);
                    }}
                    onFocus={() => handleTyping(true)}
                    onBlur={() => handleTyping(false)}
                    placeholder="Type your reply as a human agent..."
                    className="flex-1 rounded-lg border border-gray-200 px-3 py-2 text-sm focus:border-indigo-500 focus:ring-1 focus:ring-indigo-500 outline-none"
                    disabled={isPending}
                />
                <button
                    type="submit"
                    disabled={isPending || !replyContent.trim()}
                    className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                    {isPending ? 'Sending...' : 'Send reply'}
                </button>
            </form>
            <div className="flex justify-end">
                <button
                    type="button"
                    onClick={handleClose}
                    disabled={isPending}
                    className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50"
                >
                    Mark conversation closed
                </button>
            </div>
        </div>
    );
}
