-- Agent typing indicator: set when human starts sending, cleared when message is inserted
-- Allows the customer widget to show typing dots while the server action is pending
alter table customer_conversations
  add column if not exists agent_sending_at timestamptz;

comment on column customer_conversations.agent_sending_at is 'Set when human agent starts sending a reply, cleared when message is inserted. Used for widget typing indicator.';
