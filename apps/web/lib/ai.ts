import { getOpenAIChatCompletion, AIMessage } from './ai/openai';

export async function generateAIResponse(
    messages: { role: string; content: string }[]
): Promise<{ content: string; metadata: any }> {
    // Map existing message format to what our OpenAI service expects
    const formattedMessages: AIMessage[] = messages.map(msg => ({
        role: msg.role as 'user' | 'assistant' | 'system',
        content: msg.content
    }));

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
