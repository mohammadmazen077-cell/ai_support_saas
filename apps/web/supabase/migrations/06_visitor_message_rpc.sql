-- RPC for inserting visitor messages with validation.
-- Replaces reliance on permissive customer_messages_insert_public.
-- Ensures visitor_id matches the conversation before insert.
create or replace function insert_visitor_message(
  p_conversation_id uuid,
  p_visitor_id uuid,
  p_business_id uuid,
  p_content text
)
returns uuid
language plpgsql
security definer
as $$
declare
  v_msg_id uuid;
  v_conv_visitor_id uuid;
  v_conv_business_id uuid;
begin
  -- Validate conversation belongs to this visitor and business
  select visitor_id, business_id into v_conv_visitor_id, v_conv_business_id
  from customer_conversations
  where id = p_conversation_id;

  if v_conv_visitor_id is null or v_conv_visitor_id != p_visitor_id or v_conv_business_id != p_business_id then
    raise exception 'Conversation not found or access denied';
  end if;

  -- sender default 'ai' applies; column is for assistant messages only (ai vs human)
  insert into customer_messages (conversation_id, role, content)
  values (p_conversation_id, 'visitor', p_content)
  returning id into v_msg_id;

  return v_msg_id;
end;
$$;

-- Drop permissive public insert; visitor messages now go through insert_visitor_message RPC
drop policy if exists customer_messages_insert_public on customer_messages;
