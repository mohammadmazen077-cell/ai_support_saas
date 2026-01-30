'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createConversation, updateConversationTitle } from '@/lib/api/conversations';
import { addMessage, getMessages } from '@/lib/api/messages';
import { generateAIResponse, generateConversationTitle } from '@/lib/ai';

export async function createConversationAction() {
    try {
        const conversation = await createConversation();
        revalidatePath('/dashboard/conversations');
        redirect(`/dashboard/conversations/${conversation.id}`);
    } catch (error) {
        if (error instanceof Error && error.message === 'NEXT_REDIRECT') {
            throw error;
        }
        console.error('Failed to create conversation:', error);
        // In a real app, you might return an error state to display to the user
    }
}

export async function addMessageAction(conversationId: string, content: string) {
    try {
        if (!content.trim()) return;

        // 1. Fetch History (need checks if it's the first message)
        const history = await getMessages(conversationId);
        const isFirstMessage = history.length === 0;

        // 2. Save User Message
        await addMessage(conversationId, 'user', content);

        // 3. Auto-Title if first message
        if (isFirstMessage) {
            const newTitle = generateConversationTitle(content);
            await updateConversationTitle(conversationId, newTitle);
            // Note: we'll revalidate path at the end, which updates the sidebar
        }

        // 4. Generate AI Response
        // Construct full history for context
        const fullContext = [...history.map(m => ({ role: m.role, content: m.content })), { role: 'user', content }];

        // Get the current user for RAG context
        const { createClient } = await import('@/utils/supabase/server');
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        const aiResponse = await generateAIResponse(fullContext, user?.id);

        // 5. Save AI Message
        await addMessage(conversationId, 'assistant', aiResponse.content, aiResponse.metadata);

        revalidatePath(`/dashboard/conversations/${conversationId}`);
        revalidatePath('/dashboard/conversations'); // Update list title
    } catch (error) {
        console.error('Failed to send message:', error);
        // Handle error
    }
}

export async function deleteConversationsAction(ids: string[]) {
    try {
        if (!ids || ids.length === 0) return;

        // In a real app we might want to parallelize these or use a 'in' query if the API supports it
        // Supabase 'in' query would be better: .in('id', ids)
        // But for now let's reuse the single delete or loop, assuming our API layer handles single deletes.
        // Actually, let's just loop for simplicity with the existing/new API.

        // Better yet, let's import the deleteConversation function we just added
        const { deleteConversation } = await import('@/lib/api/conversations');

        await Promise.all(ids.map(id => deleteConversation(id)));

        revalidatePath('/dashboard/conversations');
    } catch (error) {
        console.error('Failed to delete conversations:', error);
        throw error;
    }
}
