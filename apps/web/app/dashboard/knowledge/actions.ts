'use server';

import { createClient } from '@/utils/supabase/server';
import { generateEmbedding, chunkText } from '@/lib/ai/embedding';
import { revalidatePath } from 'next/cache';

/**
 * Add a text-based knowledge source
 */
export async function addTextSource(name: string, content: string) {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) throw new Error('Not authenticated');

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

        // 2. Process the content
        await processTextContent(source.id, user.id, content);

        // 3. Mark as ready
        await supabase
            .from('knowledge_sources')
            .update({ status: 'ready' })
            .eq('id', source.id);

        revalidatePath('/dashboard/knowledge');
        return { success: true, sourceId: source.id };
    } catch (error) {
        console.error('Error adding text source:', error);
        throw error;
    }
}

/**
 * Process text content: chunk and embed
 */
async function processTextContent(sourceId: string, businessId: string, content: string) {
    const supabase = await createClient();

    // Chunk the text
    const chunks = chunkText(content, 800, 100);

    // Generate embeddings and insert chunks
    for (const chunk of chunks) {
        const embedding = await generateEmbedding(chunk);

        await supabase
            .from('knowledge_chunks')
            .insert({
                business_id: businessId,
                source_id: sourceId,
                content: chunk,
                embedding: embedding,
                metadata: {}
            });
    }
}

/**
 * Delete a knowledge source and all its chunks
 */
export async function deleteKnowledgeSource(sourceId: string) {
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
