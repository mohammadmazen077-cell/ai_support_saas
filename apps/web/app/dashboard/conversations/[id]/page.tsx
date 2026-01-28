import { getMessages } from '@/lib/api/messages';
import { getConversation } from '@/lib/api/conversations';
import ChatInterface from '@/components/conversations/chat-interface';

interface PageProps {
    params: Promise<{ id: string }>;
}

export default async function ConversationPage({ params }: PageProps) {
    const { id } = await params;
    const conversation = await getConversation(id);
    const messages = await getMessages(id);

    if (!conversation) {
        return <div>Conversation not found</div>;
    }

    return (
        <div className="flex flex-col h-[calc(100vh-theme(spacing.24))]"> {/* Adjust height for layout padding */}
            <header className="mb-4 pb-4 border-b border-gray-200">
                <h1 className="text-2xl font-bold text-gray-900">{conversation.title || 'Conversation'}</h1>
                <p className="text-sm text-gray-500">ID: {conversation.id}</p>
            </header>

            <ChatInterface conversationId={id} initialMessages={messages || []} />
        </div>
    );
}
