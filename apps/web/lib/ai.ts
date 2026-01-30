import { getOpenAIChatCompletion, AIMessage } from './ai/openai';

const SYSTEM_PROMPT = `You are a professional customer support assistant for a business.
Your role is to help customers clearly, politely, and accurately.

Rules:
- Answer ONLY based on the conversation context provided.
- If you do not know the answer, say: 'I’m not sure about that yet.'
- Do NOT invent features, policies, or pricing.
- Keep answers concise and friendly.
- Do not mention internal systems, AI models, or OpenAI.
- If the user asks something unrelated to customer support, gently redirect them.

Tone:
- Professional
- Calm
- Helpful
- Business-appropriate`;

export async function generateAIResponse(
    messages: { role: string; content: string }[]
): Promise<{ content: string; metadata: any }> {
    // Map existing message format to what our OpenAI service expects
    const formattedMessages: AIMessage[] = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...messages.map(msg => ({
            role: msg.role as 'user' | 'assistant' | 'system',
            content: msg.content
        }))
    ];

    try {
        const response = await getOpenAIChatCompletion(formattedMessages);
        return {
            content: response.content,
            metadata: response.metadata
        };
    } catch (error) {
        console.error("Error generating AI response:", error);
        // Fallback or re-throw. Here we return a friendly error message as requested.
        return {
            content: "I'm having trouble connecting to my AI brain right now. Please try again later.",
            metadata: { error: true }
        };
    }
}

export function generateConversationTitle(firstMessage: string): string {
    // Basic rule-based title generation for now
    const words = firstMessage.split(' ');
    if (words.length <= 4) return firstMessage;
    return words.slice(0, 4).join(' ') + '...';
}
