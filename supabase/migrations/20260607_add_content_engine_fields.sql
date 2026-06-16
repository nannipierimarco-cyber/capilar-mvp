-- Non-destructive migration: add content engine fields to scheduled_posts
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

ALTER TABLE scheduled_posts
  ADD COLUMN IF NOT EXISTS format             text,
  ADD COLUMN IF NOT EXISTS pillar             text,
  ADD COLUMN IF NOT EXISTS funnel_stage       text,
  ADD COLUMN IF NOT EXISTS target_persona     text,
  ADD COLUMN IF NOT EXISTS hook               text,
  ADD COLUMN IF NOT EXISTS cta                text,
  ADD COLUMN IF NOT EXISTS text_overlay       text,
  ADD COLUMN IF NOT EXISTS video_script       text,
  ADD COLUMN IF NOT EXISTS video_prompt       text,
  ADD COLUMN IF NOT EXISTS video_url          text,
  ADD COLUMN IF NOT EXISTS thumbnail_url      text,
  ADD COLUMN IF NOT EXISTS generation_status  text DEFAULT 'idea',
  ADD COLUMN IF NOT EXISTS quality_score      numeric,
  ADD COLUMN IF NOT EXISTS approval_notes     text,
  ADD COLUMN IF NOT EXISTS posted_at          timestamptz,
  ADD COLUMN IF NOT EXISTS instagram_post_id  text,
  ADD COLUMN IF NOT EXISTS performance_views    integer,
  ADD COLUMN IF NOT EXISTS performance_likes    integer,
  ADD COLUMN IF NOT EXISTS performance_comments integer,
  ADD COLUMN IF NOT EXISTS performance_saves    integer,
  ADD COLUMN IF NOT EXISTS performance_shares   integer,
  ADD COLUMN IF NOT EXISTS performance_reach    integer,
  ADD COLUMN IF NOT EXISTS lead_count           integer;
