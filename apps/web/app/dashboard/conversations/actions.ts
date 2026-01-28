'use server';

import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { createConversation } from '@/lib/api/conversations';
import { addMessage } from '@/lib/api/messages';
import { generateAIResponse } from '@/lib/ai';

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

        // 1. Save User Message
        await addMessage(conversationId, 'user', content);

        // 2. Generate AI Response
        // In a real app, you'd fetch previous context here
        const aiResponse = await generateAIResponse([{ role: 'user', content }]);

        // 3. Save AI Message
        await addMessage(conversationId, 'assistant', aiResponse.content, aiResponse.metadata);

        revalidatePath(`/dashboard/conversations/${conversationId}`);
    } catch (error) {
        console.error('Failed to send message:', error);
        // Handle error
    }
}
