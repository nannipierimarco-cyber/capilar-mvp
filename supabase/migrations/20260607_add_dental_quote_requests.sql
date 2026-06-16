-- dental_quote_requests — non-destructive migration
-- Run in Supabase SQL Editor (Dashboard → SQL Editor)

CREATE TABLE IF NOT EXISTS public.dental_quote_requests (
  id                        uuid primary key default gen_random_uuid(),
  -- Required fields (captured in form)
  patient_phone             text not null,
  patient_email             text not null,
  original_file_url         text not null,
  status                    text default 'submitted',
  created_at                timestamptz default now(),
  updated_at                timestamptz default now(),
  -- Optional fields (enriched by AI or admin)
  patient_name              text,
  preferred_commune         text,
  original_clinic_name      text,
  original_quote_amount     integer,
  main_treatment_type       text,
  extracted_summary         text,
  extracted_treatments      jsonb,
  missing_information       jsonb,
  assigned_clinic_id        uuid,
  assigned_doctor_name      text,
  partner_quote_amount      integer,
  partner_quote_details     jsonb,
  partner_quote_notes       text,
  partner_quote_submitted_at timestamptz,
  whatsapp_sent_at          timestamptz,
  appointment_url           text
);
