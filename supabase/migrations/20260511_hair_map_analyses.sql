-- hair_map_analyses: stores the full AI-powered hair map analysis results
create table if not exists public.hair_map_analyses (
  id                 uuid primary key default gen_random_uuid(),
  concern            text,
  duration           text,
  previous_treatment text,
  family_history     text,
  goal               text,
  name               text,
  email              text,
  phone              text,
  age                integer,
  final_interest     text,
  photo_frontal_url  text,
  photo_crown_url    text,
  status             text not null default 'pending',
  analysis_json      jsonb,
  error_message      text,
  created_at         timestamptz not null default now()
);

alter table public.hair_map_analyses enable row level security;

-- Anyone can create an analysis record (the API uses service role, but this covers anon inserts too)
create policy "anon can insert hair_map_analyses"
  on public.hair_map_analyses for insert
  to anon, authenticated
  with check (true);

-- Only service role can read analyses (admin access only)
create policy "service_role can select hair_map_analyses"
  on public.hair_map_analyses for select
  to service_role
  using (true);

create policy "service_role can update hair_map_analyses"
  on public.hair_map_analyses for update
  to service_role
  using (true);
