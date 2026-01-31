'use server';

import { createClient } from '@/utils/supabase/server';
import { generateEmbedding, chunkText } from '@/lib/ai/embedding';
import { revalidatePath } from 'next/cache';
import { LIMITS } from '@/lib/validation';

/**
 * Add a text-based knowledge source
 */
export async function addTextSource(name: string, content: string) {
    if (typeof name !== 'string' || name.length > LIMITS.KNOWLEDGE_SOURCE_NAME_MAX || !name.trim()) {
        throw new Error('Invalid source name');
    }
    if (typeof content !== 'string' || content.length > LIMITS.KNOWLEDGE_SOURCE_CONTENT_MAX) {
        throw new Error('Content too large');
    }
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    let sourceId: string | null = null;

    try {
        // 1. Create the source record
        const { data: source, error: sourceError } = await supabase
            .from('knowledge_sources')
            .insert({
                business_id: user.id,
                type: 'text',
                name: name,
                status: 'processing'
            })
            .select()
            .single();

        if (sourceError) throw sourceError;
        sourceId = source.id;

        console.log(`[INGESTION] Processing source ${sourceId}...`);

        // 2. Process the content (this will throw if embedding fails)
        await processTextContent(source.id, user.id, content);

        // 3. Mark as ready ONLY if all embeddings succeeded
        const { error: updateError } = await supabase
            .from('knowledge_sources')
            .update({ status: 'ready' })
            .eq('id', source.id);

        if (updateError) throw updateError;

        console.log(`[INGESTION] Source ${sourceId} marked as ready`);

        revalidatePath('/dashboard/knowledge');
        return { success: true, sourceId: source.id };
    } catch (error) {
        console.error('[INGESTION] Error adding text source:', error);

        // Mark source as error if it was created
        if (sourceId) {
            try {
                await supabase
                    .from('knowledge_sources')
                    .update({ status: 'error' })
                    .eq('id', sourceId);
                console.error(`[INGESTION] Source ${sourceId} marked as error`);
            } catch (updateError) {
                console.error('[INGESTION] Failed to update source status:', updateError);
            }
        }

        throw error;
    }
}

/**
 * Process text content: chunk and embed
 */
async function processTextContent(sourceId: string, businessId: string, content: string) {
    const supabase = await createClient();

    try {
        // Chunk the text
        const chunks = chunkText(content, 800, 100);
        console.log(`[INGESTION] Created ${chunks.length} chunks for source ${sourceId}`);

        if (chunks.length === 0) {
            throw new Error('No valid chunks created from content');
        }

        // Generate embeddings and insert chunks
        let successCount = 0;
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            console.log(`[INGESTION] Processing chunk ${i + 1}/${chunks.length}...`);

            try {
                // Generate embedding
                const embedding = await generateEmbedding(chunk);

                if (!embedding || embedding.length !== 1536) {
                    throw new Error(`Invalid embedding dimensions: ${embedding?.length || 0}`);
                }

                const embeddingString = `[${embedding.join(',')}]`;

                // Insert chunk with embedding
                const { error: insertError } = await supabase
                    .from('knowledge_chunks')
                    .insert({
                        business_id: businessId,
                        source_id: sourceId,
                        content: chunk,
                        embedding: embeddingString,
                        metadata: {}
                    });

                if (insertError) {
                    throw insertError;
                }

                successCount++;
                console.log(`[INGESTION] Chunk ${i + 1}/${chunks.length} embedded successfully`);
            } catch (chunkError) {
                console.error(`[INGESTION] Failed to process chunk ${i + 1}:`, chunkError);
                throw new Error(`Failed to embed chunk ${i + 1}: ${chunkError instanceof Error ? chunkError.message : 'Unknown error'}`);
            }
        }

        console.log(`[INGESTION] Successfully processed ${successCount}/${chunks.length} chunks`);

        if (successCount !== chunks.length) {
            throw new Error(`Only ${successCount}/${chunks.length} chunks were successfully embedded`);
        }
    } catch (error) {
        console.error('[INGESTION] Error in processTextContent:', error);
        throw error;
    }
}

/**
 * Delete a knowledge source and all its chunks
 */
export async function deleteKnowledgeSource(sourceId: string) {
    const { validateUUID } = await import('@/lib/validation');
    validateUUID(sourceId, 'sourceId');

    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

    try {
        // Delete the source (chunks will cascade delete)
        const { error } = await supabase
            .from('knowledge_sources')
            .delete()
            .eq('id', sourceId)
            .eq('business_id', user.id); // Ensure user owns it

        if (error) throw error;

        revalidatePath('/dashboard/knowledge');
        return { success: true };
    } catch (error) {
        console.error('Error deleting source:', error);
        throw error;
    }
}
