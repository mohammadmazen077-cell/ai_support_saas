'use client';

import { useState, useTransition } from 'react';
import { addTextSource, deleteKnowledgeSource } from './actions';
import { useRouter } from 'next/navigation';

interface Source {
    id: string;
    name: string;
    type: string;
    status: string;
    created_at: string;
    chunks: { count: number }[];
}

export default function KnowledgeBaseClient({ sources }: { sources: Source[] }) {
    const router = useRouter();
    const [isPending, startTransition] = useTransition();
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [formData, setFormData] = useState({ name: '', content: '' });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!formData.name.trim() || !formData.content.trim()) return;

        setIsSubmitting(true);
        try {
            await addTextSource(formData.name, formData.content);
            setFormData({ name: '', content: '' });
            setIsModalOpen(false);
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error('Failed to add source:', error);
            alert('Failed to add knowledge source');
        } finally {
            setIsSubmitting(false);
        }
    };

    const handleDelete = async (sourceId: string) => {
        if (!confirm('Are you sure you want to delete this source?')) return;

        try {
            await deleteKnowledgeSource(sourceId);
            startTransition(() => {
                router.refresh();
            });
        } catch (error) {
            console.error('Failed to delete source:', error);
            alert('Failed to delete source');
        }
    };

    return (
        <div className="space-y-6">
            <header className="flex justify-between items-center">
                <div>
                    <h1 className="text-3xl font-bold text-gray-900">Knowledge Base</h1>
                    <p className="mt-2 text-gray-600">Train your AI on your business data</p>
                </div>
                <button
                    onClick={() => setIsModalOpen(true)}
                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
                >
                    + Add Source
                </button>
            </header>

            {/* Sources List */}
            {sources && sources.length > 0 ? (
                <div className="grid gap-4">
                    {sources.map((source) => {
                        const chunkCount = source.chunks?.[0]?.count || 0;
                        return (
                            <div key={source.id} className="p-6 bg-white rounded-xl border border-gray-200 hover:border-indigo-300 transition-all">
                                <div className="flex justify-between items-start">
                                    <div className="flex-1">
                                        <div className="flex items-center space-x-3 mb-2">
                                            <h3 className="text-lg font-semibold text-gray-900">{source.name}</h3>
                                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium ${source.status === 'ready' ? 'bg-green-100 text-green-800' :
                                                    source.status === 'processing' ? 'bg-yellow-100 text-yellow-800' :
                                                        'bg-red-100 text-red-800'
                                                }`}>
                                                {source.status}
                                            </span>
                                            <span className="text-xs text-gray-500 uppercase">{source.type}</span>
                                        </div>
                                        <div className="text-sm text-gray-500">
                                            {chunkCount} chunks • Added {new Date(source.created_at).toLocaleDateString()}
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => handleDelete(source.id)}
                                        className="text-red-600 hover:text-red-800 text-sm font-medium"
                                    >
                                        Delete
                                    </button>
                                </div>
                            </div>
                        );
                    })}
                </div>
            ) : (
                <div className="bg-white p-12 rounded-xl shadow-sm border border-gray-200 text-center">
                    <h3 className="text-lg font-medium text-gray-500">No knowledge sources yet</h3>
                    <p className="mt-2 text-gray-400">Add your first data source to train the AI</p>
                </div>
            )}

            {/* Add Source Modal */}
            {isModalOpen && (
                <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                        <h2 className="text-2xl font-bold text-gray-900 mb-4">Add Text Source</h2>
                        <form onSubmit={handleSubmit} className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Name
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    placeholder="e.g., Refund Policy"
                                    required
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-2">
                                    Content
                                </label>
                                <textarea
                                    value={formData.content}
                                    onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
                                    rows={10}
                                    placeholder="Paste your documentation, policies, or any text content..."
                                    required
                                />
                            </div>
                            <div className="flex justify-end space-x-3">
                                <button
                                    type="button"
                                    onClick={() => setIsModalOpen(false)}
                                    className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
                                    disabled={isSubmitting}
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={isSubmitting}
                                    className="px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 disabled:opacity-50"
                                >
                                    {isSubmitting ? 'Processing...' : 'Add Source'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}
