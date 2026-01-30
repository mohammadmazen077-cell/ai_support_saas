import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from './embedding';

/**
 * Retrieve relevant context from the knowledge base for a given query.
 * Uses vector similarity search to find the most relevant chunks.
 */
export async function retrieveContext(businessId: string, query: string): Promise<string> {
    try {
        // Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        const supabase = await createClient();

        // Call the match_knowledge RPC function
        const { data, error } = await supabase.rpc('match_knowledge', {
            p_business_id: businessId,
            p_embedding: queryEmbedding,
            p_match_threshold: 0.7,
            p_match_count: 5
        });

        if (error) {
            console.error('Error retrieving knowledge:', error);
            return '';
        }

        if (!data || data.length === 0) {
            return '';
        }

        // Combine the retrieved chunks into context
        const contextChunks = data.map((chunk: any, idx: number) =>
            `[Context ${idx + 1}]:\n${chunk.content}`
        );

        return contextChunks.join('\n\n');
    } catch (error) {
        console.error('Error in retrieveContext:', error);
        return '';
    }
}
