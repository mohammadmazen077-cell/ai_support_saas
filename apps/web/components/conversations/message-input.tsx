'use client';

import { useState, useRef } from 'react';
import { addMessageAction } from '@/app/dashboard/conversations/actions';

export default function MessageInput({ conversationId }: { conversationId: string }) {
    const formRef = useRef<HTMLFormElement>(null);
    const [isPending, setIsPending] = useState(false);

    return (
        <form
            ref={formRef}
            action={async (formData) => {
                const content = formData.get('content') as string;
                if (!content.trim()) return;

                setIsPending(true);
                try {
                    await addMessageAction(conversationId, content);
                    formRef.current?.reset();
                } finally {
                    setIsPending(false);
                }
            }}
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
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center min-w-[80px]"
                    disabled={isPending}
                >
                    {isPending ? (
                        <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    ) : (
                        'Send'
                    )}
                </button>
            </div>
        </form>
    );
}
