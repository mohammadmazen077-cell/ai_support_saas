import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';
import { CloseConversationButton } from './close-conversation-button';
import { ListWatcher } from './list-watcher';

type StatusFilter = 'all' | 'needs_attention';

export default async function CustomerChatsPage({
    searchParams,
}: {
    searchParams: Promise<{ filter?: string }>;
}) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in</div>;
    }

    const { filter } = await searchParams;
    const statusFilter: StatusFilter = filter === 'needs_attention' ? 'needs_attention' : 'all';

    let query = supabase
        .from('customer_conversations')
        .select(`
            *,
            messages:customer_messages(content, created_at, role, sender)
        `)
        .order('updated_at', { ascending: false });

    if (statusFilter === 'needs_attention') {
        query = query.eq('status', 'waiting_for_human');
    }

    const { data: conversations, error } = await query;

    if (error) {
        console.error('Error fetching customer chats:', error);
        return <div>Error loading chats</div>;
    }

    const needsAttentionCount =
        statusFilter === 'all'
            ? conversations?.filter((c: { status?: string }) => c.status === 'waiting_for_human').length ?? 0
            : conversations?.length ?? 0;

    return (
        <div className="space-y-6">
            <header className="flex flex-wrap items-center justify-between gap-4">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Customer Chats</h1>
                    <p className="mt-2 text-gray-600">Real conversations from your website visitors.</p>
                </div>
                <div className="flex items-center gap-2">
                    <Link
                        href="/dashboard/customer-chats"
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors ${statusFilter === 'all' ? 'bg-gray-200 text-gray-800' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                    >
                        All
                    </Link>
                    <Link
                        href="/dashboard/customer-chats?filter=needs_attention"
                        className={`rounded-lg px-3 py-1.5 text-sm font-medium transition-colors flex items-center gap-1.5 ${statusFilter === 'needs_attention' ? 'bg-amber-200 text-amber-900' : 'bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
                    >
                        Needs Attention
                        {needsAttentionCount > 0 && (
                            <span className="rounded-full bg-amber-200 px-1.5 py-0.5 text-xs font-semibold">
                                {statusFilter === 'all' ? needsAttentionCount : conversations?.length ?? 0}
                            </span>
                        )}
                    </Link>
                </div>
            </header>

            {conversations && conversations.length > 0 ? (
                <div className="grid gap-4">
                    {conversations.map((conv: { id: string; visitor_id: string; updated_at: string; status?: string; escalated_at?: string; messages?: { content: string; role: string; created_at: string }[] }) => {
                        const lastMessage = conv.messages && conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1]
                            : null;
                        const isWaiting = conv.status === 'waiting_for_human';

                        return (
                            <Link
                                key={conv.id}
                                href={`/dashboard/customer-chats/${conv.id}`}
                                className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all"
                            >
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-2 flex-wrap">
                                        {isWaiting && (
                                            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800">
                                                Needs Attention
                                            </span>
                                        )}
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Visitor
                                        </span>
                                        <span className="text-sm text-gray-500 font-mono text-xs">
                                            {conv.visitor_id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex items-center gap-3 shrink-0">
                                        {statusFilter === 'needs_attention' && isWaiting && (
                                            <CloseConversationButton conversationId={conv.id} />
                                        )}
                                        <span className="text-sm text-gray-500">
                                            {new Date(conv.updated_at).toLocaleString()}
                                        </span>
                                    </div>
                                </div>

                                <div className="text-gray-900 font-medium truncate">
                                    {lastMessage ? lastMessage.content : 'No messages'}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transcript Preview</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
                                        {conv.messages?.slice(-3).map((msg: { role: string; content: string; sender?: string }, i: number) => {
                                            const label = msg.role === 'visitor' ? 'Visitor' : msg.sender === 'human' ? 'Support Agent' : 'AI Support';
                                            return (
                                                <div key={i} className={`flex ${msg.role === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                                                    <span className={`px-2 py-1 rounded ${msg.role === 'visitor' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-50 text-indigo-800'}`}>
                                                        {label}: {msg.content}
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            </Link>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-lg font-medium text-gray-500">
                        {statusFilter === 'needs_attention' ? 'No conversations need attention' : 'No customer chats yet'}
                    </h3>
                    <p className="mt-2 text-gray-400">
                        {statusFilter === 'needs_attention' ? 'Switch to All to see other chats.' : 'Embed the widget on your site to start receiving messages.'}
                    </p>
                </div>
            )}
            <ListWatcher />
        </div>
    );
}
