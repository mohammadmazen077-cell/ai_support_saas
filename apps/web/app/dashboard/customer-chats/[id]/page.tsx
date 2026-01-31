import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ConversationActions } from './conversation-actions';

export default async function CustomerConversationPage({
    params,
}: {
    params: Promise<{ id: string }>;
}) {
    const { id } = await params;
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in</div>;
    }

    const { data: conversation, error } = await supabase
        .from('customer_conversations')
        .select('*')
        .eq('id', id)
        .single();

    if (error || !conversation) {
        notFound();
    }

    const { data: messages } = await supabase
        .from('customer_messages')
        .select('id, role, content, created_at, sender')
        .eq('conversation_id', id)
        .order('created_at', { ascending: true });

    const status = (conversation as { status?: string }).status ?? 'open';
    const isWaiting = status === 'waiting_for_human';
    const isClosed = status === 'closed';

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-3">
                    <Link
                        href="/dashboard/customer-chats"
                        className="text-gray-500 hover:text-gray-700 text-sm font-medium"
                    >
                        ← Back to chats
                    </Link>
                    <span className="text-gray-400">|</span>
                    <span className="text-sm text-gray-600 font-mono">
                        Visitor {String((conversation as { visitor_id: string }).visitor_id).slice(0, 8)}...
                    </span>
                    {isWaiting && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                            Needs Attention
                        </span>
                    )}
                    {isClosed && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-700">
                            Closed
                        </span>
                    )}
                </div>
            </header>

            <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                <div className="p-4 border-b border-gray-100 bg-gray-50">
                    <h2 className="font-semibold text-gray-900">Messages</h2>
                </div>
                <div className="p-4 space-y-4 max-h-[50vh] overflow-y-auto">
                    {(messages ?? []).length === 0 ? (
                        <p className="text-sm text-gray-500">No messages yet.</p>
                    ) : (
                        (messages ?? []).map((msg: { id: string; role: string; content: string; created_at: string; sender?: string }) => {
                            const isVisitor = msg.role === 'visitor';
                            const supportLabel = msg.sender === 'human' ? 'Support Agent' : 'AI Support';
                            return (
                                <div
                                    key={msg.id}
                                    className={`flex ${isVisitor ? 'justify-start' : 'justify-end'}`}
                                >
                                    <div
                                        className={`max-w-[85%] rounded-lg px-3 py-2 text-sm ${
                                            isVisitor
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
                </div>

                {!isClosed && (
                    <div className="p-4 border-t border-gray-100 bg-gray-50">
                        <ConversationActions conversationId={id} />
                    </div>
                )}
            </div>
        </div>
    );
}
