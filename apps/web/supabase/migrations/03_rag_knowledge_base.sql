-- Enable vector extension for embeddings
create extension if not exists vector;

-- Knowledge Sources table
create table if not exists knowledge_sources (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  type text not null check (type in ('pdf', 'text', 'website')),
  name text not null,
  status text not null default 'processing' check (status in ('processing', 'ready', 'error')),
  created_at timestamptz not null default now()
);

alter table knowledge_sources enable row level security;

-- Knowledge Chunks table (stores embedded text chunks)
create table if not exists knowledge_chunks (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  source_id uuid not null references knowledge_sources(id) on delete cascade,
  content text not null,
  embedding vector(1536), -- OpenAI text-embedding-3-small dimensions
  metadata jsonb default '{}'::jsonb,
  created_at timestamptz not null default now()
);

alter table knowledge_chunks enable row level security;

-- RLS Policies for knowledge_sources
create policy knowledge_sources_select_for_owner
  on knowledge_sources
  for select
  to authenticated
  using ( business_id = (select auth.uid()) );

create policy knowledge_sources_insert_for_owner
  on knowledge_sources
  for insert
  to authenticated
  with check ( business_id = (select auth.uid()) );

create policy knowledge_sources_delete_for_owner
  on knowledge_sources
  for delete
  to authenticated
  using ( business_id = (select auth.uid()) );

create policy knowledge_sources_update_for_owner
  on knowledge_sources
  for update
  to authenticated
  using ( business_id = (select auth.uid()) )
  with check ( business_id = (select auth.uid()) );

-- RLS Policies for knowledge_chunks
create policy knowledge_chunks_select_for_owner
  on knowledge_chunks
  for select
  to authenticated
  using ( business_id = (select auth.uid()) );

create policy knowledge_chunks_insert_for_owner
  on knowledge_chunks
  for insert
  to authenticated
  with check ( business_id = (select auth.uid()) );

create policy knowledge_chunks_delete_for_owner
  on knowledge_chunks
  for delete
  to authenticated
  using ( business_id = (select auth.uid()) );

-- Indexes for performance
create index if not exists idx_knowledge_sources_business_id
  on knowledge_sources(business_id, created_at desc);

create index if not exists idx_knowledge_chunks_business_id
  on knowledge_chunks(business_id);

create index if not exists idx_knowledge_chunks_source_id
  on knowledge_chunks(source_id);

-- Vector similarity search index (HNSW for fast approximate search)
create index if not exists idx_knowledge_chunks_embedding
  on knowledge_chunks using hnsw (embedding vector_cosine_ops);

-- RPC Function: Match knowledge chunks using vector similarity
-- Security: Filters by business_id to ensure multi-tenant isolation
create or replace function match_knowledge(
  p_business_id uuid,
  p_embedding vector(1536),
  p_match_threshold float default 0.7,
  p_match_count int default 5
)
returns table (
  id uuid,
  source_id uuid,
  content text,
  metadata jsonb,
  similarity float
)
language plpgsql
security definer
as $$
begin
  return query
  select
    knowledge_chunks.id,
    knowledge_chunks.source_id,
    knowledge_chunks.content,
    knowledge_chunks.metadata,
    1 - (knowledge_chunks.embedding <=> p_embedding) as similarity
  from knowledge_chunks
  where knowledge_chunks.business_id = p_business_id
    and 1 - (knowledge_chunks.embedding <=> p_embedding) > p_match_threshold
  order by knowledge_chunks.embedding <=> p_embedding
  limit p_match_count;
end;
$$;
