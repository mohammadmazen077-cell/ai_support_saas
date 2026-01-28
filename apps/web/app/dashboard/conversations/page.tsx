export default function ConversationsPage() {
    return (
        <div className="space-y-6">
            <header>
                <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
                <p className="mt-2 text-gray-600">Manage your AI support conversations here.</p>
            </header>

            <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                <h3 className="text-lg font-medium text-gray-500">No conversations yet</h3>
                <p className="mt-2 text-gray-400">Conversations with your AI agents will appear here.</p>
            </div>
        </div>
    );
}
