import { getConversations } from '@/lib/api/conversations';
import { createConversationAction } from './actions';
import Link from 'next/link';

export default async function ConversationsPage() {
    const conversations = await getConversations();

    return (
        <div className="space-y-6">
            <header className="flex items-center justify-between">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
                    <p className="mt-2 text-gray-600">Manage your AI support conversations.</p>
                </div>
                <form action={createConversationAction}>
                    <button
                        type="submit"
                        className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                    >
                        New Conversation
                    </button>
                </form>
            </header>

            {conversations && conversations.length > 0 ? (
                <div className="grid gap-4">
                    {conversations.map((conv) => (
                        <Link
                            key={conv.id}
                            href={`/dashboard/conversations/${conv.id}`}
                            className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                        >
                            <div className="flex justify-between items-center">
                                <h3 className="text-lg font-medium text-gray-900 truncate">
                                    {conv.title || 'Untitled Conversation'}
                                </h3>
                                <span className="text-sm text-gray-500">
                                    {new Date(conv.updated_at).toLocaleDateString()}
                                </span>
                            </div>
                            <p className="mt-1 text-sm text-gray-500 truncate">
                                ID: {conv.id}
                            </p>
                        </Link>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-lg font-medium text-gray-500">No conversations yet</h3>
                    <p className="mt-2 text-gray-400">Start a new conversation to get help.</p>
                    <form action={createConversationAction} className="mt-4">
                        <button
                            type="submit"
                            className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                        >
                            Start Conversation
                        </button>
                    </form>
                </div>
            )}
        </div>
    );
}
