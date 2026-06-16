-- Whatsapp manual send tracking for dental_quote_requests
-- NOTE: these columns were added manually in Supabase Dashboard on 2026-06-15.
-- This migration documents them for reproducibility. Safe to run (ADD COLUMN IF NOT EXISTS).

ALTER TABLE public.dental_quote_requests
  ADD COLUMN IF NOT EXISTS clinic_whatsapp_phone    text,
  ADD COLUMN IF NOT EXISTS whatsapp_manual_message  text,
  ADD COLUMN IF NOT EXISTS whatsapp_manual_sent_at  timestamptz,
  ADD COLUMN IF NOT EXISTS whatsapp_manual_sent_by  text,
  ADD COLUMN IF NOT EXISTS whatsapp_manual_status   text;
