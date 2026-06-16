-- Add RUT to dental quote comparison requests
ALTER TABLE public.dental_quote_requests
  ADD COLUMN IF NOT EXISTS patient_rut text;
