-- Migration: hair_map_leads
-- Flow: Mapa Capilar AI (/mapa-capilar)
-- Run this in the Supabase SQL editor before going live.

create table if not exists public.hair_map_leads (
  id               uuid primary key default gen_random_uuid(),
  name             text,
  email            text,
  phone            text,
  age              integer,
  main_concern     text,
  duration         text,
  previous_treatment text,
  family_history   text,
  goal             text,
  final_interest   text,
  photo_url        text,
  report_json      jsonb,
  created_at       timestamptz default now()
);

-- Index for lookup by email
create index if not exists hair_map_leads_email_idx on public.hair_map_leads (email);

-- RLS: only service role can read; insert is open (lead capture)
alter table public.hair_map_leads enable row level security;

-- Allow anonymous inserts (lead capture from public flow)
create policy "hair_map_leads_insert_anon"
  on public.hair_map_leads
  for insert
  to anon, authenticated
  with check (true);

-- Only service role (admin) can select
create policy "hair_map_leads_select_service"
  on public.hair_map_leads
  for select
  using (auth.role() = 'service_role');
