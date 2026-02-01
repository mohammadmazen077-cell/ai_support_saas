import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { ChatInterface } from './chat-interface';
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

            <ChatInterface
                conversationId={id}
                visitorId={(conversation as { visitor_id: string }).visitor_id}
                initialMessages={messages ?? []}
                isClosed={isClosed}
            />
        </div>
    );
}
