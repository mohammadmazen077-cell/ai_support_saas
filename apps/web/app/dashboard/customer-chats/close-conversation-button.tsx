'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { updateConversationStatus } from './actions';

type Props = {
    conversationId: string;
};

export function CloseConversationButton({ conversationId }: Props) {
    const router = useRouter();
    const [pending, setPending] = useState(false);
    const [closed, setClosed] = useState(false);

    async function handleClick(e: React.MouseEvent) {
        e.preventDefault();
        e.stopPropagation();
        if (pending || closed) return;
        setPending(true);
        try {
            await updateConversationStatus(conversationId, 'closed');
            setClosed(true);
            router.refresh();
        } catch {
            setPending(false);
        }
    }

    if (closed) return null;

    return (
        <button
            type="button"
            onClick={handleClick}
            disabled={pending}
            className="rounded-lg border border-gray-200 px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-300 disabled:opacity-50 disabled:cursor-not-allowed transition-colors shrink-0"
            title="Mark as closed"
        >
            {pending ? 'Closing...' : 'Mark as Closed'}
        </button>
    );
}
