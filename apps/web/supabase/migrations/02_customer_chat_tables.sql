-- Create customer_conversations table
create table if not exists customer_conversations (
  id uuid primary key default gen_random_uuid(),
  business_id uuid not null references auth.users(id) on delete cascade,
  visitor_id uuid not null, -- Anonymous ID stored in localStorage
  source text default 'website',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table customer_conversations enable row level security;

-- Policy: Business owners can SELECT their own customer conversations
create policy customer_conversations_select_for_business
  on customer_conversations
  for select
  to authenticated
  using ( business_id = (select auth.uid()) );

-- Policy: Business owners can DELETE their own customer conversations
create policy customer_conversations_delete_for_business
  on customer_conversations
  for delete
  to authenticated
  using ( business_id = (select auth.uid()) );

-- Policy: ANYONE (anon) can INSERT a new conversation (visitor starting chat)
-- Security note: We allow inserting if the business_id is valid (enforced by FK).
-- We might want to restrict this in production (e.g., allow only if business ID exists), but FK handles existence.
create policy customer_conversations_insert_public
  on customer_conversations
  for insert
  to public
  with check ( true ); 

-- Policy: Public/Visitors can SELECT their OWN conversation (by visitor_id)
-- Note: Since we can't trust the client to just "say" they are a visitor ID for SELECTs without auth,
-- we'll rely on server action for fetching message history where we pass the visitor_id securely or verified.
-- BUT, for RLS simplicity to allow the `supabase.from().select()` to work if we used client client:
-- The problem is `current_setting` or similar isn't available for custom visitor IDs easily.
-- STRATEGY: We will largely manage "Visitor Read" access via SERVER ACTIONS that bypass RLS (using service role) OR 
-- we will just not expose RLS for select to public and force server-side fetching.
-- Let's enable business access. Visitors will read via our API which uses `getOrCreate...`.
-- Actually, for now, let's keep it simple: Business sees all. Visitor inserts.
-- Visitor reads: We'll handle this in the Server Action (using a privileged client or just logic validation).


-- Create customer_messages table
create table if not exists customer_messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references customer_conversations(id) on delete cascade,
  role text not null check (role in ('visitor','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

-- Enable RLS
alter table customer_messages enable row level security;

-- Policy: Business owners can SELECT messages for their conversations
create policy customer_messages_select_for_business
  on customer_messages
  for select
  to authenticated
  using (
    exists (
      select 1 from customer_conversations c
      where c.id = customer_messages.conversation_id
      and c.business_id = (select auth.uid())
    )
  );

-- Policy: Public/Visitors can INSERT messages into their conversations
-- We allow this so the Server Action can act on their behalf, or if we open client access.
create policy customer_messages_insert_public
  on customer_messages
  for insert
  to public
  with check (
    -- Ideally we check if they own the conversation, but anonymous users are hard to verify in Postgres RLS alone without headers.
    -- We will rely on the Server Action to enforce that the visitor_id matches before inserting.
    true
  );

-- Indexes
create index if not exists idx_customer_conversations_business_updated 
  on customer_conversations(business_id, updated_at desc);

create index if not exists idx_customer_messages_conversation_created
  on customer_messages(conversation_id, created_at asc);

-- RPC Function: Securely get or create a conversation for a visitor
-- Security Definer: Runs with admin privileges to bypass RLS for the anonymous visitor
create or replace function get_or_create_customer_conversation(
  p_business_id uuid, 
  p_visitor_id uuid
)
returns setof customer_conversations
language plpgsql
security definer
as $$
declare
  v_conv_id uuid;
begin
  -- Check if conversation exists
  select id into v_conv_id
  from customer_conversations
  where business_id = p_business_id
    and visitor_id = p_visitor_id;

  if v_conv_id is not null then
    return query select * from customer_conversations where id = v_conv_id;
  else
    -- Create new conversation
    return query insert into customer_conversations (business_id, visitor_id)
    values (p_business_id, p_visitor_id)
    returning *;
  end if;
end;
$$;

-- RPC Function: Securely fetch messages for a visitor
create or replace function get_customer_messages(
  p_business_id uuid,
  p_visitor_id uuid
)
returns setof customer_messages
language plpgsql
security definer
as $$
declare
  v_conv_id uuid;
begin
  -- Look up the conversation first to ensure we only get messages for this visitor+business pair
  select id into v_conv_id
  from customer_conversations
  where business_id = p_business_id
    and visitor_id = p_visitor_id;

  if v_conv_id is null then
    return; -- No conversation, no messages
  end if;

  return query select * from customer_messages
  where conversation_id = v_conv_id
  order by created_at asc;
end;
$$;
