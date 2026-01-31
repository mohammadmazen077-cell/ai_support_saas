import dotenv from 'dotenv';
import path from 'path';
import { createClient } from '@supabase/supabase-js';

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });

console.log('Testing Supabase Connection...\n');
console.log('URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('Service Role Key (first 20 chars):', process.env.SUPABASE_SERVICE_ROLE_KEY?.substring(0, 20));

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim()
);

async function test() {
    // Test 1: Check if we can query knowledge_chunks
    console.log('\n1. Checking knowledge_chunks table...');
    const { data, error, count } = await supabase
        .from('knowledge_chunks')
        .select('*', { count: 'exact', head: false });

    if (error) {
        console.error('ERROR:', error);
        return;
    }

    console.log(`Found ${count} total chunks`);
    if (data && data.length > 0) {
        console.log('Sample chunk:', {
            id: data[0].id,
            has_embedding: !!data[0].embedding,
            content_preview: data[0].content?.substring(0, 50)
        });
    }

    // Test 2: Check chunks without embeddings
    console.log('\n2. Checking chunks without embeddings...');
    const { data: nullEmbeddings, error: nullError } = await supabase
        .from('knowledge_chunks')
        .select('id, content')
        .is('embedding', null);

    if (nullError) {
        console.error('ERROR:', nullError);
        return;
    }

    console.log(`Found ${nullEmbeddings?.length || 0} chunks without embeddings`);
}

test().catch(console.error);
