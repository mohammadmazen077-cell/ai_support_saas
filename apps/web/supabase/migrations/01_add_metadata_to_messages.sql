-- Add metadata column to messages table
alter table messages
add column metadata jsonb default '{}'::jsonb;

-- Comment on column
comment on column messages.metadata is 'Flexible storage for AI related data (tokens, model name, confidence, etc)';
