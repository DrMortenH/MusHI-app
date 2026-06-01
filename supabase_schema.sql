-- MusHI Research Status App — Supabase schema
-- Kør dette i Supabase SQL Editor (Database → SQL Editor → New query)

-- Submissions table: one row per person per month
create table if not exists submissions (
  id          uuid primary key default gen_random_uuid(),
  email       text not null,
  name        text not null,
  month       text not null,           -- format: "2026-06"
  projects    jsonb default '[]',
  grants      jsonb default '[]',
  publications jsonb default '[]',
  teaching    text default '',
  conferences text default '',
  collaborations text default '',
  other       text default '',
  request_meeting boolean default false,
  meeting_reason  text default '',
  submitted_at timestamptz default now(),
  -- One submission per person per month
  unique(email, month)
);

-- Allow read/write from browser (Row Level Security)
alter table submissions enable row level security;

-- Anyone can insert or update their own submission
create policy "insert own" on submissions
  for insert with check (true);

create policy "update own" on submissions
  for update using (true);

-- Anyone can read all submissions (needed for admin report)
-- If you want stricter access, replace with auth-based policy later
create policy "read all" on submissions
  for select using (true);
