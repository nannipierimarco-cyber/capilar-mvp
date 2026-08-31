-- Dental quote comparison CRO rebuild: drop email requirement, add ad attribution
-- columns, and raise the dental-quotes bucket's own file-size/mime limits so the
-- browser can upload up to 20MB directly to Storage (bypassing Vercel Functions
-- entirely). Non-destructive — nullable columns and a bucket config bump only.

ALTER TABLE public.dental_quote_requests
  ALTER COLUMN patient_email DROP NOT NULL;

ALTER TABLE public.dental_quote_requests
  ADD COLUMN IF NOT EXISTS utm_source   text,
  ADD COLUMN IF NOT EXISTS utm_medium   text,
  ADD COLUMN IF NOT EXISTS utm_campaign text,
  ADD COLUMN IF NOT EXISTS utm_content  text,
  ADD COLUMN IF NOT EXISTS utm_term     text,
  ADD COLUMN IF NOT EXISTS fbclid       text,
  ADD COLUMN IF NOT EXISTS landing_path text,
  ADD COLUMN IF NOT EXISTS referrer     text;

-- Bucket-specific limit only (not a global Storage setting change). No-op if the
-- bucket doesn't exist yet in this environment — create it manually first via
-- the Supabase dashboard (Storage → New bucket → id "dental-quotes", private).
UPDATE storage.buckets
SET
  file_size_limit = 20971520, -- 20MB
  allowed_mime_types = ARRAY[
    'application/pdf',
    'image/png',
    'image/jpeg',
    'image/jpg',
    'image/webp',
    'image/heic',
    'image/heif',
    'application/octet-stream' -- some mobile browsers report HEIC without a proper mime type
  ]
WHERE id = 'dental-quotes';
