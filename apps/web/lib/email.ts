import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);

export async function sendEscalationEmail(to: string, conversationId: string, visitorId: string) {
    if (!process.env.RESEND_API_KEY) {
        console.warn('RESEND_API_KEY is not set. Skipping email.');
        return;
    }

    try {
        const { data, error } = await resend.emails.send({
            from: 'AI Support <onboarding@resend.dev>', // Use verified domain in prod, resend.dev for testing
            to: [to],
            subject: 'New customer needs help',
            html: `
                <div style="font-family: sans-serif; padding: 20px;">
                    <h2>A customer needs your attention</h2>
                    <p>Visitor <strong>${visitorId.slice(0, 8)}...</strong> has requested human support.</p>
                    <p>
                        <a href="${process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000'}/dashboard/customer-chats/${conversationId}" 
                           style="background-color: #4f46e5; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px; display: inline-block;">
                           View Conversation
                        </a>
                    </p>
                    <p style="margin-top: 20px; color: #666; font-size: 12px;">
                        You received this because escalation notifications are enabled for your workspace.
                    </p>
                </div>
            `,
        });

        if (error) {
            console.error('Resend error:', error);
            throw error;
        }

        return data;
    } catch (error) {
        console.error('Failed to send email:', error);
        // Don't rethrow, just log, so we don't break the chat flow
    }
}
