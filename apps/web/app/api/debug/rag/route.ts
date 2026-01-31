import { createClient } from '@/utils/supabase/server';

export async function GET() {
    if (process.env.NODE_ENV === 'production') {
        return Response.json({ error: 'Not found' }, { status: 404 });
    }

    try {
        const supabase = await createClient();
        const { data: { user } } = await supabase.auth.getUser();

        if (!user) {
            return Response.json({ error: 'Not authenticated' }, { status: 401 });
        }

        const { data: sources, error: sourcesError } = await supabase
            .from('knowledge_sources')
            .select('*')
            .eq('business_id', user.id);

        const { data: chunks, error: chunksError } = await supabase
            .from('knowledge_chunks')
            .select('id, business_id, source_id, content, metadata, embedding')
            .eq('business_id', user.id);

        if (sourcesError || chunksError) {
            console.error('[DEBUG RAG] DB errors:', { sourcesError, chunksError });
            return Response.json(
                { error: 'Failed to fetch RAG status' },
                { status: 500 }
            );
        }

        const totalChunks = chunks?.length || 0;
        const chunksWithEmbeddings = chunks?.filter(c => c.embedding !== null).length || 0;
        const chunksMissingEmbeddings = totalChunks - chunksWithEmbeddings;
        const ragReady = totalChunks > 0 && chunksMissingEmbeddings === 0;

        const sourceStats = sources?.map(source => {
            const sourceChunks = chunks?.filter(c => c.source_id === source.id) || [];
            const withEmbeddings = sourceChunks.filter(c => c.embedding !== null).length;
            return {
                source_id: source.id,
                source_name: source.name,
                source_status: source.status,
                total_chunks: sourceChunks.length,
                chunks_with_embeddings: withEmbeddings,
                chunks_missing_embeddings: sourceChunks.length - withEmbeddings,
                is_ready: sourceChunks.length > 0 && withEmbeddings === sourceChunks.length
            };
        }) || [];

        return Response.json({
            business_id: user.id,
            rag_ready: ragReady,
            summary: {
                total_sources: sources?.length || 0,
                total_chunks: totalChunks,
                chunks_with_embeddings: chunksWithEmbeddings,
                chunks_missing_embeddings: chunksMissingEmbeddings,
                embedding_coverage: totalChunks > 0
                    ? `${Math.round((chunksWithEmbeddings / totalChunks) * 100)}%`
                    : '0%'
            },
            sources: sourceStats,
            chunks: chunks?.map(c => ({
                id: c.id,
                source_id: c.source_id,
                content_preview: c.content?.substring(0, 100),
                has_embedding: c.embedding !== null
            })) || [],
        });
    } catch {
        return Response.json({ error: 'Internal server error' }, { status: 500 });
    }
}
