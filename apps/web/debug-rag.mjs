// Quick debug script to check RAG
import { createClient } from '@supabase/supabase-js';

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY
);

async function debug() {
    console.log('=== Checking Knowledge Sources ===');
    const { data: sources, error: sourcesError } = await supabase
        .from('knowledge_sources')
        .select('*');

    console.log('Sources:', sources);
    console.log('Sources Error:', sourcesError);

    console.log('\n=== Checking Knowledge Chunks ===');
    const { data: chunks, error: chunksError } = await supabase
        .from('knowledge_chunks')
        .select('id, business_id, source_id, content');

    console.log('Chunks:', chunks);
    console.log('Chunks Error:', chunksError);

    console.log('\n=== Checking RPC Function ===');
    // Try calling match_knowledge with a dummy embedding
    const dummyEmbedding = Array(1536).fill(0.1);
    const { data: matchData, error: matchError } = await supabase.rpc('match_knowledge', {
        p_business_id: chunks?.[0]?.business_id || '00000000-0000-0000-0000-000000000000',
        p_embedding: dummyEmbedding,
        p_match_threshold: 0.0,
        p_match_count: 5
    });

    console.log('Match Data:', matchData);
    console.log('Match Error:', matchError);
}

debug().then(() => process.exit(0)).catch(console.error);
