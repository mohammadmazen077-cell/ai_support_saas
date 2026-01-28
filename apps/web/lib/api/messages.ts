import { createClient } from '@/utils/supabase/server';

export async function addMessage(conversationId: string, role: 'user' | 'assistant', content: string, metadata: any = {}) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('messages')
        .insert({
            conversation_id: conversationId,
            role,
            content,
            metadata,
        })
        .select()
        .single();

    if (error) {
        console.error('Error adding message:', error);
        throw error;
    }

    return data;
}

export async function getMessages(conversationId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('messages')
        .select('*')
        .eq('conversation_id', conversationId)
        .order('created_at', { ascending: true });

    if (error) {
        console.error('Error fetching messages:', error);
        throw error;
    }

    return data;
}
