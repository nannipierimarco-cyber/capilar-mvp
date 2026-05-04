-- Skin Copilot — Supabase Schema
-- Run after schema.sql (main MVP tables must exist first)

-- ─── Users ────────────────────────────────────────────────────────────────────
create table if not exists public.skin_copilot_users (
  id             uuid primary key default gen_random_uuid(),
  phone_number   text not null unique,
  created_at     timestamptz default now()
);

-- ─── Skin profiles ────────────────────────────────────────────────────────────
create table if not exists public.skin_profiles (
  id                   uuid primary key default gen_random_uuid(),
  user_id              uuid not null references public.skin_copilot_users(id) on delete cascade,
  skin_type            text check (skin_type in ('oily', 'dry', 'combination', 'sensitive', 'normal')),
  main_concern         text,   -- acne, aging, redness, pigmentation, etc.
  sensitivity          text check (sensitivity in ('low', 'medium', 'high')),
  allergies            text,
  current_products     text,
  previous_treatments  text,
  doctor_notes         text,
  updated_at           timestamptz default now(),
  unique (user_id)
);

-- ─── Skin photos (Phase 2 — stored in Supabase Storage) ──────────────────────
create table if not exists public.skin_photos (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.skin_copilot_users(id) on delete cascade,
  storage_path text not null,   -- path inside Supabase Storage bucket
  photo_type   text check (photo_type in ('face_front', 'face_left', 'face_right', 'close_up', 'other')),
  created_at   timestamptz default now()
);

-- ─── WhatsApp messages ────────────────────────────────────────────────────────
create table if not exists public.whatsapp_messages (
  id                  uuid primary key default gen_random_uuid(),
  user_id             uuid not null references public.skin_copilot_users(id) on delete cascade,
  whatsapp_message_id text unique,                  -- Meta message ID (null for outbound/test)
  direction           text not null check (direction in ('inbound', 'outbound')),
  message_type        text not null default 'text',
  message_text        text,
  media_url           text,
  risk_level          text check (risk_level in ('green', 'yellow', 'red')),
  action              text,
  created_at          timestamptz default now()
);

-- ─── AI interactions log ──────────────────────────────────────────────────────
create table if not exists public.ai_interactions (
  id                uuid primary key default gen_random_uuid(),
  user_id           uuid not null references public.skin_copilot_users(id) on delete cascade,
  user_question     text not null,
  retrieved_context jsonb,
  ai_answer         text,
  risk_level        text check (risk_level in ('green', 'yellow', 'red')),
  action            text,
  model             text default 'gpt-4o-mini',
  latency_ms        integer,
  created_at        timestamptz default now()
);

-- ─── Consent log (PDPA / HIPAA baseline) ────────────────────────────────────
create table if not exists public.consents (
  id           uuid primary key default gen_random_uuid(),
  user_id      uuid not null references public.skin_copilot_users(id) on delete cascade,
  consent_type text not null,   -- 'data_processing', 'ai_assistance', 'marketing'
  granted      boolean not null default true,
  ip_address   text,
  user_agent   text,
  granted_at   timestamptz default now()
);

-- ─── Doctor escalation queue ──────────────────────────────────────────────────
create table if not exists public.doctor_escalations (
  id               uuid primary key default gen_random_uuid(),
  user_id          uuid not null references public.skin_copilot_users(id) on delete cascade,
  reason           text,
  message_snapshot text,
  risk_level       text check (risk_level in ('yellow', 'red')),
  status           text not null default 'pending' check (status in ('pending', 'reviewed', 'resolved', 'dismissed')),
  reviewed_by      text,
  reviewed_at      timestamptz,
  notes            text,
  created_at       timestamptz default now()
);

-- ─── Row-level security ───────────────────────────────────────────────────────
-- Service role bypasses RLS — all reads/writes go through the backend.
-- Anon/authenticated users have no direct access.

alter table public.skin_copilot_users   enable row level security;
alter table public.skin_profiles        enable row level security;
alter table public.skin_photos          enable row level security;
alter table public.whatsapp_messages    enable row level security;
alter table public.ai_interactions      enable row level security;
alter table public.consents             enable row level security;
alter table public.doctor_escalations   enable row level security;

-- ─── Indexes ──────────────────────────────────────────────────────────────────
create index if not exists idx_whatsapp_messages_user_created
  on public.whatsapp_messages (user_id, created_at desc);

create index if not exists idx_ai_interactions_user_created
  on public.ai_interactions (user_id, created_at desc);

create index if not exists idx_doctor_escalations_status
  on public.doctor_escalations (status, created_at desc);
