import dotenv from 'dotenv';
import path from 'path';

// Load environment variables from .env.local
dotenv.config({ path: path.resolve(process.cwd(), '.env.local') });
import OpenAI from 'openai';
import { createClient } from '@supabase/supabase-js';

// ============================================================================
// Environment Validation
// ============================================================================

function validateEnvironment() {
    const required = [
        'OPENAI_API_KEY',
        'NEXT_PUBLIC_SUPABASE_URL',
        'SUPABASE_SERVICE_ROLE_KEY'
    ];

    const missing = required.filter(key => !process.env[key]);

    if (missing.length > 0) {
        console.error('❌ Missing required environment variables:');
        missing.forEach(key => console.error(`   - ${key}`));
        console.error('\n💡 Make sure .env.local exists and contains all required keys');
        process.exit(1);
    }

    console.log('✅ Environment variables validated');
    console.log('   - SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
    console.log('   - SERVICE_ROLE_KEY length:', process.env.SUPABASE_SERVICE_ROLE_KEY?.length);
    console.log('   - OPENAI_API_KEY length:', process.env.OPENAI_API_KEY?.length);
}

// ============================================================================
// Initialize Clients
// ============================================================================

validateEnvironment();

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY!.trim(),
});

const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!.trim(),
    process.env.SUPABASE_SERVICE_ROLE_KEY!.trim() // IMPORTANT: Service role for admin access
);

// ============================================================================
// Backfill Logic
// ============================================================================

interface BackfillStats {
    totalChunks: number;
    successCount: number;
    failureCount: number;
    skippedCount: number;
}

async function embedChunkWithRetry(
    chunkId: string,
    content: string,
    maxRetries: number = 3
): Promise<boolean> {
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            // Generate embedding
            const embeddingResponse = await openai.embeddings.create({
                model: 'text-embedding-3-small',
                input: content,
            });

            const embedding = embeddingResponse.data[0].embedding;

            // Validate embedding
            if (!embedding || embedding.length !== 1536) {
                throw new Error(`Invalid embedding: expected 1536 dimensions, got ${embedding?.length || 0}`);
            }

            // Update database
            const { error: updateError } = await supabase
                .from('knowledge_chunks')
                .update({ embedding })
                .eq('id', chunkId);

            if (updateError) {
                throw updateError;
            }

            // Verify the update
            const { data: verifyData, error: verifyError } = await supabase
                .from('knowledge_chunks')
                .select('embedding')
                .eq('id', chunkId)
                .single();

            if (verifyError || !verifyData?.embedding) {
                throw new Error('Embedding verification failed');
            }

            return true;
        } catch (error: any) {
            console.error(`   ⚠️  Attempt ${attempt}/${maxRetries} failed:`, error.message);

            if (attempt < maxRetries) {
                const delay = Math.min(1000 * Math.pow(2, attempt - 1), 5000);
                console.log(`   ⏳ Retrying in ${delay}ms...`);
                await new Promise(resolve => setTimeout(resolve, delay));
            }
        }
    }

    return false;
}

async function run() {
    console.log('🚀 Starting Knowledge Embedding Backfill\n');
    console.log('='.repeat(60));

    const stats: BackfillStats = {
        totalChunks: 0,
        successCount: 0,
        failureCount: 0,
        skippedCount: 0,
    };

    try {
        // Fetch chunks without embeddings
        console.log('🔍 Fetching chunks without embeddings...');

        const { data: chunks, error } = await supabase
            .from('knowledge_chunks')
            .select('id, content, business_id, source_id')
            .is('embedding', null);

        if (error) {
            console.error('❌ Database error:', error);
            process.exit(1);
        }

        if (!chunks || chunks.length === 0) {
            console.log('✅ No chunks need embeddings - all chunks are already indexed!');
            return;
        }

        stats.totalChunks = chunks.length;
        console.log(`📦 Found ${chunks.length} chunks needing embeddings\n`);

        // Process each chunk
        for (let i = 0; i < chunks.length; i++) {
            const chunk = chunks[i];
            const progress = `[${i + 1}/${chunks.length}]`;

            console.log(`${progress} 🧠 Processing chunk ${chunk.id.substring(0, 8)}...`);

            // Skip empty content
            if (!chunk.content || chunk.content.trim().length === 0) {
                console.log(`${progress} ⏭️  Skipped (empty content)`);
                stats.skippedCount++;
                continue;
            }

            // Embed with retry
            const success = await embedChunkWithRetry(chunk.id, chunk.content);

            if (success) {
                console.log(`${progress} ✅ Successfully embedded`);
                stats.successCount++;
            } else {
                console.log(`${progress} ❌ Failed after retries`);
                stats.failureCount++;
            }

            console.log(''); // Blank line for readability
        }

        // Print summary
        console.log('='.repeat(60));
        console.log('📊 Backfill Summary\n');
        console.log(`   Total chunks processed:  ${stats.totalChunks}`);
        console.log(`   ✅ Successfully embedded: ${stats.successCount}`);
        console.log(`   ❌ Failed:                ${stats.failureCount}`);
        console.log(`   ⏭️  Skipped (empty):       ${stats.skippedCount}`);
        console.log('');

        if (stats.failureCount > 0) {
            console.log('⚠️  Some chunks failed to embed. Please check the errors above.');
            process.exit(1);
        } else {
            console.log('🎉 Embedding backfill complete! All chunks now have embeddings.');
        }

    } catch (error: any) {
        console.error('\n❌ Fatal error during backfill:', error.message);
        console.error(error);
        process.exit(1);
    }
}

run();
