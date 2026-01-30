import { createClient } from '@/utils/supabase/server';
import Link from 'next/link';

export default async function CustomerChatsPage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in</div>;
    }

    const { data: conversations, error } = await supabase
        .from('customer_conversations')
        .select(`
            *,
            messages:customer_messages(content, created_at, role)
        `)
        .order('updated_at', { ascending: false });

    if (error) {
        console.error('Error fetching customer chats:', error);
        return <div>Error loading chats</div>;
    }

    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Customer Chats</h1>
                <p className="mt-2 text-gray-600">Real conversations from your website visitors.</p>
            </header>

            {conversations && conversations.length > 0 ? (
                <div className="grid gap-4">
                    {conversations.map((conv) => {
                        const lastMessage = conv.messages && conv.messages.length > 0
                            ? conv.messages[conv.messages.length - 1]
                            : null;

                        return (
                            <div key={conv.id} className="block p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 hover:shadow-md transition-all">
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center space-x-2">
                                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                                            Visitor
                                        </span>
                                        <span className="text-sm text-gray-500 font-mono text-xs">
                                            {conv.visitor_id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <span className="text-sm text-gray-500">
                                        {new Date(conv.updated_at).toLocaleString()}
                                    </span>
                                </div>

                                <div className="text-gray-900 font-medium truncate">
                                    {lastMessage ? lastMessage.content : 'No messages'}
                                </div>
                                <div className="mt-4 pt-4 border-t border-gray-100">
                                    <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Transcript Preview</h4>
                                    <div className="space-y-2 max-h-40 overflow-y-auto text-sm">
                                        {conv.messages?.slice(-3).map((msg: any, i: number) => (
                                            <div key={i} className={`flex ${msg.role === 'visitor' ? 'justify-start' : 'justify-end'}`}>
                                                <span className={`px-2 py-1 rounded ${msg.role === 'visitor' ? 'bg-gray-100 text-gray-800' : 'bg-indigo-50 text-indigo-800'}`}>
                                                    {msg.role === 'visitor' ? 'User: ' : 'AI: '} {msg.content}
                                                </span>
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-lg font-medium text-gray-500">No customer chats yet</h3>
                    <p className="mt-2 text-gray-400">Embed the widget on your site to start receiving messages.</p>
                </div>
            )}
        </div>
    );
}
