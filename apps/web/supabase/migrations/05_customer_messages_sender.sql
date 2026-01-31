-- Add sender to distinguish AI vs human replies for labeling in UI
alter table customer_messages
  add column if not exists sender text default 'ai' check (sender in ('ai', 'human'));

comment on column customer_messages.sender is 'ai = bot reply, human = business owner reply';
