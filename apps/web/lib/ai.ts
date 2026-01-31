import { getOpenAIChatCompletion, AIMessage } from './ai/openai';
import { retrieveContext } from './ai/rag';

const BASE_SYSTEM_PROMPT = `You are a professional customer support assistant for a business.
Your role is to help customers clearly, politely, and accurately.

Rules:
- Answer ONLY based on the provided context and conversation history.
- If you do not know the answer or the context doesn't contain the information, say: 'I'm not able to find that information in our documentation.'
- Do NOT invent features, policies, or pricing.
- Keep answers concise and friendly.
- Do not mention internal systems, AI models, or OpenAI.
- Professional
- Calm
- Helpful
- Business-appropriate

Off-Topic Handling Rule:
If the user asks for anything unrelated to customer support (e.g., jokes, poems, general knowledge, personal questions, creative writing), you MUST NOT answer the request.
Instead, respond with a brief, polite redirection explaining that you can only help with customer support–related questions.`;

/** Below this similarity we hand off to human (no/low confidence). */
const HANDOFF_CONFIDENCE_THRESHOLD = 0.6;

export async function generateAIResponse(
    messages: { role: string; content: string }[],
    businessId?: string
): Promise<{ content: string; metadata: { needsHandoff?: boolean; [key: string]: unknown } }> {
    let systemPrompt = BASE_SYSTEM_PROMPT;

    // If businessId is provided, attempt RAG retrieval; may trigger human handoff
    if (businessId && messages.length > 0) {
        const lastUserMessage = [...messages].reverse().find(m => m.role === 'user');

        if (lastUserMessage) {
            const { context, topSimilarity } = await retrieveContext(businessId, lastUserMessage.content);

            const noContext = !context || context.length === 0;
            const lowConfidence = topSimilarity !== null && topSimilarity < HANDOFF_CONFIDENCE_THRESHOLD;

            if (noContext || lowConfidence) {
                return {
                    content: "I'm not confident enough to answer this. I've notified our team to help you.",
                    metadata: { needsHandoff: true },
                };
            }

            if (context) {
                systemPrompt = `${BASE_SYSTEM_PROMPT}

IMPORTANT: Use the following retrieved context to answer the user's question. You MUST ONLY use information from this context. Do not use any external knowledge.

Retrieved Context:
${context}

Remember: If the context does not contain the answer, say you cannot find the information.`;
            }
        }
    }

    // Map existing message format to what our OpenAI service expects
    const formattedMessages: AIMessage[] = [
        { role: 'system', content: systemPrompt },
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
