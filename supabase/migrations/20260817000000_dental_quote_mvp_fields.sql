-- MVP simplification: capture-only dental quote flow (no auto WhatsApp, no signed upload from frontend)
-- Non-destructive — adds columns only, no data loss.

-- original_file_url is superseded by storage_path (we generate short-lived signed
-- URLs on demand instead of persisting a long-lived one). Drop NOT NULL so new
-- inserts can omit it; existing rows keep their value untouched.
ALTER TABLE public.dental_quote_requests
  ALTER COLUMN original_file_url DROP NOT NULL;

ALTER TABLE public.dental_quote_requests
  ADD COLUMN IF NOT EXISTS storage_path             text,
  ADD COLUMN IF NOT EXISTS original_file_name        text,
  ADD COLUMN IF NOT EXISTS original_file_mime_type   text,
  ADD COLUMN IF NOT EXISTS original_file_size        integer,
  ADD COLUMN IF NOT EXISTS source                    text default 'quote_comparison',
  ADD COLUMN IF NOT EXISTS clinic_batch_sent_at      timestamptz,
  ADD COLUMN IF NOT EXISTS clinic_batch_notes        text;
