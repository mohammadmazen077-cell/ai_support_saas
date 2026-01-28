import { getMessages } from '@/lib/api/messages';
import { getConversation } from '@/lib/api/conversations';
import MessageInput from '@/components/conversations/message-input';

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

            <div className="flex-1 overflow-y-auto space-y-4 p-4 bg-gray-50 rounded-lg mb-4 border border-gray-200">
                {messages && messages.length > 0 ? (
                    messages.map((message) => (
                        <div
                            key={message.id}
                            className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-[80%] rounded-lg p-4 ${message.role === 'user'
                                    ? 'bg-indigo-600 text-white'
                                    : 'bg-white border border-gray-200 text-gray-800'
                                    }`}
                            >
                                <div className="text-xs opacity-70 mb-1 capitalize">{message.role}</div>
                                <p className="whitespace-pre-wrap">{message.content}</p>
                                <div className="text-xs opacity-50 mt-2 text-right">
                                    {new Date(message.created_at).toLocaleTimeString()}
                                </div>
                            </div>
                        </div>
                    ))
                ) : (
                    <div className="flex h-full items-center justify-center text-gray-400">
                        <p>No messages yet. Start the conversation!</p>
                    </div>
                )}
            </div>

            <MessageInput conversationId={id} />
        </div>
    );
}
