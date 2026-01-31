import OpenAI from 'openai';

// Initialize OpenAI client
const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

export interface AIMessage {
    role: 'system' | 'user' | 'assistant';
    content: string;
}

export async function getOpenAIChatCompletion(messages: AIMessage[]) {
    try {
        const response = await openai.chat.completions.create({
            model: 'gpt-4o-mini',
            messages: messages,
            max_tokens: 500, // Reasonable default limit
            temperature: 0.7,
        });

        // Extract the content
        const content = response.choices[0]?.message?.content || "I'm sorry, I couldn't generate a response.";

        // Extract usage metadata
        const metadata = {
            model: response.model,
            tokens_used: response.usage?.total_tokens || 0,
            completion_tokens: response.usage?.completion_tokens || 0,
            prompt_tokens: response.usage?.prompt_tokens || 0,
        };

        return {
            content,
            metadata
        };
    } catch (error) {
        console.error("OpenAI API Error:", error);
        throw new Error("Failed to get response from AI service");
    }
}
