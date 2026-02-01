-- Add notification timestamp to customer_conversations
alter table customer_conversations 
add column if not exists escalation_notified_at timestamptz;

-- Create settings table for businesses
create table if not exists business_settings (
  user_id uuid primary key references auth.users(id) on delete cascade,
  escalation_notifications_enabled boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- Enable RLS
alter table business_settings enable row level security;

-- Policies for business_settings
create policy business_settings_select_own
  on business_settings for select
  to authenticated
  using ( user_id = auth.uid() );

create policy business_settings_insert_own
  on business_settings for insert
  to authenticated
  with check ( user_id = auth.uid() );

create policy business_settings_update_own
  on business_settings for update
  to authenticated
  using ( user_id = auth.uid() );

-- Function to handle updated_at
create or replace function handle_updated_at()
returns trigger as $$
begin
  new.updated_at = now();
  return new;
end;
$$ language plpgsql;

create trigger handle_business_settings_updated_at
  before update on business_settings
  for each row
  execute function handle_updated_at();
