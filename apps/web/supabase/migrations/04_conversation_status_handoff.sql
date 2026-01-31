-- Human handoff: conversation status and escalation
-- Add status and escalated_at to customer_conversations

alter table customer_conversations
  add column if not exists status text not null default 'open'
    check (status in ('open', 'waiting_for_human', 'closed')),
  add column if not exists escalated_at timestamptz;

comment on column customer_conversations.status is 'open | waiting_for_human | closed';
comment on column customer_conversations.escalated_at is 'Set when status becomes waiting_for_human';

-- Business owners can UPDATE their own customer conversations (e.g. mark closed, view)
create policy customer_conversations_update_for_business
  on customer_conversations
  for update
  to authenticated
  using ( business_id = (select auth.uid()) )
  with check ( business_id = (select auth.uid()) );

-- Business owners can INSERT messages into their own customer conversations (human replies)
create policy customer_messages_insert_for_business
  on customer_messages
  for insert
  to authenticated
  with check (
    exists (
      select 1 from customer_conversations c
      where c.id = customer_messages.conversation_id
      and c.business_id = (select auth.uid())
    )
  );

-- RPC: Escalate conversation to waiting_for_human (called from widget flow when AI hands off)
-- Security: Only allows escalation if conversation exists and matches visitor_id + business_id
-- so only the visitor in that conversation can trigger handoff (via our server action).
create or replace function escalate_customer_conversation(
  p_conversation_id uuid,
  p_visitor_id uuid,
  p_business_id uuid
)
returns void
language plpgsql
security definer
as $$
begin
  update customer_conversations
  set status = 'waiting_for_human',
      escalated_at = now(),
      updated_at = now()
  where id = p_conversation_id
    and visitor_id = p_visitor_id
    and business_id = p_business_id;
end;
$$;
