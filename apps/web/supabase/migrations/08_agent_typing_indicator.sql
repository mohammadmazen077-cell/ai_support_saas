-- Agent typing indicator: set when human agent starts typing in reply input,
-- cleared when they send a reply or leave the conversation.
-- Widget hides "A human support agent will respond shortly" and shows three-dot animation while set.
alter table customer_conversations
  add column if not exists agent_typing_at timestamptz;

comment on column customer_conversations.agent_typing_at is 'Set when human agent focuses/types in reply input; cleared on send or when agent leaves. Used for widget typing indicator.';
