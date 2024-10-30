-- Create extension for UUID generation if not exists
create extension if not exists "uuid-ossp";

-- Create meeting_data table
create table if not exists meeting_data (
  id uuid default uuid_generate_v4() primary key,
  meeting_id text not null,
  client_reference_id text,
  transcript jsonb not null,
  intents jsonb not null,
  processed_at timestamp with time zone not null,
  created_at timestamp with time zone default now()
);

-- Create index for faster lookups
create index if not exists idx_meeting_data_meeting_id on meeting_data(meeting_id);

-- Add row level security policies
alter table meeting_data enable row level security;

-- Create policy for insert
create policy "Enable insert for authenticated users only"
  on meeting_data for insert
  to authenticated
  with check (true);

-- Create policy for select
create policy "Enable read access for authenticated users only"
  on meeting_data for select
  to authenticated
  using (true);

-- Create function to clean old data (optional, uncomment if needed)
-- create or replace function clean_old_meeting_data()
-- returns trigger as $$
-- begin
--   delete from meeting_data
--   where created_at < now() - interval '90 days';
--   return new;
-- end;
-- $$ language plpgsql;

-- Create trigger for cleaning old data (optional, uncomment if needed)
-- create trigger clean_old_data
--   after insert on meeting_data
--   execute procedure clean_old_meeting_data();

-- Add comments for documentation
comment on table meeting_data is 'Stores processed meeting data from Fireflies webhooks';
comment on column meeting_data.meeting_id is 'The Fireflies meeting ID';
comment on column meeting_data.client_reference_id is 'Optional client-provided reference ID';
comment on column meeting_data.transcript is 'The complete meeting transcript from Fireflies';
comment on column meeting_data.intents is 'Detected intents and their details';
comment on column meeting_data.processed_at is 'When the webhook was processed';
comment on column meeting_data.created_at is 'When the record was created';
