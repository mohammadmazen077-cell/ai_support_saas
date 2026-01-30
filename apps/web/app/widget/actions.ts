'use server';

import { createClient } from '@/utils/supabase/server';
import { generateAIResponse } from '@/lib/ai';

export async function getOrCreateCustomerConversation(businessId: string, visitorId: string) {
    const supabase = await createClient();

    // Use the RPC function to securely get/create conversation as anonymous visitor
    const { data, error } = await supabase
        .rpc('get_or_create_customer_conversation', {
            p_business_id: businessId,
            p_visitor_id: visitorId,
        });

    if (error) {
        console.error('Error fetching/creating customer conversation:', error);
        throw new Error('Failed to initialize conversation');
    }

    // RPC returns a set (array), take the first one
    return data && data.length > 0 ? data[0] : null;
}

export async function getCustomerMessages(businessId: string, visitorId: string) {
    const supabase = await createClient();

    const { data, error } = await supabase
        .rpc('get_customer_messages', {
            p_business_id: businessId,
            p_visitor_id: visitorId,
        });

    if (error) {
        console.error('Error fetching customer messages:', error);
        return [];
    }

    return data || [];
}

export async function sendCustomerMessage(businessId: string, visitorId: string, content: string) {
    const supabase = await createClient();

    if (!content.trim()) return;

    // 1. Get Conversation ID (securely)
    const conversation = await getOrCreateCustomerConversation(businessId, visitorId);
    if (!conversation) throw new Error('Conversation not found');

    const conversationId = conversation.id;

    // 2. Insert User Message
    // Public insert is allowed by RLS for 'customer_messages', but let's just use standard insert.
    // We already verified the conversation belongs to this visitor via getOrCreate.
    const { error: insertError } = await supabase
        .from('customer_messages')
        .insert({
            conversation_id: conversationId,
            role: 'visitor',
            content: content
        });

    if (insertError) {
        console.error('Error sending message:', insertError);
        throw new Error('Failed to send message');
    }

    // 3. Generate AI Response
    // We need history for context.
    const history = await getCustomerMessages(businessId, visitorId);

    // Format for AI
    const aiContext = history.map((msg: any) => ({
        role: msg.role === 'visitor' ? 'user' : 'assistant',
        content: msg.content
    }));

    // AI Call with RAG (uses centralized SYSTEM_PROMPT from lib/ai.ts)
    const aiResponse = await generateAIResponse(aiContext, businessId);

    // 4. Insert Assistant Message
    // Since we are anonymous, public RLS allows insert?
    // "Policy: Public/Visitors can INSERT messages into their conversations"
    // Wait, usually the SERVER (us) should insert the assistant message.
    // But we are using the same client (anon).
    // The RLS policy `customer_messages_insert_public` allows insert `with check (true)`.
    // So anyone can insert to any conversation if they know the ID.
    // This is weaker security but acceptable for this demo phase given we don't have service role key.
    // Ideally we'd use a service role key here to insert the assistant message to ensure it's "authorized".
    // For now, it works.

    const { error: aiInsertError } = await supabase
        .from('customer_messages')
        .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse.content
        });

    if (aiInsertError) {
        console.error('Error saving AI response:', aiInsertError);
    }

    return aiResponse.content;
}
