import { getConversations } from '@/lib/api/conversations';
import { createConversationAction } from './actions';
import Link from 'next/link';
import ConversationList from '@/components/conversations/conversation-list';

export default async function ConversationsPage() {
    const conversations = await getConversations();

    return (
        <div className="space-y-6">
            <ConversationList conversations={conversations || []} />

            {(!conversations || conversations.length === 0) && (
                <form action={createConversationAction} className="mt-4 flex justify-center">
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                    >
                        Start test
                    </button>
                </form>
            )}
        </div>
    );
}
