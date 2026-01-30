import { createClient } from '@/utils/supabase/server';
import { addTextSource, deleteKnowledgeSource } from './actions';
import KnowledgeBaseClient from '@/app/dashboard/knowledge/knowledge-client';

export default async function KnowledgeBasePage() {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
        return <div>Please log in</div>;
    }

    // Fetch knowledge sources with chunk count
    const { data: sources, error } = await supabase
        .from('knowledge_sources')
        .select(`
            *,
            chunks:knowledge_chunks(count)
        `)
        .eq('business_id', user.id)
        .order('created_at', { ascending: false });

    if (error) {
        console.error('Error fetching knowledge sources:', error);
        return <div>Error loading knowledge base</div>;
    }

    return <KnowledgeBaseClient sources={sources || []} />;
}
