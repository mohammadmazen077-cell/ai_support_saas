'use server';

import { revalidatePath } from 'next/cache';
import { createClient } from '@/utils/supabase/server';
import { validateUUID, LIMITS } from '@/lib/validation';

export type ConversationStatus = 'open' | 'waiting_for_human' | 'closed';

/** Signal that the human agent is typing (or stopped). Widget shows three-dot animation and hides "respond shortly". */
export async function setAgentTyping(conversationId: string, isTyping: boolean) {
    validateUUID(conversationId, 'conversationId');
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    await supabase
        .from('customer_conversations')
        .update({
            agent_typing_at: isTyping ? new Date().toISOString() : null,
        })
        .eq('id', conversationId);
}

/** Update conversation status (e.g. mark closed). RLS: only business owner. */
export async function updateConversationStatus(
    conversationId: string,
    status: ConversationStatus
) {
    validateUUID(conversationId, 'conversationId');
    if (!['open', 'waiting_for_human', 'closed'].includes(status)) {
        throw new Error('Invalid status');
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    const { error } = await supabase
        .from('customer_conversations')
        .update({ status, updated_at: new Date().toISOString() })
        .eq('id', conversationId);

    if (error) {
        console.error('Error updating conversation status:', error);
        throw new Error('Failed to update status');
    }
    revalidatePath('/dashboard/customer-chats');
    revalidatePath(`/dashboard/customer-chats/${conversationId}`);
}

/** Send a human reply as the business owner. RLS: only business owner can insert. */
export async function sendHumanReply(conversationId: string, content: string) {
    validateUUID(conversationId, 'conversationId');
    if (typeof content !== 'string' || content.length > LIMITS.MESSAGE_CONTENT_MAX) {
        throw new Error('Invalid message content');
    }

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) throw new Error('Unauthorized');

    if (!content.trim()) return;

    // Clear typing indicator when agent sends (so widget stops showing three dots)
    await supabase
        .from('customer_conversations')
        .update({ agent_typing_at: null, agent_sending_at: null })
        .eq('id', conversationId);

    const { error } = await supabase.from('customer_messages').insert({
        conversation_id: conversationId,
        role: 'assistant',
        content: content.trim(),
        sender: 'human',
    });

    // Ensure typing/sending signals stay cleared even on error
    if (error) {
        await supabase
            .from('customer_conversations')
            .update({ agent_typing_at: null, agent_sending_at: null })
            .eq('id', conversationId);
    }

    if (error) {
        console.error('Error sending human reply:', error);
        throw new Error('Failed to send reply');
    }
    revalidatePath('/dashboard/customer-chats');
    revalidatePath(`/dashboard/customer-chats/${conversationId}`);
}
