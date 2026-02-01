'use server';

import { createClient } from '@/utils/supabase/server';
import { generateAIResponse } from '@/lib/ai';
import { validateUUID, LIMITS } from '@/lib/validation';

export async function getOrCreateCustomerConversation(businessId: string, visitorId: string) {
    validateUUID(businessId, 'businessId');
    validateUUID(visitorId, 'visitorId');
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
    validateUUID(businessId, 'businessId');
    validateUUID(visitorId, 'visitorId');

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

export type SendMessageResult = {
    content: string | null;
    escalated?: boolean;
    waitingForHuman?: boolean;
};

export async function sendCustomerMessage(
    businessId: string,
    visitorId: string,
    content: string
): Promise<SendMessageResult> {
    validateUUID(businessId, 'businessId');
    validateUUID(visitorId, 'visitorId');
    if (typeof content !== 'string' || content.length > LIMITS.MESSAGE_CONTENT_MAX) {
        throw new Error('Invalid message content');
    }

    const supabase = await createClient();

    if (!content.trim()) return { content: null };

    const conversation = await getOrCreateCustomerConversation(businessId, visitorId);
    if (!conversation) throw new Error('Conversation not found');

    const conversationId = conversation.id;
    const status = (conversation as { status?: string }).status ?? 'open';

    // Insert visitor message via RPC (validates visitor owns conversation)
    const { error: insertError } = await supabase.rpc('insert_visitor_message', {
        p_conversation_id: conversationId,
        p_visitor_id: visitorId,
        p_business_id: businessId,
        p_content: content.trim(),
    });

    if (insertError) {
        console.error('Error sending message:', insertError);
        throw new Error('Failed to send message');
    }

    // While waiting for human, do not call AI; just confirm message received
    if (status === 'waiting_for_human') {
        return { content: null, waitingForHuman: true };
    }

    const history = await getCustomerMessages(businessId, visitorId);
    const aiContext = history.map((msg: { role: string; content: string }) => ({
        role: msg.role === 'visitor' ? 'user' : 'assistant',
        content: msg.content,
    }));

    const aiResponse = await generateAIResponse(aiContext, businessId);

    if (aiResponse.metadata?.needsHandoff) {
        const { error: escalationError } = await supabase.rpc('escalate_customer_conversation', {
            p_conversation_id: conversationId,
            p_visitor_id: visitorId,
            p_business_id: businessId,
        });

        if (!escalationError) {
            // ---------------------------------------------------------
            // EMAIL NOTIFICATION LOGIC
            // ---------------------------------------------------------
            try {
                // 1. Check if email already sent (to avoid duplicates if called multiple times)
                const { data: convData } = await supabase
                    .from('customer_conversations')
                    .select('escalation_notified_at')
                    .eq('id', conversationId)
                    .single();

                if (!convData?.escalation_notified_at) {
                    // 2. Check business settings
                    const { data: settings } = await supabase
                        .from('business_settings')
                        .select('escalation_notifications_enabled')
                        .eq('user_id', businessId)
                        .single();

                    // Default to true if no settings row exists yet
                    const shouldSend = settings ? settings.escalation_notifications_enabled : true;

                    if (shouldSend) {
                        const { data: userData } = await supabase.auth.admin.getUserById(businessId);
                        const email = userData?.user?.email;

                        if (email) {
                            const { sendEscalationEmail } = await import('@/lib/email');
                            await sendEscalationEmail(email, conversationId, visitorId);

                            // 3. Mark as notified
                            await supabase
                                .from('customer_conversations')
                                .update({ escalation_notified_at: new Date().toISOString() })
                                .eq('id', conversationId);
                        }
                    }
                }
            } catch (notifyError) {
                console.error('Failed to process escalation notification:', notifyError);
                // Swallow error to not block the chat
            }
        }
    }

    const { error: aiInsertError } = await supabase
        .from('customer_messages')
        .insert({
            conversation_id: conversationId,
            role: 'assistant',
            content: aiResponse.content,
            sender: 'ai',
        });

    if (aiInsertError) {
        console.error('Error saving AI response:', aiInsertError);
    }

    return {
        content: aiResponse.content,
        escalated: !!aiResponse.metadata?.needsHandoff,
    };
}
