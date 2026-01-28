-- Enable pgcrypto extension if not already (for gen_random_uuid)
create extension if not exists pgcrypto;

-- Ensure auth.users table exists and RLS is enabled there already
-- (Your statement enabling RLS on auth.users is fine if you intended it)

-- Conversations table: stricter types and audit columns
create table if not exists conversations (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  title text not null default ''::text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table conversations enable row level security;

-- Messages table: enforce not nulls, role enum-like constraint, FK with cascade
create table if not exists messages (
  id uuid primary key default gen_random_uuid(),
  conversation_id uuid not null references conversations(id) on delete cascade,
  role text not null check (role in ('user','assistant')),
  content text not null,
  created_at timestamptz not null default now()
);

alter table messages enable row level security;

-- Helper: use (SELECT auth.uid()) for planner stability and to avoid NULL pitfalls
-- Policies on conversations
create policy conversations_select_for_owner
  on conversations
  for select
  to authenticated
  using ( (SELECT auth.uid()) = user_id );

create policy conversations_insert_for_owner
  on conversations
  for insert
  to authenticated
  with check ( (SELECT auth.uid()) = user_id );

create policy conversations_update_for_owner
  on conversations
  for update
  to authenticated
  using ( (SELECT auth.uid()) = user_id )
  with check ( (SELECT auth.uid()) = user_id );

create policy conversations_delete_for_owner
  on conversations
  for delete
  to authenticated
  using ( (SELECT auth.uid()) = user_id );

-- Policies on messages: restrict by conversation ownership
create policy messages_select_for_owner
  on messages
  for select
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = (SELECT auth.uid())
    )
  );

create policy messages_insert_for_owner
  on messages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = (SELECT auth.uid())
    )
  );

create policy messages_update_for_owner
  on messages
  for update
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = (SELECT auth.uid())
    )
  )
  with check (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = (SELECT auth.uid())
    )
  );

create policy messages_delete_for_owner
  on messages
  for delete
  to authenticated
  using (
    exists (
      select 1 from conversations c
      where c.id = messages.conversation_id
      and c.user_id = (SELECT auth.uid())
    )
  );

-- Indexes: add useful ones for common queries
-- Conversations by user (covering index on updated_at for ordering recent)
create index if not exists idx_conversations_user_id_updated_at
  on conversations(user_id, updated_at desc);

-- Messages by conversation + created_at for efficient pagination
create index if not exists idx_messages_conversation_created_at
  on messages(conversation_id, created_at desc);

-- Optional: partial index for assistant messages if you frequently query them
create index if not exists idx_messages_conversation_role_created_at
  on messages(conversation_id, created_at desc)
  where role = 'assistant';

-- Trigger to keep updated_at current on conversations
create or replace function conversations_set_updated_at()
returns trigger language plpgsql security definer as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists trg_conversations_updated_at on conversations;
create trigger trg_conversations_updated_at
  before update on conversations
  for each row execute function conversations_set_updated_at();