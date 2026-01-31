'use client';

import { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { sendHumanReply, updateConversationStatus, setAgentTyping } from '../actions';

const TYPING_DEBOUNCE_MS = 300;

export function ConversationActions({ conversationId }: { conversationId: string }) {
    const router = useRouter();
    const [isPending, setIsPending] = useState(false);
    const [replyContent, setReplyContent] = useState('');
    const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    // Signal "agent is typing" when they focus or type in the reply input (so widget hides "respond shortly" and shows three dots)
    const signalTyping = () => {
        if (typingTimeoutRef.current) {
            clearTimeout(typingTimeoutRef.current);
            typingTimeoutRef.current = null;
        }
        setAgentTyping(conversationId, true);
    };

    const scheduleTypingSignal = () => {
        if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
        typingTimeoutRef.current = setTimeout(signalTyping, TYPING_DEBOUNCE_MS);
    };

    // Clear typing when agent leaves this conversation (unmount)
    useEffect(() => {
        return () => {
            if (typingTimeoutRef.current) {
                clearTimeout(typingTimeoutRef.current);
                typingTimeoutRef.current = null;
            }
            setAgentTyping(conversationId, false);
        };
    }, [conversationId]);

    async function handleReply(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        const content = replyContent.trim();
        if (!content || isPending) return;
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
                        scheduleTypingSignal();
                    }}
                    onFocus={signalTyping}
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
