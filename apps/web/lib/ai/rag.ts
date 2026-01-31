import { createClient } from '@/utils/supabase/server';
import { generateEmbedding } from './embedding';

export interface RetrieveContextResult {
    context: string;
    /** Top similarity score (0–1) or null if no chunks; used for handoff when low. */
    topSimilarity: number | null;
}

/**
 * Retrieve relevant context from the knowledge base for a given query.
 * Uses vector similarity search to find the most relevant chunks.
 */
export async function retrieveContext(
    businessId: string,
    query: string
): Promise<RetrieveContextResult> {
    try {

        const supabase = await createClient();

        // SAFETY CHECK: Verify at least one embedded chunk exists
        console.log('[RAG DEBUG] Checking for embedded chunks...');
        const { data: embeddedChunks, error: checkError } = await supabase
            .from('knowledge_chunks')
            .select('id')
            .eq('business_id', businessId)
            .not('embedding', 'is', null)
            .limit(1);

        if (checkError) {
            console.error('[RAG] Error checking for embedded chunks');
            return { context: '', topSimilarity: null };
        }

        if (!embeddedChunks || embeddedChunks.length === 0) {
            return { context: '', topSimilarity: null };
        }

        // 1. Generate embedding for the query
        const queryEmbedding = await generateEmbedding(query);

        // 2. Convert embedding array → pgvector string
        const vectorString = `[${queryEmbedding.join(',')}]`;

        // 3. Call the match_knowledge RPC function
        const { data, error } = await supabase.rpc('match_knowledge', {
            p_business_id: businessId,
            p_embedding: vectorString,
            p_match_threshold: 0.5,
            p_match_count: 5,
        });

        if (error) {
            console.error('[RAG] Error retrieving knowledge');
            return { context: '', topSimilarity: null };
        }

        if (!data || data.length === 0) {
            return { context: '', topSimilarity: null };
        }

        const topSimilarity = Math.max(...data.map((d: { similarity: number }) => d.similarity));

        // 4. Combine retrieved chunks into context
        const contextChunks = data.map(
            (chunk: any, idx: number) =>
                `[Context ${idx + 1}]\n${chunk.content} `
        );

        const finalContext = contextChunks.join('\n\n');
        return { context: finalContext, topSimilarity };
    } catch (error) {
        console.error('[RAG DEBUG] Error in retrieveContext:', error);
        return { context: '', topSimilarity: null };
    }
}
