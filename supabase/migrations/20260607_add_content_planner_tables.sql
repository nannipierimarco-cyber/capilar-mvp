-- AI Content Planner tables — non-destructive migration
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

-- 1. content_batches: groups posts from a single brief
CREATE TABLE IF NOT EXISTS public.content_batches (
  id               uuid primary key default gen_random_uuid(),
  title            text,
  vertical         text not null default 'dental',
  campaign_theme   text,
  brief_summary    text,
  user_prompt      text,
  objective        text,
  week_start       date,
  count            integer,
  status           text default 'draft',
  created_at       timestamptz default now(),
  updated_at       timestamptz default now()
);

-- 2. content_generation_requests: tracks each AI generation run
CREATE TABLE IF NOT EXISTS public.content_generation_requests (
  id               uuid primary key default gen_random_uuid(),
  batch_id         uuid references public.content_batches(id) on delete set null,
  vertical         text not null default 'dental',
  user_prompt      text not null,
  objective        text,
  count            integer default 7,
  week_start       date,
  target_persona   text,
  primary_cta      text,
  tone             text,
  formats_mix      jsonb,
  status           text default 'pending',
  error_message    text,
  created_at       timestamptz default now(),
  completed_at     timestamptz
);

-- 3. Add new columns to scheduled_posts
ALTER TABLE public.scheduled_posts
  ADD COLUMN IF NOT EXISTS batch_id               uuid references public.content_batches(id) on delete set null,
  ADD COLUMN IF NOT EXISTS generation_request_id  uuid references public.content_generation_requests(id) on delete set null,
  ADD COLUMN IF NOT EXISTS creative_brief         jsonb,
  ADD COLUMN IF NOT EXISTS visual_direction       text,
  ADD COLUMN IF NOT EXISTS thumbnail_prompt       text,
  ADD COLUMN IF NOT EXISTS content_objective      text;
