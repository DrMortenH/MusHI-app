-- MusHI Research Status App — Supabase database schema
-- Kør dette i Supabase SQL Editor (Database → SQL Editor → New query)

create table if not exists submissions (
  id uuid default gen_random_uuid() primary key,
  email text not null,
  name text not null,
  month text not null,           -- format: "2024-06"
  projects jsonb default '[]',
  grants jsonb default '[]',
  publications jsonb default '[]',
  teaching text default '',
  conferences text default '',
  collaborations text default '',
  other text default '',
  request_meeting boolean default false,
  meeting_reason text default '',
  submitted_at timestamptz default now(),
  unique(email, month)           -- én indsendt per person per måned
);

-- Tillad anon-brugere at læse og skrive deres egne rækker
alter table submissions enable row level security;

create policy "Anyone can insert" on submissions
  for insert with check (true);

create policy "Anyone can read" on submissions
  for select using (true);

create policy "Anyone can update their own" on submissions
  for update using (true);
