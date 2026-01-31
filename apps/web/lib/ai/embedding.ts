import OpenAI from 'openai';

// Validate that OPENAI_API_KEY is present
if (!process.env.OPENAI_API_KEY) {
    throw new Error(
        'OPENAI_API_KEY is not set. Please add it to your .env.local file.\n' +
        'Example: OPENAI_API_KEY=sk-...'
    );
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Generate an embedding vector for the given text using OpenAI's text-embedding-3-small model.
 * Returns a 1536-dimensional vector.
 */
export async function generateEmbedding(text: string): Promise<number[]> {
    try {
        const response = await openai.embeddings.create({
            model: 'text-embedding-3-small',
            input: text.trim(),
        });

        return response.data[0].embedding;
    } catch (error) {
        console.error('Error generating embedding:', error);
        throw new Error('Failed to generate embedding');
    }
}

/**
 * Chunk text into smaller pieces for embedding.
 * Simple implementation: splits by paragraphs/sentences with overlap.
 */
export function chunkText(text: string, chunkSize: number = 800, overlap: number = 100): string[] {
    const sentences = text.split(/[.!?]+/).filter(s => s.trim().length > 0);
    const chunks: string[] = [];
    let currentChunk = '';

    for (const sentence of sentences) {
        const trimmed = sentence.trim();
        if ((currentChunk + trimmed).length > chunkSize && currentChunk.length > 0) {
            chunks.push(currentChunk.trim());
            // Add overlap by keeping last part of previous chunk
            const words = currentChunk.split(' ');
            const overlapWords = words.slice(-Math.floor(overlap / 5)); // Rough word count for overlap
            currentChunk = overlapWords.join(' ') + ' ' + trimmed;
        } else {
            currentChunk += (currentChunk ? '. ' : '') + trimmed;
        }
    }

    if (currentChunk.trim().length > 0) {
        chunks.push(currentChunk.trim());
    }

    return chunks.filter(chunk => chunk.length > 50); // Filter out very small chunks
}
