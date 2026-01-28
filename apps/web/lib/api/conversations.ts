import { createClient } from '@/utils/supabase/server';

export async function createConversation(title: string = 'New Conversation') {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        throw new Error('User not authenticated');
    }

    const { data, error } = await supabase
        .from('conversations')
        .insert({
            user_id: user.id,
            title,
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating conversation:', error);
        throw error;
    }

    return data;
}

export async function getConversations() {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .order('updated_at', { ascending: false }); // Sort by recently active

    if (error) {
        console.error('Error fetching conversations:', error);
        throw error;
    }

    return data;
}

export async function getConversation(id: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .from('conversations')
        .select('*')
        .eq('id', id)
        .single();

    if (error) {
        console.error('Error fetching conversation:', error);
        throw error;
    }

    return data;
}

export async function updateConversationTitle(id: string, title: string) {
    const supabase = await createClient();

    const { error } = await supabase
        .from('conversations')
        .update({ title, updated_at: new Date().toISOString() })
        .eq('id', id);

    if (error) {
        console.error('Error updating conversation title:', error);
        throw error;
    }
}
