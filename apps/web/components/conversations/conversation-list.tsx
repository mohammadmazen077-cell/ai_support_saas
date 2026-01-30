'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { deleteConversationsAction } from '@/app/dashboard/conversations/actions';

interface Conversation {
    id: string;
    title: string;
    updated_at: string;
}

export default function ConversationList({ conversations }: { conversations: Conversation[] }) {
    const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
    const [isSelectionMode, setIsSelectionMode] = useState(false);
    const [isDeleting, setIsDeleting] = useState(false);
    const [showConfirm, setShowConfirm] = useState(false);
    const router = useRouter();

    const enterSelectionMode = () => {
        setIsSelectionMode(true);
        setSelectedIds(new Set());
    };

    const exitSelectionMode = () => {
        setIsSelectionMode(false);
        setSelectedIds(new Set());
    };

    const toggleSelection = (id: string) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }

        if (newSelected.size === 0) {
            exitSelectionMode();
        } else {
            setSelectedIds(newSelected);
        }
    };

    const handleSelectAll = () => {
        if (selectedIds.size === conversations.length) {
            // If all are selected, unselect all implies exiting mode
            exitSelectionMode();
        } else {
            const allIds = new Set(conversations.map(c => c.id));
            setSelectedIds(allIds);
        }
    };

    const handleDelete = async () => {
        if (selectedIds.size === 0) return;
        setIsDeleting(true);
        try {
            await deleteConversationsAction(Array.from(selectedIds));
            exitSelectionMode();
            setShowConfirm(false);
            router.refresh();
        } catch (error) {
            console.error('Failed to delete conversations', error);
            alert('Failed to delete conversations. Please try again.');
        } finally {
            setIsDeleting(false);
        }
    };

    return (
        <div className="space-y-6">
            {/* Dynamic Header */}
            <div className="flex items-center justify-between h-14">
                {isSelectionMode ? (
                    // Selection Header
                    <>
                        <div className="flex items-center space-x-4">
                            <span className="text-lg font-medium text-gray-900">
                                {selectedIds.size} selected
                            </span>
                        </div>
                        <div className="flex items-center space-x-3">
                            <button
                                onClick={handleSelectAll}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                {selectedIds.size === conversations.length ? 'Unselect all' : 'Select all'}
                            </button>
                            <button
                                onClick={exitSelectionMode}
                                className="px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-100 rounded-md transition-colors"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={() => setShowConfirm(true)}
                                disabled={isDeleting}
                                className="px-3 py-1.5 text-sm font-medium text-red-600 bg-red-50 hover:bg-red-100 rounded-md transition-colors disabled:opacity-50 flex items-center"
                            >
                                <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                                Delete
                            </button>
                        </div>
                    </>
                ) : (
                    // Default Header
                    <>
                        <div>
                            <h1 className="text-3xl font-bold text-gray-900">Conversations</h1>
                            <p className="mt-1 text-gray-600">Manage your AI support conversations.</p>
                        </div>
                        <div className="flex items-center space-x-3">
                            {conversations.length > 0 && (
                                <button
                                    onClick={enterSelectionMode}
                                    className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-lg hover:bg-gray-50 transition-colors shadow-sm"
                                >
                                    Select
                                </button>
                            )}
                            <Link
                                href="/dashboard/conversations/new" // Ideally this is a server action form but for styling consistency utilizing link style or keeping form
                                className="hidden" // Hiding this specific link as we use the form below usually
                            />
                            {/* We usually have a form to create valid conversation actions, keeping pure UI here. Pass in a prop or slot if needed, but for now we'll rely on the page context or just render the button that triggers the action if passed. 
                                Actually, the original page had the Create button. We should include it here to fully replace the header.
                                However, we can't easily import the server action 'createConversationAction' directly into a Client Component to pass to a form action without it being a prop or imported. 
                                Since we are importing 'deleteConversationsAction', we can import 'createConversationAction' too? 
                                Next.js allows importing Server Actions in Client Components.
                            */}
                            <form action={async () => {
                                // We need to import the action. It wasn't imported in original file. 
                                // Let's assume we will add the import or just ask the user to fix if missing. 
                                // Actually better to keep the Create button separate or import it.
                                // For now, let's just put the button UI and we will likely need to Add the import.
                                const { createConversationAction } = await import('@/app/dashboard/conversations/actions');
                                await createConversationAction();
                            }}>
                                <button
                                    type="submit"
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors font-medium shadow-sm"
                                >
                                    New Conversation
                                </button>
                            </form>
                        </div>
                    </>
                )}
            </div>

            {/* List */}
            {conversations && conversations.length > 0 ? (
                <div className="grid gap-4">
                    {conversations.map((conv) => (
                        <div key={conv.id} className={`group relative flex items-center p-4 bg-white rounded-xl border transition-all ${selectedIds.has(conv.id) ? 'border-indigo-400 bg-indigo-50 shadow-md' : 'border-gray-200 hover:border-indigo-300 hover:shadow-sm'}`}>

                            {/* Checkbox - Only visible in selection mode */}
                            {isSelectionMode && (
                                <div className="mr-4 flex h-6 items-center animate-in fade-in slide-in-from-left-2 duration-200">
                                    <input
                                        type="checkbox"
                                        checked={selectedIds.has(conv.id)}
                                        onChange={() => toggleSelection(conv.id)}
                                        className="h-5 w-5 rounded border-gray-300 text-indigo-600 focus:ring-indigo-600 cursor-pointer"
                                    />
                                </div>
                            )}

                            <Link
                                href={isSelectionMode ? '#' : `/dashboard/conversations/${conv.id}`}
                                onClick={(e) => {
                                    if (isSelectionMode) {
                                        e.preventDefault();
                                        toggleSelection(conv.id);
                                    }
                                }}
                                className={`flex-1 min-w-0 block ${isSelectionMode ? 'cursor-default' : 'cursor-pointer'}`}
                            >
                                <div className="flex justify-between items-center mb-1">
                                    <h3 className="text-lg font-medium text-gray-900 truncate pr-4">
                                        {conv.title || 'Untitled Conversation'}
                                    </h3>
                                    <span className="text-xs text-gray-500 whitespace-nowrap">
                                        {new Date(conv.updated_at).toLocaleDateString()}
                                    </span>
                                </div>
                                <p className="text-sm text-gray-500 truncate font-mono text-xs opacity-70">
                                    ID: {conv.id}
                                </p>
                            </Link>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-lg font-medium text-gray-500">No conversations yet</h3>
                    <p className="mt-2 text-gray-400">Start a new conversation to get help.</p>
                </div>
            )}

            {/* Confirmation Modal */}
            {showConfirm && (
                <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
                    <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl animate-in fade-in zoom-in duration-200">
                        <h3 className="text-lg font-semibold text-gray-900 mb-2">Delete Conversation?</h3>
                        <p className="text-gray-600 mb-6">
                            Are you sure you want to delete {selectedIds.size} conversation{selectedIds.size > 1 ? 's' : ''}? This action cannot be undone.
                        </p>
                        <div className="flex justify-end space-x-3">
                            <button
                                onClick={() => setShowConfirm(false)}
                                disabled={isDeleting}
                                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 font-medium"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleDelete}
                                disabled={isDeleting}
                                className="px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700 font-medium disabled:opacity-50"
                            >
                                {isDeleting ? 'Deleting...' : 'Delete'}
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
