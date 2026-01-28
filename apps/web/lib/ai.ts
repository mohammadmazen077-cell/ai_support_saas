export async function generateAIResponse(
    messages: { role: string; content: string }[]
): Promise<{ content: string; metadata: any }> {
    // Simulate network latency
    await new Promise((resolve) => setTimeout(resolve, 1500));

    const lastMessage = messages[messages.length - 1];
    const history = messages.slice(0, -1);

    let content = `I received your message: "${lastMessage.content}". This is a simulated AI response.`;

    // Basic history awareness
    if (history.length > 0) {
        const userHistory = history.filter(m => m.role === 'user').map(m => m.content).join(", ");
        if (userHistory) {
            content += `\n\nI also see you previously mentioned: ${userHistory.substring(0, 50)}...`;
        }
    }

    return {
        content,
        metadata: {
            model: 'simulated-gpt-4',
            tokens_used: 15 + history.length * 5,
            confidence: 0.99
        }
    };
}

export function generateConversationTitle(firstMessage: string): string {
    // Basic rule-based title generation for now
    const words = firstMessage.split(' ');
    if (words.length <= 4) return firstMessage;
    return words.slice(0, 4).join(' ') + '...';
}
