export async function generateAIResponse(
    messages: { role: string; content: string }[]
): Promise<{ content: string; metadata: any }> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lastMessage = messages[messages.length - 1];

    // Basic simulation logic
    return {
        content: `I received your message: "${lastMessage.content}". This is a simulated AI response.`,
        metadata: {
            model: 'simulated-gpt-4',
            tokens_used: 15,
            confidence: 0.99
        }
    };
}
